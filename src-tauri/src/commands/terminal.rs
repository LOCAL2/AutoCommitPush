use serde::Serialize;
use std::process::Command;
use tauri::command;

#[derive(Debug, Serialize, Clone)]
pub struct TerminalOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

/// Run a cmd.exe command in a given working directory.
/// Returns combined stdout, stderr, and exit code.
#[command]
pub fn run_terminal_command(cwd: String, input: String) -> TerminalOutput {
    // Use cmd.exe /C so built-ins like `cd`, `dir`, `echo`, `cls` all work
    let result = Command::new("cmd.exe")
        .args(["/C", &input])
        .current_dir(&cwd)
        .output();

    match result {
        Ok(output) => {
            let stdout = decode_output(&output.stdout);
            let stderr = decode_output(&output.stderr);
            let exit_code = output.status.code().unwrap_or(-1);
            TerminalOutput { stdout, stderr, exit_code }
        }
        Err(e) => TerminalOutput {
            stdout: String::new(),
            stderr: format!("Failed to execute command: {}", e),
            exit_code: -1,
        },
    }
}

/// Decode bytes from Windows cmd.exe (CP850 / CP1252) to UTF-8 gracefully.
fn decode_output(bytes: &[u8]) -> String {
    // Try UTF-8 first (works for most modern tools)
    if let Ok(s) = std::str::from_utf8(bytes) {
        return s.to_string();
    }
    // Fallback: replace invalid bytes so we never panic
    String::from_utf8_lossy(bytes).into_owned()
}
