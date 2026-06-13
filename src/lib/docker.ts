import { Command } from "@tauri-apps/plugin-shell";

export interface DockerPushOptions {
  projectPath: string;
  username: string;
  password: string;
  imageName: string;  // e.g. "username/reponame"
  tag: string;        // e.g. "latest"
}

export interface DockerResult {
  success: boolean;
  output: string;
}

/**
 * Run a shell command via Tauri shell plugin and capture output.
 * Falls back to a plain error if shell not available.
 */
async function runCommand(program: string, args: string[]): Promise<DockerResult> {
  try {
    const cmd = Command.create(program, args);
    const output = await cmd.execute();
    if (output.code === 0) {
      return { success: true, output: output.stdout || output.stderr || "OK" };
    }
    return { success: false, output: output.stderr || output.stdout || "Unknown error" };
  } catch (e) {
    return { success: false, output: String(e) };
  }
}

/**
 * Full Docker login → build → tag → push flow.
 * Requires Docker Desktop installed on the machine.
 */
export async function dockerPush(
  opts: DockerPushOptions,
  onStep: (msg: string) => void
): Promise<DockerResult> {
  const { projectPath, username, password, imageName, tag } = opts;
  const fullTag = `${imageName}:${tag}`;

  // 1. Login
  onStep("Logging in to Docker Hub...");
  const loginDirect = await runCommand("docker", [
    "login",
    "--username", username,
    "--password", password,
  ]);
  if (!loginDirect.success) {
    return { success: false, output: `Docker login failed: ${loginDirect.output}` };
  }

  // 2. Build image
  onStep(`Building image ${fullTag}...`);
  const build = await runCommand("docker", [
    "build",
    "-t", fullTag,
    projectPath,
  ]);
  if (!build.success) {
    return { success: false, output: `Docker build failed: ${build.output}` };
  }

  // 3. Push
  onStep(`Pushing ${fullTag} to Docker Hub...`);
  const push = await runCommand("docker", ["push", fullTag]);
  if (!push.success) {
    return { success: false, output: `Docker push failed: ${push.output}` };
  }

  return { success: true, output: `Successfully pushed ${fullTag}` };
}
