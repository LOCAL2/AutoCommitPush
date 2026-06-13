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

      // Try keyring first, fall back to localStorage
      try {
        await cmd.saveToken(token);
      } catch {
        lsSave(token);
      }

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
      // 1. Try secure keyring
      let token: string | null = null;
      try {
        const has = await cmd.hasToken();
        if (has) token = await cmd.getToken();
      } catch {
        // keyring unavailable on this machine
      }

      // 2. Fall back to localStorage
      if (!token) token = lsGet();

      if (!token) {
        set({ isLoading: false });
        return;
      }

      // 3. Validate token is still good
      const user = await cmd.getUserInfo(token);

      // 4. Re-save to keyring in case it was from localStorage
      try { await cmd.saveToken(token); } catch { lsSave(token); }

      set({ token, user, isLoading: false });
    } catch {
      // Token expired or invalid — clear everything
      try { await cmd.deleteToken(); } catch { /* ignore */ }
      lsClear();
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
