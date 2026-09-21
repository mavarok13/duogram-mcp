import { contextBridge, ipcRenderer } from "electron";

import type { DuogramDesktopApi, ExternalChange } from "../shared/api.js";

// Sandboxed preload scripts cannot require local runtime modules.
const IPC_CHANNELS = {
  selectProject: "duogram:select-project",
  readProject: "duogram:read-project",
  readBoard: "duogram:read-board",
  writeBoard: "duogram:write-board",
  createSpace: "duogram:create-space",
  renameSpace: "duogram:rename-space",
  deleteSpace: "duogram:delete-space",
  createBoard: "duogram:create-board",
  renameBoard: "duogram:rename-board",
  moveBoard: "duogram:move-board",
  deleteBoard: "duogram:delete-board",
  externalChange: "duogram:external-change",
} as const;

const api: DuogramDesktopApi = {
  selectProject: () => ipcRenderer.invoke(IPC_CHANNELS.selectProject),
  readProject: () => ipcRenderer.invoke(IPC_CHANNELS.readProject),
  readBoard: (boardId) => ipcRenderer.invoke(IPC_CHANNELS.readBoard, boardId),
  writeBoard: (board, expectedRevision) =>
    ipcRenderer.invoke(IPC_CHANNELS.writeBoard, board, expectedRevision),
  createSpace: (name, expectedRevision) =>
    ipcRenderer.invoke(IPC_CHANNELS.createSpace, name, expectedRevision),
  renameSpace: (spaceId, name, expectedRevision) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.renameSpace,
      spaceId,
      name,
      expectedRevision,
    ),
  deleteSpace: (spaceId, expectedRevision) =>
    ipcRenderer.invoke(IPC_CHANNELS.deleteSpace, spaceId, expectedRevision),
  createBoard: (spaceId, name, expectedRevision) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.createBoard,
      spaceId,
      name,
      expectedRevision,
    ),
  renameBoard: (boardId, name, expectedRevision) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.renameBoard,
      boardId,
      name,
      expectedRevision,
    ),
  moveBoard: (boardId, targetSpaceId, targetIndex, expectedRevision) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.moveBoard,
      boardId,
      targetSpaceId,
      targetIndex,
      expectedRevision,
    ),
  deleteBoard: (boardId, expectedProjectRevision, expectedBoardRevision) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.deleteBoard,
      boardId,
      expectedProjectRevision,
      expectedBoardRevision,
    ),
  onExternalChange: (listener) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      change: ExternalChange,
    ) => {
      listener(change);
    };
    ipcRenderer.on(IPC_CHANNELS.externalChange, handler);
    return () =>
      ipcRenderer.removeListener(IPC_CHANNELS.externalChange, handler);
  },
};

contextBridge.exposeInMainWorld("duogram", api);
