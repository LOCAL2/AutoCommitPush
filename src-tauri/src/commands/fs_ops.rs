use std::fs;
use std::path::Path;
use tauri::command;

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
