import { useRef, useState, type DragEvent } from "react";

import type { ProjectV1 } from "@duogram/core";

import { InlineNameInput } from "./InlineNameInput.js";

interface SidebarProps {
  project: ProjectV1;
  directory: string;
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onOpenProject: () => void;
  onCreateSpace: (name: string) => void;
  onRenameSpace: (spaceId: string, name: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onCreateBoard: (spaceId: string, name: string) => void;
  onRenameBoard: (boardId: string, name: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onMoveBoard: (
    boardId: string,
    targetSpaceId: string,
    targetIndex?: number,
  ) => void;
}

const BOARD_DRAG_TYPE = "application/x-duogram-board";

export function Sidebar({
  project,
  directory,
  selectedBoardId,
  onSelectBoard,
  onOpenProject,
  onCreateSpace,
  onRenameSpace,
  onDeleteSpace,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onMoveBoard,
}: SidebarProps) {
  const [editor, setEditor] = useState<NameEditor | null>(null);
  const editorRef = useRef<NameEditor | null>(null);

  const openEditor = (next: NameEditor) => {
    editorRef.current = next;
    setEditor(next);
  };

  const commitEditor = (name: string) => {
    const current = editorRef.current;
    editorRef.current = null;
    setEditor(null);
    if (current === null) return;
    if (current.kind === "new-space") {
      onCreateSpace(name);
    } else if (current.kind === "space") {
      onRenameSpace(current.spaceId, name);
    } else if (current.kind === "new-board") {
      onCreateBoard(current.spaceId, name);
    } else {
      onRenameBoard(current.boardId, name);
    }
  };

  const cancelEditor = () => {
    editorRef.current = null;
    setEditor(null);
  };

  const boardDragOver = (event: DragEvent<HTMLElement>) => {
    if (event.dataTransfer.types.includes(BOARD_DRAG_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  };

  const dropBoard = (
    event: DragEvent<HTMLElement>,
    targetSpaceId: string,
    targetIndex?: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const boardId = event.dataTransfer.getData(BOARD_DRAG_TYPE);
    if (boardId.length > 0) onMoveBoard(boardId, targetSpaceId, targetIndex);
  };

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">DG</div>
        <div>
          <span className="eyebrow">Duogram</span>
          <h1>{project.name}</h1>
        </div>
      </div>
      <button
        type="button"
        className="project-path"
        title={directory}
        onClick={onOpenProject}
      >
        <span>Project</span>
        <strong>{directory.split(/[\\/]/).at(-1)}</strong>
      </button>
      <nav className="board-navigation" aria-label="Spaces and boards">
        <div className="navigation-heading">
          <span className="eyebrow">Spaces</span>
          <button
            type="button"
            className="add-button"
            title="Create space"
            aria-label="Create space"
            onClick={() => {
              openEditor({ kind: "new-space" });
            }}
          >
            +
          </button>
        </div>
        {project.spaces.map((space) => (
          <section
            key={space.id}
            className="space-section"
            onDragOver={boardDragOver}
            onDrop={(event) => {
              dropBoard(event, space.id);
            }}
          >
            <div className="space-heading">
              {editor?.kind === "space" && editor.spaceId === space.id ? (
                <InlineNameInput
                  value={space.name}
                  placeholder="Space name"
                  ariaLabel={`Rename ${space.name}`}
                  className="space-name-input"
                  onCommit={commitEditor}
                  onCancel={cancelEditor}
                />
              ) : (
                <button
                  type="button"
                  className="space-name"
                  onClick={() => {
                    openEditor({ kind: "space", spaceId: space.id });
                  }}
                >
                  {space.name}
                </button>
              )}
              <div className="space-heading-actions">
                <small>{space.boards.length}</small>
                <button
                  type="button"
                  className="add-button"
                  title={`Create board in ${space.name}`}
                  aria-label={`Create board in ${space.name}`}
                  onClick={() => {
                    openEditor({ kind: "new-board", spaceId: space.id });
                  }}
                >
                  +
                </button>
                <button
                  type="button"
                  className="space-delete-action"
                  title={`Delete ${space.name}`}
                  aria-label={`Delete ${space.name}`}
                  onClick={() => {
                    onDeleteSpace(space.id);
                  }}
                >
                  D
                </button>
              </div>
            </div>
            {space.boards.map((board, index) => (
              <div
                key={board.id}
                className="board-row"
                draggable={
                  !(editor?.kind === "board" && editor.boardId === board.id)
                }
                onDragStart={(event) => {
                  event.dataTransfer.setData(BOARD_DRAG_TYPE, board.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={boardDragOver}
                onDrop={(event) => {
                  dropBoard(event, space.id, index);
                }}
              >
                {editor?.kind === "board" && editor.boardId === board.id ? (
                  <div className="board-link board-link-editor">
                    <span className="board-dot" />
                    <InlineNameInput
                      value={board.name}
                      placeholder="Board name"
                      ariaLabel={`Rename ${board.name}`}
                      onCommit={commitEditor}
                      onCancel={cancelEditor}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className={
                      board.id === selectedBoardId
                        ? "board-link active"
                        : "board-link"
                    }
                    onClick={() => {
                      onSelectBoard(board.id);
                    }}
                  >
                    <span className="board-dot" />
                    <span>{board.name}</span>
                  </button>
                )}
                <div className="board-actions">
                  <button
                    type="button"
                    title={`Rename ${board.name}`}
                    aria-label={`Rename ${board.name}`}
                    onClick={() => {
                      openEditor({ kind: "board", boardId: board.id });
                    }}
                  >
                    R
                  </button>
                  <button
                    type="button"
                    className="delete-action"
                    title={`Delete ${board.name}`}
                    aria-label={`Delete ${board.name}`}
                    onClick={() => {
                      onDeleteBoard(board.id);
                    }}
                  >
                    D
                  </button>
                </div>
              </div>
            ))}
            {space.boards.length === 0 &&
              !(
                editor?.kind === "new-board" && editor.spaceId === space.id
              ) && (
                <button
                  type="button"
                  className="empty-space"
                  onClick={() => {
                    openEditor({ kind: "new-board", spaceId: space.id });
                  }}
                >
                  No boards, create one
                </button>
              )}
            {editor?.kind === "new-board" && editor.spaceId === space.id && (
              <div className="board-row pending-board-row">
                <div className="board-link board-link-editor">
                  <span className="board-dot" />
                  <InlineNameInput
                    value=""
                    placeholder="Board name"
                    ariaLabel={`New board in ${space.name}`}
                    onCommit={commitEditor}
                    onCancel={cancelEditor}
                  />
                </div>
              </div>
            )}
          </section>
        ))}
        {editor?.kind === "new-space" && (
          <section className="space-section pending-space-section">
            <div className="space-heading">
              <InlineNameInput
                value=""
                placeholder="Space name"
                ariaLabel="New space name"
                className="space-name-input"
                onCommit={commitEditor}
                onCancel={cancelEditor}
              />
            </div>
          </section>
        )}
      </nav>
      <div className="sidebar-footer">
        <span>Project revision</span>
        <code>{project.revision}</code>
      </div>
    </aside>
  );
}

type NameEditor =
  | { kind: "new-space" }
  | { kind: "space"; spaceId: string }
  | { kind: "new-board"; spaceId: string }
  | { kind: "board"; boardId: string };
