import { watch, type FSWatcher } from "node:fs";
import path from "node:path";

import { ProjectStorage, type BoardV1, type ProjectV1 } from "@duogram/core";

import type { ExternalChange, OpenProjectValue } from "../shared/api.js";

export class ProjectSession {
  private storage: ProjectStorage | null = null;
  private watchers: FSWatcher[] = [];
  private suppressEventsUntil = 0;

  onExternalChange: ((change: ExternalChange) => void) | null = null;

  async open(directory: string): Promise<OpenProjectValue> {
    this.close();
    const storage = new ProjectStorage(path.resolve(directory));
    const project = await storage.readProject();
    this.storage = storage;
    this.watchers = [
      watch(storage.dataDirectory, (_, fileName) => {
        if (fileName === "project.json") this.emit({ kind: "project" });
      }),
      watch(storage.boardsDirectory, (_, fileName) => {
        const match = fileName?.match(/^([0-9a-f-]+)\.json$/);
        this.emit(
          match?.[1] === undefined
            ? { kind: "unknown" }
            : { kind: "board", board_id: match[1] },
        );
      }),
    ];
    for (const watcher of this.watchers) {
      watcher.on("error", () => {
        this.emit({ kind: "unknown" });
      });
    }
    return { directory: storage.projectDirectory, project };
  }

  readProject(): Promise<ProjectV1> {
    return this.requireStorage().readProject();
  }

  readBoard(boardId: string): Promise<BoardV1> {
    return this.requireStorage().readBoard(boardId);
  }

  async writeBoard(board: BoardV1, expectedRevision: number): Promise<BoardV1> {
    this.suppressEventsUntil = Date.now() + 500;
    try {
      return await this.requireStorage().writeBoard(board, expectedRevision);
    } finally {
      this.suppressEventsUntil = Date.now() + 500;
    }
  }

  close(): void {
    for (const watcher of this.watchers) watcher.close();
    this.watchers = [];
    this.storage = null;
  }

  private requireStorage(): ProjectStorage {
    if (this.storage === null) throw new Error("no Duogram project is open");
    return this.storage;
  }

  private emit(change: ExternalChange): void {
    if (Date.now() < this.suppressEventsUntil) return;
    this.onExternalChange?.(change);
  }
}
