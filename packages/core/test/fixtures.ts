import type {
  BoardV1,
  ConnectorElement,
  ProjectV1,
  ShapeElement,
  TextStyle,
} from "../src/index.js";

export const IDs = {
  project: "00000000-0000-4000-8000-000000000001",
  space: "00000000-0000-4000-8000-000000000002",
  board: "00000000-0000-4000-8000-000000000003",
  shape: "00000000-0000-4000-8000-000000000004",
  connector: "00000000-0000-4000-8000-000000000005",
  other: "00000000-0000-4000-8000-000000000006",
} as const;

const textStyle: TextStyle = {
  horizontal_alignment: "center",
  vertical_alignment: "center",
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
};

export function shape(): ShapeElement {
  return {
    id: IDs.shape,
    type: "shape",
    shape_kind: "rectangle",
    position: { x: 10, y: 20 },
    size: { width: 100, height: 40 },
    content: "Service",
    color: "#3b82f6",
    border: null,
    text_style: textStyle,
    agent_meta: {
      nested: { score: 3, flags: [true, null, "kept"] },
    },
  };
}

export function connector(): ConnectorElement {
  return {
    id: IDs.connector,
    type: "connector",
    connector_kind: "arrow",
    points: [
      { x: 0, y: 0 },
      { x: 200, y: 40 },
    ],
    source_attachment: {
      element_id: IDs.shape,
      anchor: { x: 1, y: 0.5 },
    },
    content: "calls",
    color: "#64748b",
    agent_meta: {},
  };
}

export function board(): BoardV1 {
  return {
    schema_version: 1,
    id: IDs.board,
    revision: 0,
    elements: [shape(), connector()],
  };
}

export function project(): ProjectV1 {
  return {
    schema_version: 1,
    id: IDs.project,
    name: "Test project",
    revision: 0,
    spaces: [
      {
        id: IDs.space,
        name: "Architecture",
        boards: [{ id: IDs.board, name: "Backend" }],
      },
    ],
  };
}
