import type { DragEvent } from "react";

import type { ProjectV1 } from "@duogram/core";

interface SidebarProps {
  project: ProjectV1;
  directory: string;
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onOpenProject: () => void;
  onCreateSpace: () => void;
  onCreateBoard: (spaceId: string) => void;
  onRenameBoard: (boardId: string) => void;
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
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  onMoveBoard,
}: SidebarProps) {
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
            onClick={onCreateSpace}
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
              <span>{space.name}</span>
              <div className="space-heading-actions">
                <small>{space.boards.length}</small>
                <button
                  type="button"
                  className="add-button"
                  title={`Create board in ${space.name}`}
                  aria-label={`Create board in ${space.name}`}
                  onClick={() => {
                    onCreateBoard(space.id);
                  }}
                >
                  +
                </button>
              </div>
            </div>
            {space.boards.map((board, index) => (
              <div
                key={board.id}
                className="board-row"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(BOARD_DRAG_TYPE, board.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={boardDragOver}
                onDrop={(event) => {
                  dropBoard(event, space.id, index);
                }}
              >
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
                <div className="board-actions">
                  <button
                    type="button"
                    title={`Rename ${board.name}`}
                    aria-label={`Rename ${board.name}`}
                    onClick={() => {
                      onRenameBoard(board.id);
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
            {space.boards.length === 0 && (
              <button
                type="button"
                className="empty-space"
                onClick={() => {
                  onCreateBoard(space.id);
                }}
              >
                No boards, create one
              </button>
            )}
          </section>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>Project revision</span>
        <code>{project.revision}</code>
      </div>
    </aside>
  );
}
