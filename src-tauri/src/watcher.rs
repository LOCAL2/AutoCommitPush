use std::collections::HashMap;
use std::path::{Component, Path};
use std::sync::Mutex;
use std::time::Duration;

use notify_debouncer_mini::{new_debouncer, DebounceEventResult};
use notify::{RecursiveMode, Watcher};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

#[derive(Clone, Serialize)]
pub struct RepoChangedPayload {
    pub project_id: String,
    pub path: String,
}

type Debouncer = notify_debouncer_mini::Debouncer<notify_debouncer_mini::notify::RecommendedWatcher>;

pub struct WatchState {
    debouncers: HashMap<String, Debouncer>,
}

impl WatchState {
    pub fn new() -> Self {
        Self {
            debouncers: HashMap::new(),
        }
    }
}

fn path_in_git_dir(path: &Path) -> bool {
    path.components().any(|c| c == Component::Normal(std::ffi::OsStr::new(".git")))
}

#[tauri::command]
pub fn watch_project(
    app: AppHandle,
    state: State<'_, Mutex<WatchState>>,
    project_id: String,
    path: String,
) -> Result<(), String> {
    let mut watch_state = state.lock().map_err(|e| e.to_string())?;
    watch_state.debouncers.remove(&project_id);

    let project_id_emit = project_id.clone();
    let path_emit = path.clone();

    let mut debouncer = new_debouncer(Duration::from_millis(200), move |result: DebounceEventResult| {
        if let Ok(events) = result {
            let has_relevant = events.iter().any(|e| !path_in_git_dir(&e.path));
            if has_relevant {
                let _ = app.emit(
                    "repo-changed",
                    RepoChangedPayload {
                        project_id: project_id_emit.clone(),
                        path: path_emit.clone(),
                    },
                );
            }
        }
    })
    .map_err(|e| e.to_string())?;

    debouncer
        .watcher()
        .watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    watch_state.debouncers.insert(project_id, debouncer);
    Ok(())
}

#[tauri::command]
pub fn unwatch_project(
    state: State<'_, Mutex<WatchState>>,
    project_id: String,
) -> Result<(), String> {
    let mut watch_state = state.lock().map_err(|e| e.to_string())?;
    watch_state.debouncers.remove(&project_id);
    Ok(())
}
