/**
 * Platform detection — distinguishes Tauri (desktop) from plain browser (web/Vercel).
 *
 * Usage:
 *   import { isTauri, isWeb } from "@/lib/platform";
 *
 *   if (isTauri) { // use Tauri IPC }
 *   else          { // use GitHub REST API directly }
 */

/** True when running inside a Tauri WebView (desktop app). */
export const isTauri: boolean = (() => {
  try {
    // Tauri v2 injects window.__TAURI_INTERNALS__
    // Tauri v1 injects window.__TAURI__
    return (
      typeof window !== "undefined" &&
      (
        !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ ||
        !!(window as unknown as Record<string, unknown>).__TAURI__
      )
    );
  } catch {
    return false;
  }
})();

/** True when running in a normal browser (Vercel, local `vite dev`, etc.). */
export const isWeb: boolean = !isTauri;
