import { useEffect, useRef, useState } from "react";

interface InlineNameInputProps {
  value: string;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

export function InlineNameInput({
  value,
  placeholder,
  ariaLabel,
  className,
  onCommit,
  onCancel,
}: InlineNameInputProps) {
  const [draft, setDraft] = useState(value);
  const inputClassName =
    className === undefined
      ? "inline-name-input"
      : `inline-name-input ${className}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(value);
  const finishedRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    draftRef.current = value;
    setDraft(value);
    finishedRef.current = false;
  }, [value]);

  useEffect(() => {
    onCommitRef.current = onCommit;
    onCancelRef.current = onCancel;
  }, [onCancel, onCommit]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const nextName = draftRef.current.trim();
    if (nextName.length === 0) {
      onCancelRef.current();
      return;
    }
    onCommitRef.current(nextName);
  };

  useEffect(() => {
    const commitWhenClickingOutside = (event: PointerEvent) => {
      const input = inputRef.current;
      if (!input?.isConnected) return;
      const target = event.target;
      if (target instanceof Node && input.contains(target)) return;
      finish();
    };
    document.addEventListener("pointerdown", commitWhenClickingOutside);
    return () => {
      document.removeEventListener("pointerdown", commitWhenClickingOutside);
    };
  }, []);

  return (
    <input
      ref={inputRef}
      className={inputClassName}
      type="text"
      autoFocus
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => {
        draftRef.current = event.target.value;
        setDraft(event.target.value);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onBlur={finish}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finish();
        } else if (event.key === "Escape") {
          event.preventDefault();
          finishedRef.current = true;
          onCancelRef.current();
        }
      }}
    />
  );
}
