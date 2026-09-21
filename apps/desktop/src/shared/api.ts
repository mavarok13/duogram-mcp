import type { BoardV1, ProjectV1 } from "@duogram/core";

export const IPC_CHANNELS = {
  selectProject: "duogram:select-project",
  readProject: "duogram:read-project",
  readBoard: "duogram:read-board",
  writeBoard: "duogram:write-board",
  createSpace: "duogram:create-space",
  renameSpace: "duogram:rename-space",
  createBoard: "duogram:create-board",
  renameBoard: "duogram:rename-board",
  moveBoard: "duogram:move-board",
  deleteBoard: "duogram:delete-board",
  externalChange: "duogram:external-change",
} as const;

export type DesktopErrorCode =
  "NO_PROJECT" | "VALIDATION" | "CONFLICT" | "LOCKED" | "IO" | "UNKNOWN";

export interface DesktopError {
  code: DesktopErrorCode;
  message: string;
  issues?: readonly string[];
}

export type DesktopResult<T> =
  { ok: true; value: T } | { ok: false; error: DesktopError };

export interface OpenProjectValue {
  directory: string;
  project: ProjectV1;
}

export interface CreateBoardValue {
  project: ProjectV1;
  board: BoardV1;
}

export type ExternalChange =
  | { kind: "project" }
  | { kind: "board"; board_id: string }
  | { kind: "unknown" };

export interface DuogramDesktopApi {
  selectProject(): Promise<DesktopResult<OpenProjectValue | null>>;
  readProject(): Promise<DesktopResult<ProjectV1>>;
  readBoard(boardId: string): Promise<DesktopResult<BoardV1>>;
  writeBoard(
    board: BoardV1,
    expectedRevision: number,
  ): Promise<DesktopResult<BoardV1>>;
  createSpace(
    name: string,
    expectedRevision: number,
  ): Promise<DesktopResult<ProjectV1>>;
  renameSpace(
    spaceId: string,
    name: string,
    expectedRevision: number,
  ): Promise<DesktopResult<ProjectV1>>;
  createBoard(
    spaceId: string,
    name: string,
    expectedRevision: number,
  ): Promise<DesktopResult<CreateBoardValue>>;
  renameBoard(
    boardId: string,
    name: string,
    expectedRevision: number,
  ): Promise<DesktopResult<ProjectV1>>;
  moveBoard(
    boardId: string,
    targetSpaceId: string,
    targetIndex: number | undefined,
    expectedRevision: number,
  ): Promise<DesktopResult<ProjectV1>>;
  deleteBoard(
    boardId: string,
    expectedProjectRevision: number,
    expectedBoardRevision: number,
  ): Promise<DesktopResult<ProjectV1>>;
  onExternalChange(listener: (change: ExternalChange) => void): () => void;
}
