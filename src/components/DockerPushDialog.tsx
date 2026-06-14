import { useState, useEffect } from "react";
import { X, Container, Tag, User, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useSettingsStore } from "@/store/settingsStore";
import { useLogStore } from "@/store/logStore";
import { useToast } from "@/components/ui/toast";
import { dockerPush, checkDockerAvailable } from "@/lib/docker";
import { sanitizeRepoName } from "@/lib/utils";

interface Props {
  projectLabel: string;
  projectPath: string;
  projectId: string;
  onClose: () => void;
}

export default function DockerPushDialog({ projectLabel, projectPath, projectId, onClose }: Props) {
  const { dockerUsername, dockerPassword, dockerDefaultTag } = useSettingsStore();
  const { addLog } = useLogStore();
  const { showToast } = useToast();

  const defaultImage = dockerUsername
    ? `${dockerUsername}/${sanitizeRepoName(projectLabel).toLowerCase()}`
    : sanitizeRepoName(projectLabel).toLowerCase();

  const [imageName, setImageName] = useState(defaultImage);
  const [tag, setTag] = useState(dockerDefaultTag || "latest");
  const [username, setUsername] = useState(dockerUsername);
  const [password, setPassword] = useState(dockerPassword);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepMsg, setStepMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Check docker daemon on open
  const [dockerStatus, setDockerStatus] = useState<"checking" | "ok" | "error">("checking");
  useEffect(() => {
    checkDockerAvailable().then((r) =>
      setDockerStatus(r.success ? "ok" : "error")
    );
  }, []);

  const handlePush = async () => {
    if (!username || !password) {
      setError("Docker Hub username and password are required. Set them in Settings.");
      return;
    }
    if (!imageName) {
      setError("Image name is required");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    let stepIdx = 0;

    const result = await dockerPush(
      { projectPath, username, password, imageName, tag },
      (msg) => {
        setStepMsg(msg);
        stepIdx++;
        setProgress(Math.min(90, 10 + stepIdx * 30));
      }
    );

    setProgress(100);
    setLoading(false);

    if (result.success) {
      setDone(true);
      addLog("success", `Docker push: ${imageName}:${tag}`, projectId, projectLabel);
      showToast("success", `Pushed ${imageName}:${tag} to Docker Hub!`);
    } else {
      setError(result.output);
      addLog("error", `Docker push failed: ${result.output}`, projectId, projectLabel);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border bg-card shadow-xl animate-fade-in p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Container className="h-5 w-5 text-blue-400" />
            <h2 className="font-semibold">Push to Docker Hub</h2>
          </div>
          <button onClick={onClose} disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (          /* Success state */
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-github-green/20 flex items-center justify-center">
                <Container className="h-6 w-6 text-github-green" />
              </div>
              <p className="font-medium text-github-green">Push Successful!</p>
              <p className="text-sm text-muted-foreground text-center">
                <code className="font-mono">{imageName}:{tag}</code> is now on Docker Hub.
              </p>
            </div>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Docker daemon status */}
            <div className={`flex items-center gap-2 p-2.5 rounded-md border text-xs ${
              dockerStatus === "checking"
                ? "bg-muted/40 border-border text-muted-foreground"
                : dockerStatus === "ok"
                ? "bg-github-green/10 border-github-green/20 text-github-green"
                : "bg-github-red/10 border-github-red/20 text-github-red"
            }`}>
              {dockerStatus === "checking"
                ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                : dockerStatus === "ok"
                ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
              {dockerStatus === "checking" && "Checking Docker daemon..."}
              {dockerStatus === "ok" && "Docker daemon is running"}
              {dockerStatus === "error" && "Docker not found or daemon not running. Start Docker Desktop first."}
            </div>

            {/* Docker Hub credentials notice */}
            {(!dockerUsername || !dockerPassword) && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-github-orange/10 border border-github-orange/20 text-xs">
                <AlertCircle className="h-4 w-4 text-github-orange shrink-0 mt-0.5" />
                <p className="text-github-orange">
                  Docker credentials not set. Fill in below or go to Settings → Docker Hub.
                </p>
              </div>
            )}

            {/* Credentials */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> Docker Hub Username
              </label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="dockerhubuser" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password / Access Token</label>
              <Input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {/* Image name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Container className="h-3.5 w-3.5 text-muted-foreground" /> Image Name
              </label>
              <Input value={imageName} onChange={(e) => setImageName(e.target.value)}
                placeholder="username/my-app" className="font-mono" />
              <p className="text-xs text-muted-foreground">
                Format: <code>username/image-name</code>
              </p>
            </div>

            {/* Tag */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" /> Tag
              </label>
              <Input value={tag} onChange={(e) => setTag(e.target.value)}
                placeholder="latest" className="font-mono" />
            </div>

            {/* Full image preview */}
            <div className="rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
              docker push <span className="text-foreground">{imageName || "image"}:{tag || "latest"}</span>
            </div>

            {/* Progress */}
            {loading && (
              <div className="space-y-1.5">
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">{stepMsg}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive whitespace-pre-wrap break-all">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePush} loading={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                <Container className="h-4 w-4" /> Push to Docker Hub
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
