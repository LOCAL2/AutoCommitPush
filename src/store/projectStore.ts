import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Project } from "@/types";
import { generateId, getRepoNameFromPath } from "@/lib/utils";

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  // actions
  addProject: (path: string, label?: string) => Project;
  removeProject: (id: string) => void;
  renameProject: (id: string, label: string) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  selectProject: (id: string | null) => void;
  getSelected: () => Project | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      selectedProjectId: null,

      addProject: (path, label) => {
        const project: Project = {
          id: generateId(),
          label: label ?? getRepoNameFromPath(path),
          path,
          createdAt: new Date().toISOString(),
          lastPushedAt: null,
          autoCommitEnabled: false,
          autoCommitInterval: 15,
          defaultBranch: "main",
          remoteUrl: null,
        };
        set((s) => ({ projects: [...s.projects, project] }));
        return project;
      },

      removeProject: (id) =>
        set((s) => {
          // ── Hard delete: wipe ALL state for this project ──────────────────
          // Next time the same folder is added, it starts completely fresh
          const project = s.projects.find((p) => p.id === id);
          if (!project) return s;

          return {
            projects: s.projects.filter((p) => p.id !== id),
            selectedProjectId:
              s.selectedProjectId === id ? null : s.selectedProjectId,
          };
        }),

      renameProject: (id, label) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, label } : p
          ),
        })),

      updateProject: (id, partial) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...partial } : p
          ),
        })),

      selectProject: (id) => set({ selectedProjectId: id }),

      getSelected: () => {
        const { projects, selectedProjectId } = get();
        return projects.find((p) => p.id === selectedProjectId);
      },
    }),
    { name: "acp-projects" }
  )
);
