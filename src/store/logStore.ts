import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LogEntry, LogLevel } from "@/types";
import { generateId } from "@/lib/utils";

interface LogState {
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, projectId?: string, projectLabel?: string) => void;
  clearLogs: () => void;
  clearProjectLogs: (projectId: string) => void;
  exportLogs: () => string;
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (level, message, projectId, projectLabel) => {
        const entry: LogEntry = {
          id: generateId(),
          timestamp: new Date().toISOString(),
          level,
          message,
          projectId,
          projectLabel,
        };
        // Keep newest first, cap at 500 entries
        set((s) => ({ logs: [entry, ...s.logs].slice(0, 500) }));
      },

      clearLogs: () => set({ logs: [] }),

      clearProjectLogs: (projectId) =>
        set((s) => ({ logs: s.logs.filter((l) => l.projectId !== projectId) })),

      exportLogs: () => {
        const { logs } = get();
        return logs
          .map(
            (l) =>
              `[${l.timestamp}] [${l.level.toUpperCase()}]${
                l.projectLabel ? ` [${l.projectLabel}]` : ""
              } ${l.message}`
          )
          .join("\n");
      },
    }),
    {
      name: "acp-logs",
      // Only persist the logs array — actions are recreated each session
      partialize: (state) => ({ logs: state.logs }),
    }
  )
);
