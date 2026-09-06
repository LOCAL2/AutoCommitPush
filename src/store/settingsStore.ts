import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, ThemePreset, AccentColor } from "@/types";
import type { AvatarFrameId } from "@/components/AvatarWithFrame";
import type { NameEffectId } from "@/components/NameEffect";
import { createTauriStorage } from "@/lib/tauriStorage";

interface SettingsState extends AppSettings {
  avatarFrame: AvatarFrameId;
  nameEffect: NameEffectId;
  theme: ThemePreset;
  accentColor: AccentColor;
  bgImageUrl: string;
  bgOpacity: number;
  // AI Settings
  aiProvider: "gemini" | "openai";
  geminiApiKey: string;
  openaiApiKey: string;
  // Legacy getter fallback helper
  aiApiKey: string;
  // Docker Hub
  dockerUsername: string;
  dockerPassword: string;
  dockerDefaultTag: string;
  // Actions
  setTheme: (theme: ThemePreset) => void;
  setAccentColor: (accent: AccentColor) => void;
  setBgImageUrl: (url: string) => void;
  setBgOpacity: (opacity: number) => void;
  setAvatarFrame: (frame: AvatarFrameId) => void;
  setAvatarFrame: (frame: AvatarFrameId) => void;
  setNameEffect: (effect: NameEffectId) => void;
  setAiProvider: (provider: "gemini" | "openai") => void;
  setGeminiApiKey: (key: string) => void;
  setOpenAiApiKey: (key: string) => void;
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
    (set, get) => ({
      avatarFrame: "none",
      nameEffect: "none",
      // AI
      aiProvider: "gemini",
      geminiApiKey: "",
      openaiApiKey: "",
      get aiApiKey() {
        const state = get();
        return state.aiProvider === "gemini" ? state.geminiApiKey : state.openaiApiKey;
      },
      // Git / commit
      defaultCommitMessage: "Update project",
      defaultPrivate: false,
      theme: "dark" as ThemePreset,
      accentColor: "default",
      bgImageUrl: "",
      bgOpacity: 0.25,
      launchOnStartup: false,
      authorName: "",
      authorEmail: "",
      // Docker
      dockerUsername: "",
      dockerPassword: "",
      dockerDefaultTag: "latest",

      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setBgImageUrl: (bgImageUrl) => set({ bgImageUrl }),
      setBgOpacity: (bgOpacity) => set({ bgOpacity }),
      setAvatarFrame: (avatarFrame) => set({ avatarFrame }),
      setNameEffect: (nameEffect) => set({ nameEffect }),
      setAiProvider: (aiProvider) => set({ aiProvider }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setOpenAiApiKey: (openaiApiKey) => set({ openaiApiKey }),
      setAiSettings: (aiProvider, apiKey) =>
        set((state) => ({
          aiProvider,
          geminiApiKey: aiProvider === "gemini" ? apiKey : state.geminiApiKey,
          openaiApiKey: aiProvider === "openai" ? apiKey : state.openaiApiKey,
        })),
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
