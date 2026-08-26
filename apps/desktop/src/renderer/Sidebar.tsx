import type { ProjectV1 } from "@duogram/core";

interface SidebarProps {
  project: ProjectV1;
  directory: string;
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onOpenProject: () => void;
}

export function Sidebar({
  project,
  directory,
  selectedBoardId,
  onSelectBoard,
  onOpenProject,
}: SidebarProps) {
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
        {project.spaces.map((space) => (
          <section key={space.id} className="space-section">
            <div className="space-heading">
              <span>{space.name}</span>
              <small>{space.boards.length}</small>
            </div>
            {space.boards.map((board) => (
              <button
                key={board.id}
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
            ))}
            {space.boards.length === 0 && (
              <p className="empty-space">No boards</p>
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
