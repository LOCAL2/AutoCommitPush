import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, Theme } from "@/types";

interface SettingsState extends AppSettings {
  // Docker Hub
  dockerUsername: string;
  dockerPassword: string;
  dockerDefaultTag: string;
  // Actions
  setTheme: (theme: Theme) => void;
  setDefaultCommitMessage: (msg: string) => void;
  setDefaultPrivate: (v: boolean) => void;
  setLaunchOnStartup: (v: boolean) => void;
  setAuthorName: (name: string) => void;
  setAuthorEmail: (email: string) => void;
  setDockerCredentials: (username: string, password: string) => void;
  setDockerDefaultTag: (tag: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Git / commit
      defaultCommitMessage: "Update project",
      defaultPrivate: false,
      theme: "dark" as Theme,
      launchOnStartup: false,
      authorName: "",
      authorEmail: "",
      // Docker
      dockerUsername: "",
      dockerPassword: "",
      dockerDefaultTag: "latest",

      setTheme: (theme) => set({ theme }),
      setDefaultCommitMessage: (defaultCommitMessage) => set({ defaultCommitMessage }),
      setDefaultPrivate: (defaultPrivate) => set({ defaultPrivate }),
      setLaunchOnStartup: (launchOnStartup) => set({ launchOnStartup }),
      setAuthorName: (authorName) => set({ authorName }),
      setAuthorEmail: (authorEmail) => set({ authorEmail }),
      setDockerCredentials: (dockerUsername, dockerPassword) =>
        set({ dockerUsername, dockerPassword }),
      setDockerDefaultTag: (dockerDefaultTag) => set({ dockerDefaultTag }),
    }),
    { name: "acp-settings" }
  )
);
