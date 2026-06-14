/**
 * Zustand persist storage adapter backed by tauri-plugin-store.
 * Stores data in %APPDATA%\AutoCommitPush\store.json — shared between
 * dev mode and the production .exe, unlike localStorage which is
 * scoped to the WebView origin.
 */
import { load, type Store } from "@tauri-apps/plugin-store";
import type { PersistStorage, StorageValue } from "zustand/middleware";

// Singleton store instance
let _store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!_store) {
    _store = await load("store.json", { autoSave: true, defaults: {} });
  }
  return _store;
}

export function createTauriStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name: string): Promise<StorageValue<T> | null> => {
      try {
        const store = await getStore();
        const value = await store.get<StorageValue<T>>(name);
        return value ?? null;
      } catch {
        return null;
      }
    },

    setItem: async (name: string, value: StorageValue<T>): Promise<void> => {
      try {
        const store = await getStore();
        await store.set(name, value);
      } catch {
        // fallback silently — store still works via in-memory state
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        const store = await getStore();
        await store.delete(name);
      } catch {
        // ignore
      }
    },
  };
}
