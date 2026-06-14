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
 * Run a docker command via Tauri shell plugin and capture output.
 */
async function runDocker(args: string[]): Promise<DockerResult> {
  try {
    const cmd = Command.create("docker", args);
    const output = await cmd.execute();
    const stdout = output.stdout?.trim() ?? "";
    const stderr = output.stderr?.trim() ?? "";
    if (output.code === 0) {
      return { success: true, output: stdout || stderr || "OK" };
    }
    // Docker often writes real error messages to stderr
    return { success: false, output: stderr || stdout || `Exit code ${output.code}` };
  } catch (e) {
    // Shell permission denied or docker not found
    const msg = String(e);
    if (msg.includes("not allowed") || msg.includes("permission")) {
      return {
        success: false,
        output: "Shell command not permitted. Rebuild the app after updating capabilities.",
      };
    }
    if (msg.includes("os error 2") || msg.includes("No such file")) {
      return {
        success: false,
        output: "Docker not found. Make sure Docker Desktop is installed and running.",
      };
    }
    return { success: false, output: msg };
  }
}

/**
 * Verify docker daemon is reachable before starting.
 */
export async function checkDockerAvailable(): Promise<DockerResult> {
  return runDocker(["version", "--format", "{{.Server.Version}}"]);
}

/**
 * Full Docker login → build → tag → push flow.
 *
 * Requirements:
 *   - Docker Desktop must be installed and the daemon running.
 *   - Project must contain a valid Dockerfile.
 *   - tauri.conf.json must allow the "docker" shell command.
 */
export async function dockerPush(
  opts: DockerPushOptions,
  onStep: (msg: string) => void
): Promise<DockerResult> {
  const { projectPath, username, password, imageName, tag } = opts;
  const fullTag = `${imageName}:${tag}`;

  // 0. Sanity-check — is docker running?
  onStep("Checking Docker daemon...");
  const versionCheck = await checkDockerAvailable();
  if (!versionCheck.success) {
    return { success: false, output: versionCheck.output };
  }

  // 1. Login
  //    Use --password-stdin equivalent: pass via env var DOCKER_CLI_PASSWORD
  //    Docker CLI respects --password flag but shows a security warning;
  //    the login still succeeds — the warning is printed to stderr, not a failure.
  onStep("Authenticating with Docker Hub...");
  const login = await runDocker([
    "login",
    "--username", username,
    "--password", password,
  ]);
  if (!login.success) {
    return { success: false, output: `Login failed: ${login.output}` };
  }

  // 2. Build image
  onStep(`Building image: ${fullTag}`);
  const build = await runDocker([
    "build",
    "--tag", fullTag,
    "--file", `${projectPath}\\Dockerfile`,
    projectPath,
  ]);
  if (!build.success) {
    return { success: false, output: `Build failed: ${build.output}` };
  }

  // 3. Push
  onStep(`Pushing ${fullTag} → Docker Hub`);
  const push = await runDocker(["push", fullTag]);
  if (!push.success) {
    return { success: false, output: `Push failed: ${push.output}` };
  }

  // 4. Logout (best-effort, don't fail on this)
  await runDocker(["logout"]);

  return { success: true, output: `Successfully pushed ${fullTag}` };
}
