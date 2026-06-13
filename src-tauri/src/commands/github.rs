use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubUser {
    pub login: String,
    pub name: Option<String>,
    pub avatar_url: String,
    pub email: Option<String>,
    pub public_repos: u32,
    pub followers: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateRepoParams {
    pub name: String,
    pub description: Option<String>,
    pub private: bool,
    pub auto_init: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitHubRepo {
    pub name: String,
    pub full_name: String,
    pub html_url: String,
    pub clone_url: String,
    pub ssh_url: String,
    pub private: bool,
    pub description: Option<String>,
}

#[derive(Deserialize)]
struct GHUser {
    login: String,
    name: Option<String>,
    avatar_url: String,
    email: Option<String>,
    public_repos: u32,
    followers: u32,
}

#[derive(Deserialize)]
struct GHRepo {
    name: String,
    full_name: String,
    html_url: String,
    clone_url: String,
    ssh_url: String,
    private: bool,
    description: Option<String>,
}

#[command]
pub async fn get_user_info(token: String) -> Result<GitHubUser, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.github.com/user")
        .header("Authorization", format!("token {}", token))
        .header("User-Agent", "AutoCommitPush/1.0")
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let user: GHUser = response.json().await.map_err(|e| e.to_string())?;

    Ok(GitHubUser {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        public_repos: user.public_repos,
        followers: user.followers,
    })
}

#[command]
pub async fn create_github_repo(token: String, params: CreateRepoParams) -> Result<GitHubRepo, String> {
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "name": params.name,
        "description": params.description.unwrap_or_default(),
        "private": params.private,
        "auto_init": params.auto_init,
    });

    let response = client
        .post("https://api.github.com/user/repos")
        .header("Authorization", format!("token {}", token))
        .header("User-Agent", "AutoCommitPush/1.0")
        .header("Accept", "application/vnd.github.v3+json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to create repository: {}", error_text));
    }

    let repo: GHRepo = response.json().await.map_err(|e| e.to_string())?;

    Ok(GitHubRepo {
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url,
        private: repo.private,
        description: repo.description,
    })
}

#[command]
pub async fn get_user_repos(token: String) -> Result<Vec<GitHubRepo>, String> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.github.com/user/repos?per_page=100&sort=updated")
        .header("Authorization", format!("token {}", token))
        .header("User-Agent", "AutoCommitPush/1.0")
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let repos: Vec<GHRepo> = response.json().await.map_err(|e| e.to_string())?;

    Ok(repos
        .into_iter()
        .map(|r| GitHubRepo {
            name: r.name,
            full_name: r.full_name,
            html_url: r.html_url,
            clone_url: r.clone_url,
            ssh_url: r.ssh_url,
            private: r.private,
            description: r.description,
        })
        .collect())
}

#[command]
pub async fn check_repo_exists(token: String, owner: String, repo: String) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("https://api.github.com/repos/{}/{}", owner, repo))
        .header("Authorization", format!("token {}", token))
        .header("User-Agent", "AutoCommitPush/1.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response.status().is_success())
}

#[command]
pub async fn delete_github_repo(token: String, owner: String, repo: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .delete(format!("https://api.github.com/repos/{}/{}", owner, repo))
        .header("Authorization", format!("token {}", token))
        .header("User-Agent", "AutoCommitPush/1.0")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        Ok("Repository deleted".to_string())
    } else {
        Err(format!("Failed to delete: {}", response.status()))
    }
}
