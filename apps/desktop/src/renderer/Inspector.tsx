import type { Element, ShapeElement, TextElement } from "@duogram/core";

interface InspectorProps {
  element: Element | null;
  onChange: (element: Element) => void;
  onDelete: () => void;
}

export function Inspector({ element, onChange, onDelete }: InspectorProps) {
  if (element === null) {
    return (
      <aside className="inspector empty-inspector">
        <span className="eyebrow">Inspector</span>
        <p>Select an element to edit its content, geometry, and style.</p>
      </aside>
    );
  }

  const change = <K extends keyof Element>(key: K, value: Element[K]) => {
    onChange({ ...element, [key]: value });
  };

  return (
    <aside className="inspector">
      <div className="inspector-heading">
        <div>
          <span className="eyebrow">Inspector</span>
          <h2>
            {element.type === "connector"
              ? element.connector_kind
              : element.type}
          </h2>
        </div>
        <span className="id-chip" title={element.id}>
          {element.id.slice(0, 8)}
        </span>
      </div>

      <label className="field">
        <span>Content</span>
        <textarea
          value={element.content}
          rows={3}
          onChange={(event) => {
            change("content", event.target.value);
          }}
        />
      </label>

      <label className="field color-field">
        <span>Color</span>
        <div>
          <input
            type="color"
            value={element.color}
            onChange={(event) => {
              change("color", event.target.value);
            }}
          />
          <code>{element.color}</code>
        </div>
      </label>

      {element.type === "shape" && (
        <label className="field">
          <span>Shape</span>
          <select
            value={element.shape_kind}
            onChange={(event) => {
              onChange({
                ...element,
                shape_kind: event.target.value as ShapeElement["shape_kind"],
              });
            }}
          >
            <option value="rectangle">Rectangle</option>
            <option value="ellipse">Ellipse</option>
            <option value="diamond">Diamond</option>
          </select>
        </label>
      )}

      {element.type !== "connector" && (
        <GeometryFields element={element} onChange={onChange} />
      )}

      {element.type !== "connector" && (
        <TextStyleFields element={element} onChange={onChange} />
      )}

      {element.type === "connector" && (
        <div className="connector-summary">
          <span>{element.points.length} points</span>
          <span>
            {element.source_attachment === undefined
              ? "Free source"
              : "Attached source"}
          </span>
          <span>
            {element.target_attachment === undefined
              ? "Free target"
              : "Attached target"}
          </span>
        </div>
      )}

      <button type="button" className="danger-button" onClick={onDelete}>
        Delete element
      </button>
    </aside>
  );
}

function GeometryFields({
  element,
  onChange,
}: {
  element: ShapeElement | TextElement;
  onChange: (element: Element) => void;
}) {
  const number = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return (
    <fieldset className="geometry-grid">
      <legend>Geometry</legend>
      <label>
        <span>X</span>
        <input
          type="number"
          value={Math.round(element.position.x)}
          onChange={(event) => {
            onChange({
              ...element,
              position: {
                ...element.position,
                x: number(event.target.value, element.position.x),
              },
            });
          }}
        />
      </label>
      <label>
        <span>Y</span>
        <input
          type="number"
          value={Math.round(element.position.y)}
          onChange={(event) => {
            onChange({
              ...element,
              position: {
                ...element.position,
                y: number(event.target.value, element.position.y),
              },
            });
          }}
        />
      </label>
      <label>
        <span>W</span>
        <input
          type="number"
          min="1"
          value={Math.round(element.size.width)}
          onChange={(event) => {
            onChange({
              ...element,
              size: {
                ...element.size,
                width: Math.max(
                  1,
                  number(event.target.value, element.size.width),
                ),
              },
            });
          }}
        />
      </label>
      <label>
        <span>H</span>
        <input
          type="number"
          min="1"
          value={Math.round(element.size.height)}
          onChange={(event) => {
            onChange({
              ...element,
              size: {
                ...element.size,
                height: Math.max(
                  1,
                  number(event.target.value, element.size.height),
                ),
              },
            });
          }}
        />
      </label>
    </fieldset>
  );
}

function TextStyleFields({
  element,
  onChange,
}: {
  element: ShapeElement | TextElement;
  onChange: (element: Element) => void;
}) {
  const style = element.text_style;
  return (
    <fieldset className="text-style-panel">
      <legend>Text</legend>
      <div className="segmented">
        {(["left", "center", "right"] as const).map((alignment) => (
          <button
            key={alignment}
            type="button"
            className={style.horizontal_alignment === alignment ? "active" : ""}
            onClick={() => {
              onChange({
                ...element,
                text_style: { ...style, horizontal_alignment: alignment },
              });
            }}
          >
            {alignment[0]?.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="segmented">
        <button
          type="button"
          className={style.bold ? "active" : ""}
          onClick={() => {
            onChange({
              ...element,
              text_style: { ...style, bold: !style.bold },
            });
          }}
        >
          B
        </button>
        <button
          type="button"
          className={style.italic ? "active" : ""}
          onClick={() => {
            onChange({
              ...element,
              text_style: { ...style, italic: !style.italic },
            });
          }}
        >
          I
        </button>
        <button
          type="button"
          className={style.underline ? "active" : ""}
          onClick={() => {
            onChange({
              ...element,
              text_style: { ...style, underline: !style.underline },
            });
          }}
        >
          U
        </button>
        <button
          type="button"
          className={style.strikethrough ? "active" : ""}
          onClick={() => {
            onChange({
              ...element,
              text_style: { ...style, strikethrough: !style.strikethrough },
            });
          }}
        >
          S
        </button>
      </div>
    </fieldset>
  );
}
