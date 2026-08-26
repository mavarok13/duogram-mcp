import { contextBridge, ipcRenderer } from "electron";

import type { DuogramDesktopApi, ExternalChange } from "../shared/api.js";

// Sandboxed preload scripts cannot require local runtime modules.
const IPC_CHANNELS = {
  selectProject: "duogram:select-project",
  readProject: "duogram:read-project",
  readBoard: "duogram:read-board",
  writeBoard: "duogram:write-board",
  externalChange: "duogram:external-change",
} as const;

const api: DuogramDesktopApi = {
  selectProject: () => ipcRenderer.invoke(IPC_CHANNELS.selectProject),
  readProject: () => ipcRenderer.invoke(IPC_CHANNELS.readProject),
  readBoard: (boardId) => ipcRenderer.invoke(IPC_CHANNELS.readBoard, boardId),
  writeBoard: (board, expectedRevision) =>
    ipcRenderer.invoke(IPC_CHANNELS.writeBoard, board, expectedRevision),
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
