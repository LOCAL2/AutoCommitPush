#![allow(dead_code)]
use git2::{
    Cred, FetchOptions, PushOptions, RemoteCallbacks, Repository, Signature, StatusOptions,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct RepoStatus {
    pub is_git_repo: bool,
    pub has_gitignore: bool,
    pub branch: Option<String>,
    pub last_commit: Option<String>,
    pub last_commit_time: Option<String>,
    pub remote_url: Option<String>,
    pub pending_changes: u32,
    pub untracked: Vec<String>,
    pub modified: Vec<String>,
    pub staged: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileDiff {
    pub path: String,
    pub lines: Vec<DiffLine>,
    pub additions: u32,
    pub deletions: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiffLine {
    pub origin: String,   // "+" | "-" | " "
    pub content: String,
    pub old_lineno: Option<u32>,
    pub new_lineno: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileChange {
    pub path: String,
    pub status: String,
    pub is_staged: bool,
}

#[command]
pub fn init_repository(path: String) -> Result<String, String> {
    let _repo = Repository::init(&path).map_err(|e| e.to_string())?;
    Ok(format!("Repository initialized at {}", path))
}

#[command]
pub fn get_repo_status(path: String) -> Result<RepoStatus, String> {
    let path = Path::new(&path);

    let is_git = path.join(".git").exists();
    let has_gitignore = path.join(".gitignore").exists();

    if !is_git {
        return Ok(RepoStatus {
            is_git_repo: false,
            has_gitignore,
            branch: None,
            last_commit: None,
            last_commit_time: None,
            remote_url: None,
            pending_changes: 0,
            untracked: vec![],
            modified: vec![],
            staged: vec![],
        });
    }

    let repo = Repository::open(path).map_err(|e| e.to_string())?;

    // Read branch name — works even on unborn HEAD (no commits yet)
    let branch = repo
        .head()
        .ok()
        .and_then(|h| h.shorthand().map(|s| s.to_string()))
        .or_else(|| {
            // HEAD is unborn: read refs/heads/<name> from .git/HEAD directly
            let head_path = path.join(".git").join("HEAD");
            std::fs::read_to_string(head_path).ok().and_then(|content| {
                content
                    .trim()
                    .strip_prefix("ref: refs/heads/")
                    .map(|s| s.to_string())
            })
        })
        .or_else(|| Some("main".to_string())); // fallback

    let (last_commit, last_commit_time) = repo
        .head()
        .ok()
        .and_then(|h| h.peel_to_commit().ok())
        .map(|c| {
            let msg = c.message().unwrap_or("").lines().next().unwrap_or("").to_string();
            let time = chrono::DateTime::from_timestamp(c.time().seconds(), 0)
                .map(|dt: chrono::DateTime<chrono::Utc>| dt.format("%Y-%m-%d %H:%M").to_string())
                .unwrap_or_default();
            (Some(msg), Some(time))
        })
        .unwrap_or((None, None));

    let remote_url = repo
        .find_remote("origin")
        .ok()
        .and_then(|r| r.url().map(|u| u.to_string()));

    let mut status_opts = StatusOptions::new();
    status_opts.include_untracked(true).recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut status_opts)).map_err(|e| e.to_string())?;

    let mut untracked = vec![];
    let mut modified = vec![];
    let mut staged = vec![];

    for entry in statuses.iter() {
        let path_str = entry.path().unwrap_or("").to_string();
        let status = entry.status();

        if status.contains(git2::Status::WT_NEW) {
            untracked.push(path_str.clone());
        }
        if status.contains(git2::Status::WT_MODIFIED) || status.contains(git2::Status::WT_DELETED) {
            modified.push(path_str.clone());
        }
        if status.contains(git2::Status::INDEX_NEW)
            || status.contains(git2::Status::INDEX_MODIFIED)
            || status.contains(git2::Status::INDEX_DELETED)
        {
            staged.push(path_str.clone());
        }
    }

    let pending_changes = (untracked.len() + modified.len()) as u32;

    Ok(RepoStatus {
        is_git_repo: true,
        has_gitignore,
        branch,
        last_commit,
        last_commit_time,
        remote_url,
        pending_changes,
        untracked,
        modified,
        staged,
    })
}

#[command]
pub fn get_file_diff(path: String, file_path: Option<String>) -> Result<Vec<FileDiff>, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let repo_root = Path::new(&path);

    if let Some(ref fp) = file_path {
        let norm_fp = normalize_git_path(fp);

        // Untracked files: git diff often returns empty — read file directly
        if is_path_untracked(&repo, fp) {
            return Ok(vec![read_file_as_additions(repo_root, fp, &norm_fp)?]);
        }

        let mut diff_opts = git2::DiffOptions::new();
        diff_opts.pathspec(&norm_fp);
        diff_opts.include_untracked(true);
        diff_opts.recurse_untracked_dirs(true);
        diff_opts.force_text(true);

        let results = compute_diff(&repo, &mut diff_opts)?;
        if let Some(diff) = results
            .into_iter()
            .find(|d| normalize_git_path(&d.path) == norm_fp)
        {
            if !diff.lines.is_empty() {
                return Ok(vec![diff]);
            }
        }

        // Retry pathspec with original path (Windows backslash)
        if fp.contains('\\') {
            let mut retry_opts = git2::DiffOptions::new();
            retry_opts.pathspec(fp);
            retry_opts.include_untracked(true);
            retry_opts.recurse_untracked_dirs(true);
            retry_opts.force_text(true);
            let retry = compute_diff(&repo, &mut retry_opts)?;
            if let Some(diff) = retry
                .into_iter()
                .find(|d| normalize_git_path(&d.path) == norm_fp)
            {
                if !diff.lines.is_empty() {
                    return Ok(vec![diff]);
                }
            }
        }

        return Ok(vec![]);
    }

    let mut diff_opts = git2::DiffOptions::new();
    diff_opts.include_untracked(true);
    diff_opts.recurse_untracked_dirs(true);
    diff_opts.force_text(true);

    let mut results = compute_diff(&repo, &mut diff_opts)?;
    let mut seen: std::collections::HashSet<String> = results
        .iter()
        .map(|d| normalize_git_path(&d.path))
        .collect();

    // Ensure untracked files appear even if git diff skipped them
    let mut status_opts = StatusOptions::new();
    status_opts.include_untracked(true).recurse_untracked_dirs(true);
    if let Ok(statuses) = repo.statuses(Some(&mut status_opts)) {
        for entry in statuses.iter() {
            if entry.status().contains(git2::Status::WT_NEW) {
                let rel = entry.path().unwrap_or("").to_string();
                let norm = normalize_git_path(&rel);
                if !seen.contains(&norm) {
                    seen.insert(norm.clone());
                    if let Ok(diff) = read_file_as_additions(repo_root, &rel, &norm) {
                        results.push(diff);
                    }
                }
            }
        }
    }

    let max_lines = 200;
    Ok(results
        .into_iter()
        .take(200)
        .map(|mut f| {
            if f.lines.len() > max_lines {
                f.lines.truncate(max_lines);
            }
            f
        })
        .collect())
}

fn normalize_git_path(path: &str) -> String {
    path.replace('\\', "/")
}

fn is_path_untracked(repo: &Repository, rel_path: &str) -> bool {
    let norm = normalize_git_path(rel_path);
    let mut opts = StatusOptions::new();
    opts.include_untracked(true);
    if let Ok(statuses) = repo.statuses(Some(&mut opts)) {
        for entry in statuses.iter() {
            let entry_path = entry.path().map(|p| normalize_git_path(p)).unwrap_or_default();
            if entry_path == norm && entry.status().contains(git2::Status::WT_NEW) {
                return true;
            }
        }
    }
    false
}

fn read_file_as_additions(
    repo_root: &Path,
    rel_path: &str,
    display_path: &str,
) -> Result<FileDiff, String> {
    let full = repo_root.join(rel_path);
    if !full.exists() {
        return Err(format!("File not found: {}", rel_path));
    }

    let bytes = std::fs::read(&full).map_err(|e| e.to_string())?;
    if bytes.contains(&0) {
        return Ok(FileDiff {
            path: display_path.to_string(),
            lines: vec![DiffLine {
                origin: " ".to_string(),
                content: "Binary file — cannot display diff".to_string(),
                old_lineno: None,
                new_lineno: None,
            }],
            additions: 0,
            deletions: 0,
        });
    }

    let text = String::from_utf8_lossy(&bytes);
    let mut lines = Vec::new();
    for (i, line) in text.lines().enumerate() {
        lines.push(DiffLine {
            origin: "+".to_string(),
            content: line.to_string(),
            old_lineno: None,
            new_lineno: Some((i + 1) as u32),
        });
    }

    if lines.is_empty() {
        lines.push(DiffLine {
            origin: "+".to_string(),
            content: "(empty file)".to_string(),
            old_lineno: None,
            new_lineno: Some(1),
        });
    }

    let additions = lines.len() as u32;
    Ok(FileDiff {
        path: display_path.to_string(),
        lines,
        additions,
        deletions: 0,
    })
}

fn compute_diff(
    repo: &Repository,
    diff_opts: &mut git2::DiffOptions,
) -> Result<Vec<FileDiff>, String> {
    let diff = if let Ok(head) = repo.head() {
        if let Ok(commit) = head.peel_to_commit() {
            if let Ok(tree) = commit.tree() {
                repo.diff_tree_to_workdir_with_index(Some(&tree), Some(diff_opts))
                    .map_err(|e| e.to_string())?
            } else {
                repo.diff_index_to_workdir(None, Some(diff_opts))
                    .map_err(|e| e.to_string())?
            }
        } else {
            repo.diff_index_to_workdir(None, Some(diff_opts))
                .map_err(|e| e.to_string())?
        }
    } else {
        repo.diff_index_to_workdir(None, Some(diff_opts))
            .map_err(|e| e.to_string())?
    };

    let mut map: HashMap<String, FileDiff> = HashMap::new();

    diff.print(git2::DiffFormat::Patch, |delta, _hunk, line| {
        let file_path = delta
            .new_file()
            .path()
            .or_else(|| delta.old_file().path())
            .map(|p| normalize_git_path(&p.to_string_lossy()))
            .unwrap_or_default();

        if file_path.is_empty() {
            return true;
        }

        let origin = line.origin();
        if origin != '+' && origin != '-' && origin != ' ' {
            return true;
        }

        let content = std::str::from_utf8(line.content()).unwrap_or("");
        let entry = map.entry(file_path.clone()).or_insert_with(|| FileDiff {
            path: file_path.clone(),
            lines: Vec::new(),
            additions: 0,
            deletions: 0,
        });

        match origin {
            '+' => entry.additions += 1,
            '-' => entry.deletions += 1,
            _ => {}
        }
        entry.lines.push(DiffLine {
            origin: origin.to_string(),
            content: content.trim_end_matches('\n').to_string(),
            old_lineno: line.old_lineno(),
            new_lineno: line.new_lineno(),
        });
        true
    })
    .map_err(|e| e.to_string())?;

    Ok(map.into_values().collect())
}

#[command]
pub fn get_file_changes(path: String) -> Result<Vec<FileChange>, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut status_opts = StatusOptions::new();
    status_opts.include_untracked(true).recurse_untracked_dirs(true);

    let statuses = repo.statuses(Some(&mut status_opts)).map_err(|e| e.to_string())?;
    let mut changes = vec![];

    for entry in statuses.iter() {
        let file_path = entry.path().unwrap_or("").to_string();
        let status = entry.status();

        let (status_str, is_staged) = if status.contains(git2::Status::INDEX_NEW) {
            ("Added".to_string(), true)
        } else if status.contains(git2::Status::INDEX_MODIFIED) {
            ("Modified".to_string(), true)
        } else if status.contains(git2::Status::INDEX_DELETED) {
            ("Deleted".to_string(), true)
        } else if status.contains(git2::Status::WT_NEW) {
            ("Untracked".to_string(), false)
        } else if status.contains(git2::Status::WT_MODIFIED) {
            ("Modified".to_string(), false)
        } else if status.contains(git2::Status::WT_DELETED) {
            ("Deleted".to_string(), false)
        } else {
            ("Unknown".to_string(), false)
        };

        changes.push(FileChange {
            path: file_path,
            status: status_str,
            is_staged,
        });
    }

    Ok(changes)
}

#[command]
pub fn stage_all_files(path: String) -> Result<String, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut index = repo.index().map_err(|e| e.to_string())?;

    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| e.to_string())?;
    index.write().map_err(|e| e.to_string())?;

    Ok("All files staged".to_string())
}

#[command]
pub fn create_commit(path: String, message: String, author_name: String, author_email: String) -> Result<String, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let mut index = repo.index().map_err(|e| e.to_string())?;

    index.add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| e.to_string())?;
    index.write().map_err(|e| e.to_string())?;

    let oid = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(oid).map_err(|e| e.to_string())?;

    let sig = Signature::now(&author_name, &author_email).map_err(|e| e.to_string())?;

    let parent_commit = repo.head().ok().and_then(|h| h.peel_to_commit().ok());

    let commit_oid = if let Some(parent) = parent_commit {
        // Normal commit — append to existing history
        repo.commit(Some("HEAD"), &sig, &sig, &message, &tree, &[&parent])
    } else {
        // Initial commit — no parent, must also set branch ref to "main"
        let oid = repo.commit(None, &sig, &sig, &message, &tree, &[])
            .map_err(|e| e.to_string())?;
        // Create refs/heads/main and point HEAD at it
        repo.reference(
            "refs/heads/main",
            oid,
            true,
            "initial commit",
        ).map_err(|e| e.to_string())?;
        repo.set_head("refs/heads/main").map_err(|e| e.to_string())?;
        return Ok(oid.to_string());
    }
    .map_err(|e| e.to_string())?;

    Ok(commit_oid.to_string())
}

#[command]
pub fn push_to_remote(path: String, token: String, branch: String) -> Result<String, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;

    // ── Resolve actual branch name ────────────────────────────────────────────
    let actual_branch = if let Ok(head) = repo.head() {
        head.shorthand().unwrap_or(&branch).to_string()
    } else {
        return Err(
            "Repository has no commits yet. Please make at least one commit before pushing."
                .to_string(),
        );
    };

    // ── Verify the branch ref actually exists ─────────────────────────────────
    let ref_name = format!("refs/heads/{}", actual_branch);
    if repo.find_reference(&ref_name).is_err() {
        return Err(format!(
            "Branch '{}' does not exist locally. Make a commit first.",
            actual_branch
        ));
    }

    // ── Step 1: Fetch remote to check for new commits ─────────────────────────
    {
        let mut remote = repo.find_remote("origin").map_err(|e| e.to_string())?;
        let mut callbacks = RemoteCallbacks::new();
        let token_clone = token.clone();
        callbacks.credentials(move |_url, _username, _allowed| {
            Cred::userpass_plaintext(&token_clone, "")
        });
        let mut fetch_opts = FetchOptions::new();
        fetch_opts.remote_callbacks(callbacks);
        // Fetch quietly — ignore error if remote branch doesn't exist yet (first push)
        let _ = remote.fetch(&[&actual_branch], Some(&mut fetch_opts), None);
    }

    // ── Step 2: Sync with remote before pushing ───────────────────────────────
    if let Ok(fetch_head) = repo.find_reference("FETCH_HEAD") {
        if let Ok(fetch_commit) = repo.reference_to_annotated_commit(&fetch_head) {
            if let Ok((analysis, _)) = repo.merge_analysis(&[&fetch_commit]) {
                if analysis.is_up_to_date() {
                    // Remote is not ahead — nothing to merge

                } else if analysis.is_fast_forward() {
                    // Remote only has new commits — fast-forward local branch
                    let mut reference = repo
                        .find_reference(&ref_name)
                        .map_err(|e| e.to_string())?;
                    reference
                        .set_target(fetch_commit.id(), "Fast-forward before push")
                        .map_err(|e| e.to_string())?;
                    repo.set_head(&ref_name).map_err(|e| e.to_string())?;
                    repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
                        .map_err(|e| e.to_string())?;

                } else if analysis.is_normal() {
                    // Both local and remote have new commits — attempt 3-way merge
                    let remote_commit = repo
                        .find_commit(fetch_commit.id())
                        .map_err(|e| e.to_string())?;

                    // Merge the remote commit into the working tree
                    repo.merge(
                        &[&fetch_commit],
                        None,
                        Some(git2::build::CheckoutBuilder::default().allow_conflicts(true)),
                    )
                    .map_err(|e| e.to_string())?;

                    // Check for conflicts
                    let index = repo.index().map_err(|e| e.to_string())?;
                    if index.has_conflicts() {
                        // Clean up merge state so repo isn't stuck
                        repo.cleanup_state().ok();
                        return Err(
                            "Push failed: automatic merge produced conflicts. Please pull and resolve conflicts manually.".to_string()
                        );
                    }

                    // No conflicts — create merge commit
                    let mut index = repo.index().map_err(|e| e.to_string())?;
                    let tree_oid = index.write_tree().map_err(|e| e.to_string())?;
                    index.write().map_err(|e| e.to_string())?;
                    let tree = repo.find_tree(tree_oid).map_err(|e| e.to_string())?;

                    let local_commit = repo
                        .head()
                        .map_err(|e| e.to_string())?
                        .peel_to_commit()
                        .map_err(|e| e.to_string())?;

                    let sig = local_commit.author();
                    let merge_message = format!(
                        "Merge remote-tracking branch 'origin/{}'",
                        actual_branch
                    );

                    repo.commit(
                        Some("HEAD"),
                        &sig,
                        &sig,
                        &merge_message,
                        &tree,
                        &[&local_commit, &remote_commit],
                    )
                    .map_err(|e| e.to_string())?;

                    // Clean up MERGE_HEAD etc.
                    repo.cleanup_state().map_err(|e| e.to_string())?;
                }
            }
        }
    }

    // ── Step 3: Push ──────────────────────────────────────────────────────────
    let mut remote = repo.find_remote("origin").map_err(|e| e.to_string())?;

    let mut callbacks = RemoteCallbacks::new();
    let token_clone = token.clone();
    callbacks.credentials(move |_url, _username, _allowed| {
        Cred::userpass_plaintext(&token_clone, "")
    });

    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(callbacks);

    let refspec = format!("refs/heads/{}:refs/heads/{}", actual_branch, actual_branch);
    remote
        .push(&[&refspec], Some(&mut push_opts))
        .map_err(|e| e.to_string())?;

    Ok(format!("Push successful → {}", actual_branch))
}

#[command]
pub fn pull_from_remote(path: String, token: String, branch: String) -> Result<String, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;

    let mut remote = repo.find_remote("origin").map_err(|e| e.to_string())?;

    let mut callbacks = RemoteCallbacks::new();
    let token_clone = token.clone();
    callbacks.credentials(move |_url, _username, _allowed| {
        Cred::userpass_plaintext(&token_clone, "")
    });

    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    remote
        .fetch(&[&branch], Some(&mut fetch_opts), None)
        .map_err(|e| e.to_string())?;

    let fetch_head = repo.find_reference("FETCH_HEAD").map_err(|e| e.to_string())?;
    let fetch_commit = repo.reference_to_annotated_commit(&fetch_head).map_err(|e| e.to_string())?;

    let (analysis, _) = repo.merge_analysis(&[&fetch_commit]).map_err(|e| e.to_string())?;

    if analysis.is_fast_forward() {
        let refname = format!("refs/heads/{}", branch);
        let mut reference = repo.find_reference(&refname).map_err(|e| e.to_string())?;
        reference.set_target(fetch_commit.id(), "Fast-forward").map_err(|e| e.to_string())?;
        repo.set_head(&refname).map_err(|e| e.to_string())?;
        repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
            .map_err(|e| e.to_string())?;
        Ok("Pull successful (fast-forward)".to_string())
    } else if analysis.is_up_to_date() {
        Ok("Already up to date".to_string())
    } else {
        Err("Cannot fast-forward. Please resolve conflicts manually.".to_string())
    }
}

#[command]
pub fn get_branches(path: String) -> Result<Vec<String>, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;
    let branches = repo.branches(None).map_err(|e| e.to_string())?;

    let mut branch_names = vec![];
    for branch in branches {
        if let Ok((branch, _)) = branch {
            if let Ok(Some(name)) = branch.name() {
                branch_names.push(name.to_string());
            }
        }
    }

    Ok(branch_names)
}

#[command]
pub fn set_remote(path: String, url: String) -> Result<String, String> {
    let repo = Repository::open(&path).map_err(|e| e.to_string())?;

    if repo.find_remote("origin").is_ok() {
        repo.remote_set_url("origin", &url).map_err(|e| e.to_string())?;
    } else {
        repo.remote("origin", &url).map_err(|e| e.to_string())?;
    }

    Ok(format!("Remote set to {}", url))
}

#[command]
pub fn clone_repository(url: String, path: String, token: String) -> Result<String, String> {
    let mut callbacks = RemoteCallbacks::new();
    let token_clone = token.clone();
    callbacks.credentials(move |_url, _username, _allowed| {
        Cred::userpass_plaintext(&token_clone, "")
    });

    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(callbacks);

    let mut builder = git2::build::RepoBuilder::new();
    builder.fetch_options(fetch_opts);

    builder.clone(&url, Path::new(&path)).map_err(|e| e.to_string())?;

    Ok(format!("Cloned to {}", path))
}
