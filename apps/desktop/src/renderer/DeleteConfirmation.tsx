import { useEffect, useRef, useState } from "react";

export function DeleteConfirmation({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="delete-confirmation"
      aria-labelledby="delete-confirmation-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!submitting.current) onCancel();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
    >
      <h2 id="delete-confirmation-title">Delete {name}?</h2>
      <p>This action cannot be undone.</p>
      <div className="toolbar-actions">
        <button type="button" autoFocus disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (submitting.current) return;
            submitting.current = true;
            setBusy(true);
            void onConfirm().finally(onCancel);
          }}
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </dialog>
  );
}
