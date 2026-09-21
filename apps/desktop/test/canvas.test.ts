import { describe, expect, it } from "vitest";

import type { BoardV1 } from "@duogram/core";

import {
  moveElements,
  resizeElement,
  setConnectorEndpoint,
  snapConnectorEndpoint,
  zoomViewBoxCentered,
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
          font_family: "Roboto",
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

describe("canvas group movement", () => {
  it("moves every selected element by the same board delta", () => {
    const value = board();
    const result = moveElements(value, [shapeId, connectorId], 30, -10);
    const shape = result.elements[0];
    const connector = result.elements[1];

    expect(shape?.type).toBe("shape");
    if (shape?.type !== "shape") throw new Error("invalid shape");
    expect(shape.position).toEqual({ x: 130, y: 90 });
    expect(connector?.type).toBe("connector");
    if (connector?.type !== "connector") throw new Error("invalid connector");
    expect(connector.points).toEqual([
      { x: 50, y: 10 },
      { x: 110, y: 70 },
    ]);
  });
});

describe("canvas element resizing", () => {
  it("changes width and height from the dragged corner", () => {
    const result = resizeElement(board(), shapeId, "se", 35, 20);
    const shape = result.elements[0];

    expect(shape?.type).toBe("shape");
    if (shape?.type !== "shape") throw new Error("invalid shape");
    expect(shape.position).toEqual({ x: 100, y: 100 });
    expect(shape.size).toEqual({ width: 235, height: 120 });
  });

  it("keeps the opposite edge fixed and enforces a minimum size", () => {
    const result = resizeElement(board(), shapeId, "nw", 500, 500);
    const shape = result.elements[0];

    expect(shape?.type).toBe("shape");
    if (shape?.type !== "shape") throw new Error("invalid shape");
    expect(shape.position).toEqual({ x: 276, y: 176 });
    expect(shape.size).toEqual({ width: 24, height: 24 });
  });
});

describe("canvas zoom", () => {
  it("keeps the current field center as the zoom anchor", () => {
    const result = zoomViewBoxCentered({ x: 120, y: 80 }, 1, 0.5);
    const oldCenter = { x: 120 + 600, y: 80 + 380 };
    const newCenter = {
      x: result.pan.x + 1200 / result.zoom / 2,
      y: result.pan.y + 760 / result.zoom / 2,
    };

    expect(newCenter).toEqual(oldCenter);
  });

  it("uses the responsive viewport dimensions for the zoom anchor", () => {
    const result = zoomViewBoxCentered({ x: 100, y: 80 }, 1, 0.5, {
      width: 900,
      height: 760,
    });
    const oldCenter = { x: 100 + 450, y: 80 + 380 };
    const newCenter = {
      x: result.pan.x + 900 / result.zoom / 2,
      y: result.pan.y + 760 / result.zoom / 2,
    };

    expect(newCenter).toEqual(oldCenter);
  });
});
