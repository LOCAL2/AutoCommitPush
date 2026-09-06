import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, Theme } from "@/types";
import type { AvatarFrameId } from "@/components/AvatarWithFrame";
import { createTauriStorage } from "@/lib/tauriStorage";

interface SettingsState extends AppSettings {
  avatarFrame: AvatarFrameId;
  // Docker Hub
  dockerUsername: string;
  dockerPassword: string;
  dockerDefaultTag: string;
  // Actions
  setTheme: (theme: Theme) => void;
  setAvatarFrame: (frame: AvatarFrameId) => void;
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
      avatarFrame: "none",
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
      setAvatarFrame: (avatarFrame) => set({ avatarFrame }),
      setDefaultCommitMessage: (defaultCommitMessage) => set({ defaultCommitMessage }),
      setDefaultPrivate: (defaultPrivate) => set({ defaultPrivate }),
      setLaunchOnStartup: (launchOnStartup) => set({ launchOnStartup }),
      setAuthorName: (authorName) => set({ authorName }),
      setAuthorEmail: (authorEmail) => set({ authorEmail }),
      setDockerCredentials: (dockerUsername, dockerPassword) =>
        set({ dockerUsername, dockerPassword }),
      setDockerDefaultTag: (dockerDefaultTag) => set({ dockerDefaultTag }),
    }),
    {
      name: "acp-settings",
      storage: createTauriStorage<SettingsState>(),
    }
  )
);
