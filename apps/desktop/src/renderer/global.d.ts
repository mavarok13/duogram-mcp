import type { DuogramDesktopApi } from "../shared/api.js";

declare global {
  interface Window {
    duogram: DuogramDesktopApi;
  }
}

export {};
