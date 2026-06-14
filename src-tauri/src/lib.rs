mod commands;
mod git_ops;
mod github_api;
mod secure_storage;
mod watcher;

use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(watcher::WatchState::new()))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::git::init_repository,
            commands::git::get_repo_status,
            commands::git::stage_all_files,
            commands::git::create_commit,
            commands::git::push_to_remote,
            commands::git::pull_from_remote,
            commands::git::get_branches,
            commands::git::set_remote,
            commands::git::get_file_changes,
            commands::git::get_file_diff,
            commands::git::clone_repository,
            commands::github::create_github_repo,
            commands::github::get_user_info,
            commands::github::get_user_repos,
            commands::github::check_repo_exists,
            commands::github::delete_github_repo,
            commands::auth::save_token,
            commands::auth::get_token,
            commands::auth::delete_token,
            commands::auth::has_token,
            commands::fs_ops::read_gitignore,
            commands::fs_ops::write_gitignore,
            commands::fs_ops::open_folder_dialog,
            commands::fs_ops::open_in_explorer,
            commands::fs_ops::path_exists,
            commands::fs_ops::get_gitignore_template,
            commands::fs_ops::read_readme,
            commands::fs_ops::write_readme,
            watcher::watch_project,
            watcher::unwatch_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
