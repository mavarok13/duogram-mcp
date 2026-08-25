export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextStyle {
  horizontal_alignment: "left" | "center" | "right";
  vertical_alignment: "top" | "center" | "bottom";
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

export interface Border {
  style: "solid" | "dashed" | "dotted";
  thickness: number;
  color: string;
}

interface ElementBase {
  id: string;
  content: string;
  color: string;
  agent_meta: Record<string, JsonValue>;
}

export interface ShapeElement extends ElementBase {
  type: "shape";
  shape_kind: "rectangle" | "ellipse" | "diamond";
  position: Point;
  size: Size;
  border: Border | null;
  text_style: TextStyle;
}

export interface TextElement extends ElementBase {
  type: "text";
  position: Point;
  size: Size;
  text_style: TextStyle;
}

export interface Attachment {
  element_id: string;
  anchor: Point;
}

export interface ConnectorElement extends ElementBase {
  type: "connector";
  connector_kind: "line" | "arrow";
  points: Point[];
  source_attachment?: Attachment;
  target_attachment?: Attachment;
}

export type Element = ShapeElement | TextElement | ConnectorElement;

export interface BoardV1 {
  schema_version: 1;
  id: string;
  revision: number;
  elements: Element[];
}

export interface BoardSummary {
  id: string;
  name: string;
}

export interface Space {
  id: string;
  name: string;
  boards: BoardSummary[];
}

export interface ProjectV1 {
  schema_version: 1;
  id: string;
  name: string;
  revision: number;
  spaces: Space[];
}

export type BoardOperation =
  | { type: "add"; element: Element }
  | { type: "update"; element: Element }
  | { type: "delete"; element_id: string };
