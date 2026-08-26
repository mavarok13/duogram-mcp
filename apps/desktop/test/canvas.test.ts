import { describe, expect, it } from "vitest";

import type { BoardV1 } from "@duogram/core";

import {
  setConnectorEndpoint,
  snapConnectorEndpoint,
} from "../src/renderer/Canvas.js";

const shapeId = "00000000-0000-4000-8000-000000000001";
const connectorId = "00000000-0000-4000-8000-000000000002";

function board(): BoardV1 {
  return {
    schema_version: 1,
    id: "00000000-0000-4000-8000-000000000003",
    revision: 0,
    elements: [
      {
        id: shapeId,
        type: "shape",
        shape_kind: "rectangle",
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        content: "Target",
        color: "#2563eb",
        border: null,
        text_style: {
          horizontal_alignment: "center",
          vertical_alignment: "center",
          bold: false,
          italic: false,
          underline: false,
          strikethrough: false,
        },
        agent_meta: {},
      },
      {
        id: connectorId,
        type: "connector",
        connector_kind: "arrow",
        points: [
          { x: 20, y: 20 },
          { x: 80, y: 80 },
        ],
        source_attachment: {
          element_id: shapeId,
          anchor: { x: 0, y: 0 },
        },
        content: "",
        color: "#f59e0b",
        agent_meta: {},
      },
    ],
  };
}

describe("canvas connector editing", () => {
  it("detaches a moved endpoint and stores its fallback point", () => {
    const result = setConnectorEndpoint(board(), connectorId, "source", {
      x: 40,
      y: 60,
    });
    const connector = result.elements[1];

    expect(connector?.type).toBe("connector");
    if (connector?.type !== "connector") throw new Error("invalid result");
    expect(connector.source_attachment).toBeUndefined();
    expect(connector.points[0]).toEqual({ x: 40, y: 60 });
  });

  it("snaps an endpoint to a nearby attachable element", () => {
    const moved = setConnectorEndpoint(board(), connectorId, "target", {
      x: 200,
      y: 150,
    });
    const result = snapConnectorEndpoint(moved, connectorId, "target");
    const connector = result.elements[1];

    expect(connector?.type).toBe("connector");
    if (connector?.type !== "connector") throw new Error("invalid result");
    expect(connector.target_attachment).toEqual({
      element_id: shapeId,
      anchor: { x: 0.5, y: 0.5 },
    });
  });
});
