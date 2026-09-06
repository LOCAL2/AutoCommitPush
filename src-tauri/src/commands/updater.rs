use std::process::Command;
use std::fs;
use tauri::command;

#[derive(Debug, serde::Serialize, Clone)]
pub struct SilentUpdateResult {
    pub success: bool,
    pub message: String,
    pub latest_version: Option<String>,
}

/// Download the latest setup.exe from GitHub Releases and install silently in background.
#[command]
pub async fn install_update_silently(download_url: String, version: String) -> Result<SilentUpdateResult, String> {
    let temp_dir = std::env::temp_dir();
    let installer_path = temp_dir.join(format!("AutoCommitPush_Setup_{}.exe", version));

    // 1. Download installer file
    let response = reqwest::get(&download_url)
        .await
        .map_err(|e| format!("Failed to download update: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with status code: {}", response.status()));
    }

    let bytes = response.bytes().await.map_err(|e| format!("Failed to read update package: {}", e))?;
    fs::write(&installer_path, bytes).map_err(|e| format!("Failed to save installer file: {}", e))?;

    // 2. Launch NSIS installer silently in background (/S flag)
    #[cfg(target_os = "windows")]
    {
        let child = Command::new(&installer_path)
            .arg("/S")
            .spawn();

        match child {
            Ok(_) => Ok(SilentUpdateResult {
                success: true,
                message: format!("Installing v{} silently in background. The app will update automatically.", version),
                latest_version: Some(version),
            }),
            Err(e) => Err(format!("Failed to start silent installation: {}", e)),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Silent auto-update is currently supported on Windows.".to_string())
    }
}
