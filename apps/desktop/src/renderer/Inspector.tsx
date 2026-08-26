import type {
  Element,
  FontFamily,
  ShapeElement,
  TextElement,
} from "@duogram/core";

const fontOptions: readonly { value: FontFamily; license: string }[] = [
  { value: "Roboto", license: "SIL OFL 1.1" },
  { value: "Montserrat", license: "SIL OFL 1.1" },
  { value: "Open Sans", license: "SIL OFL 1.1" },
  { value: "Source Sans 3", license: "SIL OFL 1.1" },
  { value: "System UI", license: "OS provided" },
];

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
        <>
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
          <BorderFields element={element} onChange={onChange} />
        </>
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
      <label className="font-field">
        <span>Font family</span>
        <select
          value={style.font_family}
          onChange={(event) => {
            onChange({
              ...element,
              text_style: {
                ...style,
                font_family: event.target.value as FontFamily,
              },
            });
          }}
        >
          {fontOptions.map((font) => (
            <option key={font.value} value={font.value}>
              {font.value} ({font.license})
            </option>
          ))}
        </select>
      </label>
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

function BorderFields({
  element,
  onChange,
}: {
  element: ShapeElement;
  onChange: (element: Element) => void;
}) {
  const border = element.border;
  return (
    <fieldset className="border-panel">
      <legend>Border</legend>
      <label className="border-toggle">
        <input
          type="checkbox"
          checked={border !== null}
          onChange={(event) => {
            onChange({
              ...element,
              border: event.target.checked
                ? (border ?? { style: "solid", thickness: 2, color: "#93c5fd" })
                : null,
            });
          }}
        />
        <span>{border === null ? "No border" : "Show border"}</span>
      </label>
      {border !== null && (
        <div className="border-controls">
          <label>
            <span>Style</span>
            <select
              value={border.style}
              onChange={(event) => {
                onChange({
                  ...element,
                  border: {
                    ...border,
                    style: event.target.value as NonNullable<
                      ShapeElement["border"]
                    >["style"],
                  },
                });
              }}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </label>
          <label>
            <span>Thickness</span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={border.thickness}
              onChange={(event) => {
                const thickness = Number(event.target.value);
                onChange({
                  ...element,
                  border: {
                    ...border,
                    thickness: Number.isFinite(thickness)
                      ? Math.max(0.5, thickness)
                      : border.thickness,
                  },
                });
              }}
            />
          </label>
          <label className="border-color">
            <span>Color</span>
            <input
              type="color"
              value={border.color}
              onChange={(event) => {
                onChange({
                  ...element,
                  border: { ...border, color: event.target.value },
                });
              }}
            />
            <code>{border.color}</code>
          </label>
        </div>
      )}
    </fieldset>
  );
}
