import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, Theme } from "@/types";
import type { AvatarFrameId } from "@/components/AvatarWithFrame";
import type { NameEffectId } from "@/components/NameEffect";
import { createTauriStorage } from "@/lib/tauriStorage";

interface SettingsState extends AppSettings {
  avatarFrame: AvatarFrameId;
  nameEffect: NameEffectId;
  // AI Settings
  aiProvider: "gemini" | "openai";
  aiApiKey: string;
  // Docker Hub
  dockerUsername: string;
  dockerPassword: string;
  dockerDefaultTag: string;
  // Actions
  setTheme: (theme: Theme) => void;
  setAvatarFrame: (frame: AvatarFrameId) => void;
  setNameEffect: (effect: NameEffectId) => void;
  setAiSettings: (provider: "gemini" | "openai", apiKey: string) => void;
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
      nameEffect: "none",
      // AI
      aiProvider: "gemini",
      aiApiKey: "",
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
      setNameEffect: (nameEffect) => set({ nameEffect }),
      setAiSettings: (aiProvider, aiApiKey) => set({ aiProvider, aiApiKey }),
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
