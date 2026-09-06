import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@/components/ui/toast";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import LogsPage from "@/pages/LogsPage";
import SettingsPage from "@/pages/SettingsPage";

function ThemeHandler() {
  const { theme, accentColor } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    
    // Clean existing theme classes
    root.classList.remove("dark", "theme-dracula", "theme-nord", "theme-synthwave", "theme-monokai", "theme-github");

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const handler = (e: MediaQueryListEvent) => root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else if (theme === "light") {
      // Light theme default
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      // Theme preset (dracula, nord, synthwave, monokai, github)
      root.classList.add(`theme-${theme}`);
    }

    // Set custom accent color attribute
    if (accentColor && accentColor !== "default") {
      root.setAttribute("data-accent", accentColor);
    } else {
      root.removeAttribute("data-accent");
    }
  }, [theme, accentColor]);

  return null;
}

// ─── Redirect to dashboard if already logged in ───────────────────────────────
function LoginRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── Redirect to login if not logged in ──────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <ToastProvider>
      <ThemeHandler />
      <BrowserRouter>
        <Routes>
          {/* Login — redirect away if already authenticated */}
          <Route
            path="/login"
            element={
              <LoginRoute>
                <LoginPage />
              </LoginRoute>
            }
          />

          {/* Protected layout */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <Layout />
              </AuthGuard>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
