import * as tauriCmd from "@/lib/tauri-commands";

export interface DockerPushOptions {
  projectPath: string;
  username: string;
  password: string;
  imageName: string;
  tag: string;
}

export interface DockerResult {
  success: boolean;
  output: string;
}

/**
 * Check if Docker daemon is reachable.
 * Uses Rust std::process::Command — no shell plugin permission required.
 */
export async function checkDockerAvailable(): Promise<DockerResult> {
  return tauriCmd.checkDockerAvailable();
}

/**
 * Full Docker login → build → push flow via Rust backend.
 * onStep callback is called with progress messages.
 */
export async function dockerPush(
  opts: DockerPushOptions,
  onStep: (msg: string) => void,
): Promise<DockerResult> {
  onStep("Checking Docker daemon...");
  const check = await checkDockerAvailable();
  if (!check.success) return check;

  onStep("Authenticating · Building · Pushing...");
  const result = await tauriCmd.dockerPush(
    opts.projectPath,
    opts.username,
    opts.password,
    opts.imageName,
    opts.tag,
  );
  return result;
}
