import path from "node:path";
import { fileURLToPath } from "node:url";

import { app, BrowserWindow, dialog, ipcMain } from "electron";

import { desktopResult } from "./errors.js";
import { ProjectSession } from "./project-session.js";
import { IPC_CHANNELS } from "../shared/api.js";
import type { BoardV1 } from "@duogram/core";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const session = new ProjectSession();
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: "#111318",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(currentDirectory, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  void mainWindow.loadFile(
    path.join(currentDirectory, "../../renderer/index.html"),
  );
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file:")) event.preventDefault();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpc(): void {
  session.onExternalChange = (change) => {
    mainWindow?.webContents.send(IPC_CHANNELS.externalChange, change);
  };
  ipcMain.handle(IPC_CHANNELS.selectProject, async () => {
    const options: Electron.OpenDialogOptions = {
      title: "Open Duogram project",
      properties: ["openDirectory"],
    };
    const selection =
      mainWindow === null
        ? await dialog.showOpenDialog(options)
        : await dialog.showOpenDialog(mainWindow, options);
    const directory = selection.filePaths[0];
    if (selection.canceled || directory === undefined) {
      return { ok: true, value: null } as const;
    }
    return desktopResult(() => session.open(directory));
  });
  ipcMain.handle(IPC_CHANNELS.readProject, () =>
    desktopResult(() => session.readProject()),
  );
  ipcMain.handle(IPC_CHANNELS.readBoard, (_event, boardId: string) =>
    desktopResult(() => session.readBoard(boardId)),
  );
  ipcMain.handle(
    IPC_CHANNELS.writeBoard,
    (_event, board: BoardV1, expectedRevision: number) =>
      desktopResult(() => session.writeBoard(board, expectedRevision)),
  );
}

void app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  session.close();
  if (process.platform !== "darwin") app.quit();
});
