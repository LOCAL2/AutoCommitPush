import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FolderGit2, ScrollText, Settings, GitBranch,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";

const navItems = [
  { to: "/", icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard" },
  { to: "/projects", icon: <FolderGit2 className="h-4 w-4" />, label: "Projects" },
  { to: "/logs", icon: <ScrollText className="h-4 w-4" />, label: "Logs" },
  { to: "/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { projects } = useProjectStore();

  return (
    <aside className="w-52 shrink-0 flex flex-col border-r bg-card h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10">
          <GitBranch className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-sm">AutoCommitPush</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`
            }
          >
            {item.icon}
            {item.label}
            {item.to === "/projects" && projects.length > 0 && (
              <span className="ml-auto text-xs bg-secondary rounded-full px-1.5 py-0.5">
                {projects.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="p-3 border-t">
          <div className="flex items-center gap-2.5">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-7 h-7 rounded-full ring-1 ring-border"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name ?? user.login}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.login}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
