use serde::Serialize;
use tauri::command;
use git2;

#[cfg(target_os = "windows")]
use keyring;

#[derive(Debug, Serialize, Clone)]
pub struct CheckResult {
    pub id: String,
    pub label: String,
    pub status: String, // "ok" | "warn" | "error" | "checking"
    pub detail: String,
    pub fix_url: Option<String>,
}

/// Check if WebView2 runtime is installed (Windows)
fn check_webview2() -> CheckResult {
    #[cfg(target_os = "windows")]
    {
        // Check registry for WebView2
        use std::process::Command;
        let output = Command::new("reg")
            .args([
                "query",
                "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
                "/v", "pv",
            ])
            .output();

        let found = output.map(|o| o.status.success()).unwrap_or(false);

        if found {
            return CheckResult {
                id: "webview2".into(),
                label: "WebView2 Runtime".into(),
                status: "ok".into(),
                detail: "Installed".into(),
                fix_url: None,
            };
        }

        // Also check per-user install
        let output2 = Command::new("reg")
            .args([
                "query",
                "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
                "/v", "pv",
            ])
            .output();

        let found2 = output2.map(|o| o.status.success()).unwrap_or(false);

        if found2 {
            return CheckResult {
                id: "webview2".into(),
                label: "WebView2 Runtime".into(),
                status: "ok".into(),
                detail: "Installed (user)".into(),
                fix_url: None,
            };
        }

        CheckResult {
            id: "webview2".into(),
            label: "WebView2 Runtime".into(),
            status: "error".into(),
            detail: "Not found — required for the app UI".into(),
            fix_url: Some("https://go.microsoft.com/fwlink/p/?LinkId=2124703".into()),
        }
    }
    #[cfg(not(target_os = "windows"))]
    CheckResult {
        id: "webview2".into(),
        label: "WebView Runtime".into(),
        status: "ok".into(),
        detail: "System WebKit".into(),
        fix_url: None,
    }
}

/// Check Windows version
fn check_os() -> CheckResult {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        // Use PowerShell to get reliable build number
        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command",
                "(Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion').CurrentBuildNumber"])
            .output()
            .ok()
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .unwrap_or_default();

        let build: u32 = output.trim().parse().unwrap_or(0);

        let (label, detail, status) = if build >= 22000 {
            ("Windows 11", format!("Build {}", build), "ok")
        } else if build >= 10240 {
            ("Windows 10", format!("Build {}", build), "ok")
            
        } else if build > 0 {
            ("Windows (older)", format!("Build {} — May have issues", build), "warn")
        } else {
            ("Windows", "Version unknown".to_string(), "ok")
        };

        return CheckResult {
            id: "os".into(),
            label: label.into(),
            status: status.into(),
            detail,
            fix_url: None,
        };
    }
    #[cfg(not(target_os = "windows"))]
    CheckResult {
        id: "os".into(),
        label: "Operating System".into(),
        status: "ok".into(),
        detail: "Linux/macOS — Supported".into(),
        fix_url: None,
    }
}

/// Check internet connectivity
fn check_internet() -> CheckResult {
    use std::net::TcpStream;
    use std::time::Duration;

    let reachable = TcpStream::connect_timeout(
        &std::net::SocketAddr::from(([8, 8, 8, 8], 443)),
        Duration::from_secs(3),
    )
    .is_ok();

    // Also try GitHub specifically
    let github_ok = if reachable {
        std::net::TcpStream::connect_timeout(
            &std::net::SocketAddr::from(([140, 82, 121, 4], 443)),
            Duration::from_secs(3),
        )
        .is_ok()
    } else {
        false
    };

    if github_ok {
        CheckResult {
            id: "internet".into(),
            label: "Internet / GitHub".into(),
            status: "ok".into(),
            detail: "GitHub reachable".into(),
            fix_url: None,
        }
    } else if reachable {
        CheckResult {
            id: "internet".into(),
            label: "Internet / GitHub".into(),
            status: "warn".into(),
            detail: "Internet available but GitHub may be blocked".into(),
            fix_url: None,
        }
    } else {
        CheckResult {
            id: "internet".into(),
            label: "Internet / GitHub".into(),
            status: "warn".into(),
            detail: "Cannot reach internet — check your connection".into(),
            fix_url: None,
        }
    }
}

/// Check Windows Credential Manager (for token storage)
fn check_keyring() -> CheckResult {
    #[cfg(target_os = "windows")]
    {
        // Try to create a test entry — if it works, keyring is available
        let test = keyring::Entry::new("AutoCommitPush_test", "test");
        match test {
            Ok(entry) => {
                let _ = entry.delete_credential();
                CheckResult {
                    id: "keyring".into(),
                    label: "Windows Credential Manager".into(),
                    status: "ok".into(),
                    detail: "Token storage ready".into(),
                    fix_url: None,
                }
            }
            Err(_) => CheckResult {
                id: "keyring".into(),
                label: "Windows Credential Manager".into(),
                status: "warn".into(),
                detail: "Unavailable — tokens will use localStorage fallback".into(),
                fix_url: None,
            },
        }
    }
    #[cfg(not(target_os = "windows"))]
    CheckResult {
        id: "keyring".into(),
        label: "System Keychain".into(),
        status: "ok".into(),
        detail: "Available".into(),
        fix_url: None,
    }
}

/// Check git2 (libgit2) — always bundled, just verify it works
fn check_git() -> CheckResult {
    // Try to init a temp repo in memory using git2
    let tmp = std::env::temp_dir().join("acp_git2_test");
    let ok = git2::Repository::init(&tmp).is_ok();
    // Clean up
    let _ = std::fs::remove_dir_all(&tmp);

    if ok {
        CheckResult {
            id: "git".into(),
            label: "Git (libgit2)".into(),
            status: "ok".into(),
            detail: "Git engine ready".into(),
            fix_url: None,
        }
    } else {
        CheckResult {
            id: "git".into(),
            label: "Git (libgit2)".into(),
            status: "error".into(),
            detail: "libgit2 failed to initialize".into(),
            fix_url: None,
        }
    }
}


#[command]
pub fn run_setup_checks() -> Vec<CheckResult> {
    vec![
        check_os(),
        check_webview2(),
        check_git(),
        check_keyring(),
        check_internet(),
    ]
}

#[command]
pub fn check_single(id: String) -> CheckResult {
    match id.as_str() {
        "os"       => check_os(),
        "webview2" => check_webview2(),
        "git"      => check_git(),
        "keyring"  => check_keyring(),
        "internet" => check_internet(),
        _ => CheckResult {
            id: id.clone(),
            label: id,
            status: "error".into(),
            detail: "Unknown check".into(),
            fix_url: None,
        },
    }
}
