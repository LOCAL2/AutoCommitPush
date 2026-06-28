/**
 * Zustand store for Vercel integration state.
 * Persists token + team selection + per-project Vercel project mappings.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Per-project Vercel binding ───────────────────────────────────────────────
export interface VercelBinding {
  /** Vercel project ID */
  vercelProjectId: string;
  /** Vercel project name */
  vercelProjectName: string;
  /** Last deployment URL */
  lastDeployUrl: string | null;
  /** Last deployment UID */
  lastDeployId: string | null;
  /** Last deployment state */
  lastDeployState: string | null;
  /** ISO timestamp of last deploy */
  lastDeployedAt: string | null;
}

interface VercelState {
  // Auth
  token: string;
  teamId: string | null;   // null = personal account
  teamSlug: string | null;
  teamName: string | null;

  // Per-project mappings: acp project ID → Vercel binding
  bindings: Record<string, VercelBinding>;

  // Actions
  setToken: (token: string) => void;
  setTeam: (id: string | null, slug: string | null, name: string | null) => void;
  setBinding: (projectId: string, binding: VercelBinding) => void;
  updateBinding: (projectId: string, partial: Partial<VercelBinding>) => void;
  removeBinding: (projectId: string) => void;
  clearToken: () => void;
}

export const useVercelStore = create<VercelState>()(
  persist(
    (set) => ({
      token: "",
      teamId: null,
      teamSlug: null,
      teamName: null,
      bindings: {},

      setToken: (token) => set({ token }),
      setTeam: (id, slug, name) => set({ teamId: id, teamSlug: slug, teamName: name }),

      setBinding: (projectId, binding) =>
        set((s) => ({ bindings: { ...s.bindings, [projectId]: binding } })),

      updateBinding: (projectId, partial) =>
        set((s) => ({
          bindings: {
            ...s.bindings,
            [projectId]: { ...s.bindings[projectId], ...partial },
          },
        })),

      removeBinding: (projectId) =>
        set((s) => {
          const next = { ...s.bindings };
          delete next[projectId];
          return { bindings: next };
        }),

      clearToken: () => set({ token: "", teamId: null, teamSlug: null, teamName: null }),
    }),
    { name: "acp-vercel" }
  )
);
