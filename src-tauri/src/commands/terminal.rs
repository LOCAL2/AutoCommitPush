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

#[derive(Debug, Serialize, Clone)]
pub struct DockerResult {
    pub success: bool,
    pub output: String,
}

/// Check if docker daemon is reachable
#[command]
pub fn check_docker_available() -> DockerResult {
    match Command::new("docker").args(["version", "--format", "{{.Server.Version}}"]).output() {
        Ok(out) if out.status.success() => DockerResult {
            success: true,
            output: decode_output(&out.stdout).trim().to_string(),
        },
        Ok(out) => DockerResult {
            success: false,
            output: decode_output(&out.stderr).trim().to_string(),
        },
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("os error 2") || msg.contains("No such file") || msg.contains("program") {
                DockerResult { success: false, output: "Docker not found. Make sure Docker Desktop is installed and running.".to_string() }
            } else {
                DockerResult { success: false, output: msg }
            }
        }
    }
}

/// Run docker login → build → push flow from Rust (bypasses shell plugin permission issues)
#[command]
pub fn docker_push(
    project_path: String,
    username: String,
    password: String,
    image_name: String,
    tag: String,
) -> DockerResult {
    let full_tag = format!("{}:{}", image_name, tag);

    // 1. Login
    let login = Command::new("docker")
        .args(["login", "--username", &username, "--password", &password])
        .output();

    match login {
        Ok(out) if out.status.success() => {}
        Ok(out) => return DockerResult {
            success: false,
            output: format!("Login failed: {}", decode_output(&out.stderr).trim()),
        },
        Err(e) => return DockerResult { success: false, output: format!("Login error: {}", e) },
    }

    // 2. Build
    let dockerfile = format!("{}\\Dockerfile", project_path);
    let build = Command::new("docker")
        .args(["build", "--tag", &full_tag, "--file", &dockerfile, &project_path])
        .output();

    match build {
        Ok(out) if out.status.success() => {}
        Ok(out) => {
            let _ = Command::new("docker").args(["logout"]).output();
            return DockerResult {
                success: false,
                output: format!("Build failed:\n{}", decode_output(&out.stderr).trim()),
            };
        }
        Err(e) => return DockerResult { success: false, output: format!("Build error: {}", e) },
    }

    // 3. Push
    let push = Command::new("docker").args(["push", &full_tag]).output();
    let _ = Command::new("docker").args(["logout"]).output();

    match push {
        Ok(out) if out.status.success() => DockerResult {
            success: true,
            output: format!("Successfully pushed {}", full_tag),
        },
        Ok(out) => DockerResult {
            success: false,
            output: format!("Push failed:\n{}", decode_output(&out.stderr).trim()),
        },
        Err(e) => DockerResult { success: false, output: format!("Push error: {}", e) },
    }
}

/// Decode bytes from Windows cmd.exe (CP850 / CP1252) to UTF-8 gracefully.
fn decode_output(bytes: &[u8]) -> String {
    if let Ok(s) = std::str::from_utf8(bytes) {
        return s.to_string();
    }
    String::from_utf8_lossy(bytes).into_owned()
}
