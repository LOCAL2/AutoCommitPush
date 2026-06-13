import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import * as cmd from "@/lib/tauri-commands";
import type { Project } from "@/types";

interface RepoChangedEvent {
  project_id: string;
  path: string;
}

/**
 * Watches project folders via OS file-system events (not polling).
 * Emits repo-changed → triggers onChange for instant status refresh.
 */
export function useRepoWatcher(
  projects: Project[],
  onChange: (projectId: string) => void
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const projectIds = new Set(projects.map((p) => p.id));

    projects.forEach((p) => {
      cmd.watchProject(p.id, p.path).catch(() => {});
    });

    const unlistenPromise = listen<RepoChangedEvent>("repo-changed", (event) => {
      const { project_id } = event.payload;
      if (projectIds.has(project_id)) {
        onChangeRef.current(project_id);
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      projects.forEach((p) => {
        cmd.unwatchProject(p.id).catch(() => {});
      });
    };
  }, [projects]);
}
