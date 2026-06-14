use std::fs;
use std::path::Path;
use serde::Serialize;
use tauri::command;

#[derive(Debug, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_git: bool,
}

#[derive(Debug, Serialize)]
pub struct DriveEntry {
    pub name: String,
    pub path: String,
}

/// List subdirectories of a given path
#[command]
pub fn list_directories(path: String) -> Result<Vec<DirEntry>, String> {
    let base = Path::new(&path);
    if !base.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let mut entries: Vec<DirEntry> = fs::read_dir(base)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            // Skip hidden dirs (starting with .)
            if name.starts_with('.') { return None; }
            let full = e.path();
            let is_git = full.join(".git").exists();
            Some(DirEntry {
                name,
                path: full.to_string_lossy().replace('/', "\\").to_string(),
                is_git,
            })
        })
        .collect();

    entries.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(entries)
}

/// Get available drives on Windows (C:\, D:\, etc.)
#[command]
pub fn get_drives() -> Vec<DriveEntry> {
    #[cfg(target_os = "windows")]
    {
        let mut drives = Vec::new();
        // Check drive letters A-Z
        for letter in b'A'..=b'Z' {
            let path = format!("{}:\\", letter as char);
            if Path::new(&path).exists() {
                drives.push(DriveEntry {
                    name: format!("{}:", letter as char),
                    path: path.clone(),
                });
            }
        }
        return drives;
    }
    #[cfg(not(target_os = "windows"))]
    {
        vec![DriveEntry { name: "/".to_string(), path: "/".to_string() }]
    }
}

/// Get the user's home directory
#[command]
pub fn get_home_dir() -> Option<String> {
    dirs::home_dir().map(|p| p.to_string_lossy().to_string())
}

#[command]
pub fn read_gitignore(path: String) -> Result<String, String> {
    let gitignore_path = Path::new(&path).join(".gitignore");
    if gitignore_path.exists() {
        fs::read_to_string(gitignore_path).map_err(|e| e.to_string())
    } else {
        Ok(String::new())
    }
}

#[command]
pub fn write_gitignore(path: String, content: String) -> Result<String, String> {
    let gitignore_path = Path::new(&path).join(".gitignore");
    fs::write(gitignore_path, content).map_err(|e| e.to_string())?;
    Ok("Saved".to_string())
}

#[command]
pub fn read_readme(path: String) -> Result<String, String> {
    let base = Path::new(&path);
    // Try common casing variants
    for name in &["README.md", "readme.md", "Readme.md"] {
        let p = base.join(name);
        if p.exists() {
            return fs::read_to_string(p).map_err(|e| e.to_string());
        }
    }
    Ok(String::new())
}

#[command]
pub fn write_readme(path: String, content: String) -> Result<String, String> {
    let readme_path = Path::new(&path).join("README.md");
    fs::write(readme_path, content).map_err(|e| e.to_string())?;
    Ok("Saved".to_string())
}

#[command]
pub fn open_folder_dialog() -> Result<Option<String>, String> {
    Ok(None)
}

#[command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| e.to_string())
}

#[command]
pub fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[command]
pub fn get_gitignore_template(template: String) -> Result<String, String> {
    let content = match template.as_str() {
        "node" => include_str!("../../templates/gitignore_node.txt"),
        "react" => include_str!("../../templates/gitignore_react.txt"),
        "python" => include_str!("../../templates/gitignore_python.txt"),
        "electron" => include_str!("../../templates/gitignore_electron.txt"),
        "generic" => include_str!("../../templates/gitignore_generic.txt"),
        _ => include_str!("../../templates/gitignore_generic.txt"),
    };
    Ok(content.to_string())
}
