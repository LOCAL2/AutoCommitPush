import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FolderGit2, ScrollText, Settings,
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
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-white" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
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
