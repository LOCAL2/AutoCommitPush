use keyring::Entry;
use tauri::command;
use tauri_plugin_store::StoreExt;

const SERVICE_NAME: &str = "AutoCommitPush";
const ACCOUNT_NAME: &str = "github_token";
const STORE_KEY: &str = "github_token";

// ── Keyring helpers ──────────────────────────────────────────────────────────

fn keyring_entry() -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, ACCOUNT_NAME).map_err(|e| e.to_string())
}

// ── Commands ─────────────────────────────────────────────────────────────────

/// Save token — tries Windows Credential Manager first, then store fallback
#[command]
pub fn save_token(token: String, app: tauri::AppHandle) -> Result<(), String> {
    // 1. Try keyring (Windows Credential Manager)
    match keyring_entry() {
        Ok(entry) => {
            if let Err(e) = entry.set_password(&token) {
                eprintln!("[auth] keyring save failed: {e}, using store fallback");
                store_save(&app, &token)?;
            }
        }
        Err(e) => {
            eprintln!("[auth] keyring entry failed: {e}, using store fallback");
            store_save(&app, &token)?;
        }
    }

    // 2. Always also save to store as backup
    let _ = store_save(&app, &token);

    Ok(())
}

/// Get token — tries keyring first, then store fallback
#[command]
pub fn get_token(app: tauri::AppHandle) -> Result<String, String> {
    // 1. Try keyring
    if let Ok(entry) = keyring_entry() {
        if let Ok(pw) = entry.get_password() {
            if !pw.is_empty() {
                return Ok(pw);
            }
        }
    }

    // 2. Fall back to store
    store_get(&app).ok_or_else(|| "No token found".to_string())
}

/// Delete token from both keyring and store
#[command]
pub fn delete_token(app: tauri::AppHandle) -> Result<(), String> {
    if let Ok(entry) = keyring_entry() {
        let _ = entry.delete_credential();
    }
    store_delete(&app);
    Ok(())
}

/// Returns true if a token exists in either keyring or store
#[command]
pub fn has_token(app: tauri::AppHandle) -> bool {
    // Check keyring
    if let Ok(entry) = keyring_entry() {
        if let Ok(pw) = entry.get_password() {
            if !pw.is_empty() {
                return true;
            }
        }
    }
    // Check store
    store_get(&app).is_some()
}

// ── Store helpers (tauri-plugin-store as persistent fallback) ────────────────

fn store_save(app: &tauri::AppHandle, token: &str) -> Result<(), String> {
    let store = app
        .store("auth.json")
        .map_err(|e| e.to_string())?;
    store.set(STORE_KEY, serde_json::Value::String(token.to_string()));
    store.save().map_err(|e| e.to_string())
}

fn store_get(app: &tauri::AppHandle) -> Option<String> {
    let store = app.store("auth.json").ok()?;
    store
        .get(STORE_KEY)
        .and_then(|v| v.as_str().map(|s| s.to_string()))
}

fn store_delete(app: &tauri::AppHandle) {
    if let Ok(store) = app.store("auth.json") {
        store.delete(STORE_KEY);
        let _ = store.save();
    }
}
