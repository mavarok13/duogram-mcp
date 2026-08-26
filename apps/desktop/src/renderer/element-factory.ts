import type {
  ConnectorElement,
  Element,
  ShapeElement,
  TextElement,
  TextStyle,
} from "@duogram/core";

const textStyle: TextStyle = {
  horizontal_alignment: "center",
  vertical_alignment: "center",
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
};

export type NewElementKind = "shape" | "text" | "line" | "arrow";

export function createElement(kind: NewElementKind, index: number): Element {
  const offset = (index % 8) * 28;
  if (kind === "shape") {
    const element: ShapeElement = {
      id: crypto.randomUUID(),
      type: "shape",
      shape_kind: "rectangle",
      position: { x: 120 + offset, y: 100 + offset },
      size: { width: 220, height: 100 },
      content: "New shape",
      color: "#2563eb",
      border: { style: "solid", thickness: 2, color: "#93c5fd" },
      text_style: { ...textStyle },
      agent_meta: {},
    };
    return element;
  }
  if (kind === "text") {
    const element: TextElement = {
      id: crypto.randomUUID(),
      type: "text",
      position: { x: 140 + offset, y: 140 + offset },
      size: { width: 240, height: 70 },
      content: "Standalone text",
      color: "#e5e7eb",
      text_style: { ...textStyle, horizontal_alignment: "left" },
      agent_meta: {},
    };
    return element;
  }
  const element: ConnectorElement = {
    id: crypto.randomUUID(),
    type: "connector",
    connector_kind: kind,
    points: [
      { x: 140 + offset, y: 180 + offset },
      { x: 390 + offset, y: 180 + offset },
    ],
    content: "",
    color: "#f59e0b",
    agent_meta: {},
  };
  return element;
}
