import { create } from "zustand";
import type { GitHubUser } from "@/types";
import * as cmd from "@/lib/tauri-commands";

// ─── Fallback storage (localStorage) when keyring unavailable ────────────────
const LS_KEY = "acp_token_fb";

function lsSave(token: string) {
  try { localStorage.setItem(LS_KEY, btoa(token)); } catch { /* ignore */ }
}
function lsGet(): string | null {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? atob(v) : null;
  } catch { return null; }
}
function lsClear() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

// ─── Wait for Tauri IPC to be ready ──────────────────────────────────────────
async function waitForTauri(retries = 20, delayMs = 100): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      // lightweight probe — just check if invoke is reachable
      await cmd.hasToken();
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

// ─── Store ───────────────────────────────────────────────────────────────────
interface AuthState {
  token: string | null;
  user: GitHubUser | null;
  isLoading: boolean;  // true = still restoring session, block render
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,   // ← start TRUE so AuthGuard waits
  error: null,

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const user = await cmd.getUserInfo(token);

      // Save to keyring + localStorage as backup
      try {
        await cmd.saveToken(token);
      } catch { /* keyring unavailable */ }
      lsSave(token);

      set({ token, user, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try { await cmd.deleteToken(); } catch { /* ignore */ }
    lsClear();
    set({ token: null, user: null, error: null });
  },

  // ── Restore session on app start ───────────────────────────────────────────
  restoreSession: async () => {
    // isLoading already true from initial state
    try {
      // 1. Wait for Tauri IPC — on slow machines the webview may race ahead
      const tauriReady = await waitForTauri();

      let token: string | null = null;

      if (tauriReady) {
        // 2. Try secure keyring / store via Rust
        try {
          const has = await cmd.hasToken();
          if (has) token = await cmd.getToken();
        } catch {
          // keyring/store unavailable
        }
      }

      // 3. Fall back to localStorage (always available)
      if (!token) token = lsGet();

      if (!token) {
        set({ isLoading: false });
        return;
      }

      // 4. Validate token with GitHub (skip if offline)
      let user: GitHubUser | null = null;
      try {
        user = await cmd.getUserInfo(token);
        // Re-persist everywhere so both stores stay in sync
        try { await cmd.saveToken(token); } catch { /* ignore */ }
        lsSave(token);
      } catch {
        // Network error or token expired
        // If we can reach GitHub but token is bad → clear
        // If we can't reach GitHub → keep token and let user proceed
        try {
          // Quick connectivity check via fetch
          const online = await fetch("https://api.github.com", { method: "HEAD" })
            .then(() => true)
            .catch(() => false);
          if (online) {
            // Token is actually invalid — clear
            throw new Error("invalid token");
          } else {
            // Offline — keep token but no user info
            set({ token, user: null, isLoading: false });
            return;
          }
        } catch {
          try { await cmd.deleteToken(); } catch { /* ignore */ }
          lsClear();
          set({ token: null, user: null, isLoading: false });
          return;
        }
      }

      set({ token, user, isLoading: false });
    } catch {
      // Token expired or network error — clear and go to login
      try { await cmd.deleteToken(); } catch { /* ignore */ }
      lsClear();
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
