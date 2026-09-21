import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { BoardV1, Element, ProjectV1 } from "@duogram/core";
import { applyBoardOperations } from "@duogram/core/operations";

import { Canvas } from "./Canvas.js";
import { DeleteConfirmation } from "./DeleteConfirmation.js";
import { createElement, type NewElementKind } from "./element-factory.js";
import {
  commitHistory,
  createHistory,
  redoHistory,
  undoHistory,
  type History,
} from "./history.js";
import { InlineNameInput } from "./InlineNameInput.js";
import { Inspector } from "./Inspector.js";
import { Sidebar } from "./Sidebar.js";
import type {
  DesktopError,
  DesktopResult,
  ExternalChange,
  OpenProjectValue,
} from "../shared/api.js";

type SaveState = "saved" | "dirty" | "saving" | "error";

export function App() {
  const [opened, setOpened] = useState<OpenProjectValue | null>(null);
  const [project, setProject] = useState<ProjectV1 | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [history, setHistory] = useState<History<BoardV1> | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [savedRevision, setSavedRevision] = useState(0);
  const [editVersion, setEditVersion] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState<DesktopError | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [deletion, setDeletion] = useState<{
    kind: "board" | "space";
    id: string;
    name: string;
  } | null>(null);
  const saveInFlight = useRef(false);
  const projectRef = useRef<ProjectV1 | null>(null);

  const setCurrentProject = (value: ProjectV1) => {
    projectRef.current = value;
    setProject(value);
  };

  const dirty = history !== null && editVersion !== savedVersion;
  const displayedSaveState =
    dirty && saveState === "saved" ? "dirty" : saveState;
  const board = history?.present ?? null;
  const selectedElement =
    board?.elements.find((element) => element.id === selectedElementIds[0]) ??
    null;

  const loadBoard = async (boardId: string) => {
    const result = await window.duogram.readBoard(boardId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelectedBoardId(boardId);
    setHistory(createHistory(result.value));
    setSelectedElementIds([]);
    setSavedRevision(result.value.revision);
    setEditVersion(0);
    setSavedVersion(0);
    setSaveState("saved");
    setConflict(null);
    setError(null);
  };

  const acceptProject = async (value: OpenProjectValue) => {
    setOpened(value);
    setCurrentProject(value.project);
    const firstBoard = firstBoardId(value.project);
    if (firstBoard === null) {
      setSelectedBoardId(null);
      setHistory(null);
      return;
    }
    await loadBoard(firstBoard);
  };

  const chooseProject = async () => {
    if (dirty) {
      setError({
        code: "UNKNOWN",
        message: "Wait for autosave before opening another project.",
      });
      return;
    }
    const result = await window.duogram.selectProject();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.value !== null) await acceptProject(result.value);
  };

  const projectEditBlocked = (): boolean => {
    if (!dirty) return false;
    setError({
      code: "UNKNOWN",
      message: "Wait for autosave before changing project navigation.",
    });
    return true;
  };

  const applyProjectResult = (result: DesktopResult<ProjectV1>): boolean => {
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setCurrentProject(result.value);
    setError(null);
    return true;
  };

  const readProjectForWrite = async (): Promise<ProjectV1 | null> => {
    const result = await window.duogram.readProject();
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    setCurrentProject(result.value);
    return result.value;
  };

  const renameSpace = async (spaceId: string, name: string) => {
    const currentProject = await readProjectForWrite();
    if (currentProject === null) return;
    applyProjectResult(
      await window.duogram.renameSpace(spaceId, name, currentProject.revision),
    );
  };

  const renameBoard = async (boardId: string, name: string) => {
    const currentProject = await readProjectForWrite();
    if (currentProject === null) return;
    applyProjectResult(
      await window.duogram.renameBoard(boardId, name, currentProject.revision),
    );
  };

  const createSpace = async (name: string) => {
    if (projectEditBlocked()) return;
    const currentProject = await readProjectForWrite();
    if (currentProject === null) return;
    applyProjectResult(
      await window.duogram.createSpace(name, currentProject.revision),
    );
  };

  const deleteSpace = async (spaceId: string) => {
    if (projectEditBlocked()) return;
    const currentProject = await readProjectForWrite();
    if (currentProject === null) return;
    const space = currentProject.spaces.find(
      (candidate) => candidate.id === spaceId,
    );
    if (space === undefined) return;
    applyProjectResult(
      await window.duogram.deleteSpace(spaceId, currentProject.revision),
    );
  };

  const createBoard = async (spaceId: string, name: string) => {
    if (projectEditBlocked()) return;
    const currentProject = await readProjectForWrite();
    if (currentProject === null) return;
    const result = await window.duogram.createBoard(
      spaceId,
      name,
      currentProject.revision,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrentProject(result.value.project);
    await loadBoard(result.value.board.id);
  };

  const deleteBoard = async (boardId: string) => {
    if (projectEditBlocked()) return;
    const currentProject = await readProjectForWrite();
    if (currentProject === null) return;
    const boardResult = await window.duogram.readBoard(boardId);
    if (!boardResult.ok) {
      setError(boardResult.error);
      return;
    }
    const result = await window.duogram.deleteBoard(
      boardId,
      currentProject.revision,
      boardResult.value.revision,
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCurrentProject(result.value);
    if (selectedBoardId === boardId) {
      const nextBoardId = firstBoardId(result.value);
      if (nextBoardId === null) {
        setSelectedBoardId(null);
        setHistory(null);
        setSelectedElementIds([]);
      } else {
        setSelectedBoardId(nextBoardId);
        setHistory(null);
        setSelectedElementIds([]);
        await loadBoard(nextBoardId);
      }
    }
  };

  const moveBoard = async (
    boardId: string,
    targetSpaceId: string,
    targetIndex?: number,
  ) => {
    if (projectEditBlocked()) return;
    const currentProject = await readProjectForWrite();
    if (currentProject === null) return;
    const source = locateBoard(currentProject, boardId);
    if (source === null) return;
    applyProjectResult(
      await window.duogram.moveBoard(
        boardId,
        targetSpaceId,
        targetIndex,
        currentProject.revision,
      ),
    );
  };

  const commitBoard = (next: BoardV1) => {
    setHistory((current) =>
      current === null ? createHistory(next) : commitHistory(current, next),
    );
    setEditVersion((version) => version + 1);
    setSaveState("dirty");
    setError(null);
  };

  const changeElement = (element: Element) => {
    if (board === null) return;
    commitBoard({
      ...board,
      elements: board.elements.map((candidate) =>
        candidate.id === element.id ? element : candidate,
      ),
    });
  };

  const deleteSelected = () => {
    if (board === null || selectedElementIds.length === 0) return;
    const next = applyBoardOperations(
      board,
      board.revision,
      selectedElementIds.map((element_id) => ({
        type: "delete" as const,
        element_id,
      })),
    );
    commitBoard({ ...next, revision: board.revision });
    setSelectedElementIds([]);
  };

  const addElement = (kind: NewElementKind) => {
    if (board === null) return;
    const element = createElement(kind, board.elements.length);
    commitBoard({ ...board, elements: [...board.elements, element] });
    setSelectedElementIds([element.id]);
  };

  const undo = () => {
    if (history === null || history.past.length === 0) return;
    setHistory(undoHistory(history));
    setEditVersion((version) => version + 1);
    setSaveState("dirty");
  };

  const redo = () => {
    if (history === null || history.future.length === 0) return;
    setHistory(redoHistory(history));
    setEditVersion((version) => version + 1);
    setSaveState("dirty");
  };

  const saveCurrentBoard = useEffectEvent(async () => {
    if (
      history === null ||
      selectedBoardId === null ||
      editVersion === savedVersion ||
      conflict !== null ||
      saveInFlight.current
    ) {
      return;
    }
    saveInFlight.current = true;
    setSaveState("saving");
    const version = editVersion;
    const boardId = selectedBoardId;
    const expectedRevision = savedRevision;
    const candidate = { ...history.present, revision: expectedRevision };
    const result = await window.duogram.writeBoard(candidate, expectedRevision);
    saveInFlight.current = false;
    if (boardId !== selectedBoardId) return;
    if (!result.ok) {
      setSaveState("error");
      if (result.error.code === "CONFLICT") setConflict(result.error.message);
      else setError(result.error);
      return;
    }
    setSavedRevision(result.value.revision);
    setSavedVersion(version);
    setSaveState(version === editVersion ? "saved" : "dirty");
  });

  useEffect(() => {
    if (!dirty || conflict !== null) return;
    const timer = window.setTimeout(() => void saveCurrentBoard(), 550);
    return () => {
      window.clearTimeout(timer);
    };
  }, [dirty, editVersion, conflict, saveCurrentBoard]);

  const handleExternalChange = useEffectEvent(
    async (change: ExternalChange) => {
      if (project === null) return;
      if (change.kind === "project") {
        const result = await window.duogram.readProject();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setCurrentProject(result.value);
        if (
          selectedBoardId !== null &&
          locateBoard(result.value, selectedBoardId) === null
        ) {
          if (dirty) {
            setConflict("The current board was removed from the project.");
            return;
          }
          const nextBoardId = firstBoardId(result.value);
          if (nextBoardId === null) {
            setSelectedBoardId(null);
            setHistory(null);
            setSelectedElementIds([]);
          } else {
            await loadBoard(nextBoardId);
          }
        }
        return;
      }
      const affectsBoard =
        change.kind === "unknown" || change.board_id === selectedBoardId;
      if (!affectsBoard || selectedBoardId === null) return;
      if (
        projectRef.current !== null &&
        locateBoard(projectRef.current, selectedBoardId) === null
      ) {
        return;
      }
      if (dirty) {
        setConflict(
          "The board changed on disk while local edits were pending.",
        );
        return;
      }
      await loadBoard(selectedBoardId);
    },
  );

  useEffect(
    () =>
      window.duogram.onExternalChange(
        (change) => void handleExternalChange(change),
      ),
    [handleExternalChange],
  );

  const handleKeyboard = useEffectEvent((event: KeyboardEvent) => {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    } else if (modifier && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    } else if (
      (event.key === "Delete" || event.key === "Backspace") &&
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      deleteSelected();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [handleKeyboard]);

  const reloadConflict = async () => {
    if (selectedBoardId !== null) await loadBoard(selectedBoardId);
  };

  const keepLocal = async () => {
    if (selectedBoardId === null) return;
    const result = await window.duogram.readBoard(selectedBoardId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedRevision(result.value.revision);
    setConflict(null);
    setEditVersion((version) => version + 1);
    setSaveState("dirty");
  };

  if (opened === null || project === null) {
    return <Welcome onOpen={() => void chooseProject()} error={error} />;
  }

  return (
    <main className="app-shell">
      {deletion !== null && (
        <DeleteConfirmation
          name={deletion.name}
          onCancel={() => {
            setDeletion(null);
          }}
          onConfirm={async () => {
            try {
              if (deletion.kind === "board") await deleteBoard(deletion.id);
              else await deleteSpace(deletion.id);
            } catch (cause) {
              setError({ code: "UNKNOWN", message: String(cause) });
            }
          }}
        />
      )}
      <Sidebar
        project={project}
        directory={opened.directory}
        selectedBoardId={selectedBoardId}
        onSelectBoard={(boardId) => {
          if (dirty) {
            setError({
              code: "UNKNOWN",
              message: "Wait for autosave before switching boards.",
            });
          } else {
            void loadBoard(boardId);
          }
        }}
        onOpenProject={() => void chooseProject()}
        onCreateSpace={(name) => void createSpace(name)}
        onRenameSpace={(spaceId, name) => void renameSpace(spaceId, name)}
        onDeleteSpace={(spaceId) => {
          const space = project.spaces.find((item) => item.id === spaceId);
          if (space !== undefined)
            setDeletion({ kind: "space", id: spaceId, name: space.name });
        }}
        onCreateBoard={(spaceId, name) => void createBoard(spaceId, name)}
        onRenameBoard={(boardId, name) => void renameBoard(boardId, name)}
        onDeleteBoard={(boardId) => {
          setDeletion({
            kind: "board",
            id: boardId,
            name: boardName(project, boardId),
          });
        }}
        onMoveBoard={(boardId, targetSpaceId, targetIndex) =>
          void moveBoard(boardId, targetSpaceId, targetIndex)
        }
      />
      <section className="workspace">
        <header className="workspace-toolbar">
          <div className="tool-group">
            <button
              type="button"
              onClick={() => {
                addElement("shape");
              }}
              disabled={board === null}
            >
              Shape
            </button>
            <button
              type="button"
              onClick={() => {
                addElement("text");
              }}
              disabled={board === null}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => {
                addElement("line");
              }}
              disabled={board === null}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => {
                addElement("arrow");
              }}
              disabled={board === null}
            >
              Arrow
            </button>
          </div>
          <BoardTitle
            key={selectedBoardId ?? "none"}
            name={boardName(project, selectedBoardId)}
            revision={savedRevision}
            disabled={board === null}
            onRename={(name) => {
              if (selectedBoardId !== null)
                void renameBoard(selectedBoardId, name);
            }}
          />
          <div className="toolbar-actions">
            <button
              type="button"
              onClick={undo}
              disabled={history?.past.length === 0}
            >
              Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={history?.future.length === 0}
            >
              Redo
            </button>
            <span className={`save-state ${displayedSaveState}`}>
              <i />
              {saveLabel(displayedSaveState)}
            </span>
          </div>
        </header>

        {conflict !== null && (
          <div className="alert conflict-alert">
            <div>
              <strong>Revision conflict</strong>
              <span>{conflict}</span>
            </div>
            <button type="button" onClick={() => void reloadConflict()}>
              Reload disk
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => void keepLocal()}
            >
              Keep local
            </button>
          </div>
        )}
        {error !== null && (
          <div className="alert error-alert">
            <div>
              <strong>
                {error.code === "VALIDATION"
                  ? "Validation failed"
                  : "Desktop error"}
              </strong>
              <span>{error.message}</span>
              {error.issues?.map((issue) => (
                <small key={issue}>{issue}</small>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="editor-grid">
          {board === null ? (
            <div className="empty-board">
              <span className="eyebrow">No board selected</span>
              <p>
                Create a board through Duogram MCP, then reopen the project.
              </p>
            </div>
          ) : (
            <Canvas
              board={board}
              selectedIds={selectedElementIds}
              onSelect={setSelectedElementIds}
              onCommit={commitBoard}
            />
          )}
          <Inspector
            element={selectedElement}
            onChange={changeElement}
            onDelete={deleteSelected}
          />
        </div>
      </section>
    </main>
  );
}

function BoardTitle({
  name,
  revision,
  disabled,
  onRename,
}: {
  name: string;
  revision: number;
  disabled: boolean;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing && !disabled) {
    return (
      <div className="board-title-editor">
        <InlineNameInput
          value={name}
          placeholder="Board name"
          ariaLabel="Board name"
          onCommit={(nextName) => {
            setEditing(false);
            onRename(nextName);
          }}
          onCancel={() => {
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className="board-title"
      title="Rename board"
      disabled={disabled}
      onClick={() => {
        setEditing(true);
      }}
    >
      <strong>{name}</strong>
      <span>board rev {revision}</span>
    </button>
  );
}

function Welcome({
  onOpen,
  error,
}: {
  onOpen: () => void;
  error: DesktopError | null;
}) {
  return (
    <main className="welcome-screen">
      <div className="welcome-orbit">
        <span>DG</span>
      </div>
      <section className="welcome-card">
        <span className="eyebrow">Local-first visual boards</span>
        <h1>Inspect what your agents draw.</h1>
        <p>
          Open an initialized Duogram project. Board JSON stays the source of
          truth while this desktop session provides visual editing and undo.
        </p>
        <button type="button" className="open-button" onClick={onOpen}>
          Open project directory
        </button>
        {error !== null && (
          <div className="welcome-error">
            <strong>{error.code}</strong>
            <span>{error.message}</span>
          </div>
        )}
      </section>
      <footer>Duogram desktop / session history is not persisted</footer>
    </main>
  );
}

function firstBoardId(project: ProjectV1): string | null {
  for (const space of project.spaces) {
    const board = space.boards[0];
    if (board !== undefined) return board.id;
  }
  return null;
}

function boardName(project: ProjectV1, boardId: string | null): string {
  for (const space of project.spaces) {
    const board = space.boards.find((candidate) => candidate.id === boardId);
    if (board !== undefined) return board.name;
  }
  return "No board";
}

function locateBoard(
  project: ProjectV1,
  boardId: string,
): { spaceId: string; index: number } | null {
  for (const space of project.spaces) {
    const index = space.boards.findIndex((board) => board.id === boardId);
    if (index >= 0) return { spaceId: space.id, index };
  }
  return null;
}

function saveLabel(state: SaveState): string {
  if (state === "saving") return "Saving";
  if (state === "dirty") return "Unsaved";
  if (state === "error") return "Needs attention";
  return "Saved";
}
