import React from "react";
import {
  GitBranch, FolderGit2, Clock, AlertCircle, CheckCircle2,
  TrendingUp, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import { useLogStore } from "@/store/logStore";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { projects } = useProjectStore();
  const { user } = useAuthStore();
  const { logs } = useLogStore();

  const totalProjects = projects.length;
  const pushedProjects = projects.filter((p) => p.lastPushedAt).length;
  const recentLogs = logs.slice(0, 8);
  const lastPush = projects
    .filter((p) => p.lastPushedAt)
    .sort((a, b) => new Date(b.lastPushedAt!).getTime() - new Date(a.lastPushedAt!).getTime())[0];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.name ?? user?.login}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderGit2 className="h-4 w-4" />}
          label="Total Projects"
          value={totalProjects}
          color="text-primary"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Pushed"
          value={pushedProjects}
          color="text-github-green"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Last Push"
          value={lastPush?.lastPushedAt ? formatDate(lastPush.lastPushedAt).split(",")[0] : "—"}
          color="text-github-blue"
          small
        />
        <StatCard
          icon={<AlertCircle className="h-4 w-4" />}
          label="Errors Today"
          value={logs.filter((l) => l.level === "error" && l.timestamp > new Date(Date.now() - 86400000).toISOString()).length}
          color="text-github-red"
        />
      </div>

      {/* GitHub profile */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" /> GitHub Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-12 h-12 rounded-full ring-2 ring-border"
              />
              <div>
                <p className="font-medium">{user.name ?? user.login}</p>
                <p className="text-sm text-muted-foreground">@{user.login}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {user.public_repos} repos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.followers} followers
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activity yet. Start by adding a project.
            </p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <LogBadge level={log.level} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{log.message}</p>
                    {log.projectLabel && (
                      <p className="text-xs text-muted-foreground">{log.projectLabel}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent projects */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="h-4 w-4" /> Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.label}</span>
                  {p.lastPushedAt ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(p.lastPushedAt)}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-xs">Never pushed</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, color, small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  small?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center gap-2 ${color} mb-2`}>
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`font-bold ${small ? "text-base" : "text-2xl"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function LogBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    success: "bg-github-green/20 text-github-green",
    error: "bg-github-red/20 text-github-red",
    warning: "bg-github-orange/20 text-github-orange",
    info: "bg-github-blue/20 text-github-blue",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${map[level] ?? ""}`}>
      {level}
    </span>
  );
}
