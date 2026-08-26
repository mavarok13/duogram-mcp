import { useEffect, useRef, useState, type PointerEvent } from "react";

import type {
  BoardV1,
  ConnectorElement,
  Element,
  Point,
  ShapeElement,
  TextElement,
} from "@duogram/core";

interface CanvasProps {
  board: BoardV1;
  selectedIds: readonly string[];
  onSelect: (ids: string[]) => void;
  onCommit: (board: BoardV1) => void;
}

interface DragState {
  elementIds: string[];
  start: Point;
  startClient: Point;
  board: BoardV1;
  mode: "move" | "resize" | "source" | "target";
  resizeHandle?: ResizeHandle;
  startPan: Point;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export function Canvas({
  board,
  selectedIds,
  onSelect,
  onCommit,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [preview, setPreview] = useState<BoardV1 | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    setPreview(null);
  }, [board]);
  const displayed = preview ?? board;

  const startDrag = (event: PointerEvent, elementId: string) => {
    event.stopPropagation();
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    if (additive) {
      onSelect(
        selectedIds.includes(elementId)
          ? selectedIds.filter((id) => id !== elementId)
          : [...selectedIds, elementId],
      );
      return;
    }
    const elementIds = selectedIds.includes(elementId)
      ? [...selectedIds]
      : [elementId];
    onSelect(elementIds);
    dragRef.current = {
      elementIds,
      start: clientPoint(event.clientX, event.clientY, svgRef.current),
      startClient: { x: event.clientX, y: event.clientY },
      board,
      mode: "move",
      startPan: pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startEndpointDrag = (
    event: PointerEvent,
    elementId: string,
    mode: "source" | "target",
  ) => {
    event.stopPropagation();
    onSelect([elementId]);
    dragRef.current = {
      elementIds: [elementId],
      start: clientPoint(event.clientX, event.clientY, svgRef.current),
      startClient: { x: event.clientX, y: event.clientY },
      board,
      mode,
      startPan: pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startResizeDrag = (
    event: PointerEvent,
    elementId: string,
    handle: ResizeHandle,
  ) => {
    event.stopPropagation();
    onSelect([elementId]);
    dragRef.current = {
      elementIds: [elementId],
      start: clientPoint(event.clientX, event.clientY, svgRef.current),
      startClient: { x: event.clientX, y: event.clientY },
      board,
      mode: "resize",
      resizeHandle: handle,
      startPan: pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const startPan = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    onSelect([]);
    dragRef.current = {
      elementIds: [],
      start: clientPoint(event.clientX, event.clientY, svgRef.current),
      startClient: { x: event.clientX, y: event.clientY },
      board,
      mode: "move",
      startPan: pan,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (drag === null) return;
    if (drag.elementIds.length === 0) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect === undefined) return;
      const viewWidth = 1200 / zoom;
      const viewHeight = 760 / zoom;
      setPan({
        x:
          drag.startPan.x -
          ((event.clientX - drag.startClient.x) / rect.width) * viewWidth,
        y:
          drag.startPan.y -
          ((event.clientY - drag.startClient.y) / rect.height) * viewHeight,
      });
      return;
    }
    const current = clientPoint(event.clientX, event.clientY, svgRef.current);
    const dx = current.x - drag.start.x;
    const dy = current.y - drag.start.y;
    if (drag.mode === "move") {
      setPreview(moveElements(drag.board, drag.elementIds, dx, dy));
    } else if (drag.mode === "resize" && drag.resizeHandle !== undefined) {
      setPreview(
        resizeElement(
          drag.board,
          drag.elementIds[0] ?? "",
          drag.resizeHandle,
          dx,
          dy,
        ),
      );
    } else if (drag.mode === "source" || drag.mode === "target") {
      setPreview(
        setConnectorEndpoint(
          drag.board,
          drag.elementIds[0] ?? "",
          drag.mode,
          current,
        ),
      );
    }
  };

  const finishDrag = () => {
    const drag = dragRef.current;
    if (drag !== null && preview !== null) {
      onCommit(
        drag.mode === "move" || drag.mode === "resize"
          ? preview
          : snapConnectorEndpoint(preview, drag.elementIds[0] ?? "", drag.mode),
      );
    }
    dragRef.current = null;
    setPreview(null);
  };

  return (
    <section className="canvas-panel" aria-label="Board canvas">
      <div className="zoom-controls">
        <button
          type="button"
          onClick={() => {
            setZoomCentered(-0.1, zoom, setZoom, setPan);
          }}
        >
          -
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          onClick={() => {
            setZoomCentered(0.1, zoom, setZoom, setPan);
          }}
        >
          +
        </button>
      </div>
      <svg
        ref={svgRef}
        className="board-canvas"
        viewBox={`${String(pan.x)} ${String(pan.y)} ${String(1200 / zoom)} ${String(760 / zoom)}`}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerDown={startPan}
        onWheel={(event) => {
          event.preventDefault();
          setZoomCentered(event.deltaY < 0 ? 0.1 : -0.1, zoom, setZoom, setPan);
        }}
      >
        <defs>
          <pattern
            id="small-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path d="M 20 0 L 0 0 0 20" className="grid-minor" />
          </pattern>
          <pattern
            id="grid"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <rect width="100" height="100" fill="url(#small-grid)" />
            <path d="M 100 0 L 0 0 0 100" className="grid-major" />
          </pattern>
          <marker
            id="arrow-head"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#grid)"
          pointerEvents="none"
        />
        {displayed.elements.map((element) => (
          <ElementView
            key={element.id}
            element={element}
            board={displayed}
            selected={selectedIds.includes(element.id)}
            onPointerDown={(event) => {
              startDrag(event, element.id);
            }}
            onEndpointPointerDown={(event, mode) => {
              startEndpointDrag(event, element.id, mode);
            }}
            onResizePointerDown={(event, handle) => {
              startResizeDrag(event, element.id, handle);
            }}
          />
        ))}
      </svg>
    </section>
  );
}

function ElementView({
  element,
  board,
  selected,
  onPointerDown,
  onEndpointPointerDown,
  onResizePointerDown,
}: {
  element: Element;
  board: BoardV1;
  selected: boolean;
  onPointerDown: (event: PointerEvent) => void;
  onEndpointPointerDown: (
    event: PointerEvent,
    mode: "source" | "target",
  ) => void;
  onResizePointerDown: (event: PointerEvent, handle: ResizeHandle) => void;
}) {
  if (element.type === "connector") {
    const points = connectorPoints(element, board);
    const encoded = points
      .map((point) => `${String(point.x)},${String(point.y)}`)
      .join(" ");
    const label = midpoint(points);
    return (
      <g
        className={selected ? "canvas-element selected" : "canvas-element"}
        onPointerDown={onPointerDown}
      >
        <polyline className="connector-hit" points={encoded} />
        <polyline
          className="connector-line"
          points={encoded}
          stroke={element.color}
          markerEnd={
            element.connector_kind === "arrow" ? "url(#arrow-head)" : undefined
          }
        />
        {element.content.length > 0 && (
          <text
            x={label.x}
            y={label.y - 9}
            className="connector-label"
            textAnchor="middle"
          >
            {element.content}
          </text>
        )}
        {selected && (
          <>
            <circle
              className="endpoint-handle"
              cx={points[0]?.x}
              cy={points[0]?.y}
              r="7"
              onPointerDown={(event) => {
                onEndpointPointerDown(event, "source");
              }}
            />
            <circle
              className="endpoint-handle"
              cx={points.at(-1)?.x}
              cy={points.at(-1)?.y}
              r="7"
              onPointerDown={(event) => {
                onEndpointPointerDown(event, "target");
              }}
            />
          </>
        )}
      </g>
    );
  }
  return (
    <g
      className={selected ? "canvas-element selected" : "canvas-element"}
      onPointerDown={onPointerDown}
    >
      {element.type === "shape" && <ShapeView element={element} />}
      {element.type === "text" && <TextView element={element} />}
      {selected && (
        <rect
          className="selection-box"
          x={element.position.x - 5}
          y={element.position.y - 5}
          width={element.size.width + 10}
          height={element.size.height + 10}
          rx="5"
        />
      )}
      {selected && (
        <ResizeHandles element={element} onPointerDown={onResizePointerDown} />
      )}
    </g>
  );
}

function ResizeHandles({
  element,
  onPointerDown,
}: {
  element: ShapeElement | TextElement;
  onPointerDown: (event: PointerEvent, handle: ResizeHandle) => void;
}) {
  const left = element.position.x;
  const top = element.position.y;
  const right = left + element.size.width;
  const bottom = top + element.size.height;
  const centerX = left + element.size.width / 2;
  const centerY = top + element.size.height / 2;
  const handles: readonly { name: ResizeHandle; x: number; y: number }[] = [
    { name: "nw", x: left, y: top },
    { name: "n", x: centerX, y: top },
    { name: "ne", x: right, y: top },
    { name: "e", x: right, y: centerY },
    { name: "se", x: right, y: bottom },
    { name: "s", x: centerX, y: bottom },
    { name: "sw", x: left, y: bottom },
    { name: "w", x: left, y: centerY },
  ];
  return (
    <g className="resize-handles">
      {handles.map((handle) => (
        <rect
          key={handle.name}
          className={`resize-handle resize-${handle.name}`}
          x={handle.x - 4}
          y={handle.y - 4}
          width="8"
          height="8"
          onPointerDown={(event) => {
            onPointerDown(event, handle.name);
          }}
        />
      ))}
    </g>
  );
}

function ShapeView({ element }: { element: ShapeElement }) {
  const border = element.border;
  const common = {
    fill: element.color,
    stroke: border?.color ?? "transparent",
    strokeWidth: border?.thickness ?? 0,
    strokeDasharray:
      border?.style === "dashed"
        ? "10 7"
        : border?.style === "dotted"
          ? "2 7"
          : undefined,
  };
  return (
    <>
      {element.shape_kind === "rectangle" && (
        <rect
          {...common}
          x={element.position.x}
          y={element.position.y}
          width={element.size.width}
          height={element.size.height}
          rx="10"
        />
      )}
      {element.shape_kind === "ellipse" && (
        <ellipse
          {...common}
          cx={element.position.x + element.size.width / 2}
          cy={element.position.y + element.size.height / 2}
          rx={element.size.width / 2}
          ry={element.size.height / 2}
        />
      )}
      {element.shape_kind === "diamond" && (
        <polygon
          {...common}
          points={`${String(element.position.x + element.size.width / 2)},${String(element.position.y)} ${String(element.position.x + element.size.width)},${String(element.position.y + element.size.height / 2)} ${String(element.position.x + element.size.width / 2)},${String(element.position.y + element.size.height)} ${String(element.position.x)},${String(element.position.y + element.size.height / 2)}`}
        />
      )}
      <StyledText element={element} contrast />
    </>
  );
}

function TextView({ element }: { element: TextElement }) {
  return <StyledText element={element} contrast={false} />;
}

function StyledText({
  element,
  contrast,
}: {
  element: ShapeElement | TextElement;
  contrast: boolean;
}) {
  const style = element.text_style;
  return (
    <foreignObject
      x={element.position.x}
      y={element.position.y}
      width={element.size.width}
      height={element.size.height}
      className="element-text-block"
    >
      <div
        className="element-text"
        style={{
          alignItems:
            style.vertical_alignment === "top"
              ? "flex-start"
              : style.vertical_alignment === "bottom"
                ? "flex-end"
                : "center",
          color: contrast ? readableColor(element.color) : element.color,
          fontFamily:
            style.font_family === "System UI" ? "system-ui" : style.font_family,
          fontStyle: style.italic ? "italic" : "normal",
          fontWeight: style.bold ? 700 : 500,
          justifyContent:
            style.horizontal_alignment === "left"
              ? "flex-start"
              : style.horizontal_alignment === "right"
                ? "flex-end"
                : "center",
          textAlign: style.horizontal_alignment,
          textDecoration:
            `${style.underline ? "underline " : ""}${style.strikethrough ? "line-through" : ""}`.trim(),
        }}
      >
        {element.content || " "}
      </div>
    </foreignObject>
  );
}

export function moveElements(
  board: BoardV1,
  elementIds: readonly string[],
  dx: number,
  dy: number,
): BoardV1 {
  return {
    ...board,
    elements: board.elements.map((element) => {
      if (!elementIds.includes(element.id)) return element;
      if (element.type === "connector") {
        return {
          ...element,
          points: element.points.map((point) => ({
            x: point.x + dx,
            y: point.y + dy,
          })),
        };
      }
      return {
        ...element,
        position: { x: element.position.x + dx, y: element.position.y + dy },
      };
    }),
  };
}

const MIN_ELEMENT_SIZE = 24;

export function resizeElement(
  board: BoardV1,
  elementId: string,
  handle: ResizeHandle,
  dx: number,
  dy: number,
): BoardV1 {
  const target = board.elements.find(
    (element): element is ShapeElement | TextElement =>
      element.id === elementId && element.type !== "connector",
  );
  if (target === undefined) return board;

  const right = target.position.x + target.size.width;
  const bottom = target.position.y + target.size.height;
  const nextLeft = handle.endsWith("w")
    ? Math.min(right - MIN_ELEMENT_SIZE, target.position.x + dx)
    : target.position.x;
  const nextRight = handle.endsWith("e")
    ? Math.max(target.position.x + MIN_ELEMENT_SIZE, right + dx)
    : right;
  const nextTop = handle.startsWith("n")
    ? Math.min(bottom - MIN_ELEMENT_SIZE, target.position.y + dy)
    : target.position.y;
  const nextBottom = handle.startsWith("s")
    ? Math.max(target.position.y + MIN_ELEMENT_SIZE, bottom + dy)
    : bottom;

  return {
    ...board,
    elements: board.elements.map((element) =>
      element.id === elementId && element.type !== "connector"
        ? {
            ...element,
            position: { x: nextLeft, y: nextTop },
            size: {
              width: nextRight - nextLeft,
              height: nextBottom - nextTop,
            },
          }
        : element,
    ),
  };
}

function setZoomCentered(
  delta: number,
  currentZoom: number,
  setZoom: (value: number) => void,
  setPan: (value: Point | ((current: Point) => Point)) => void,
): void {
  const next = zoomViewBoxCentered({ x: 0, y: 0 }, currentZoom, delta);
  if (next.zoom === currentZoom) return;
  setPan((current) => zoomViewBoxCentered(current, currentZoom, delta).pan);
  setZoom(next.zoom);
}

export function zoomViewBoxCentered(
  pan: Point,
  currentZoom: number,
  delta: number,
): { pan: Point; zoom: number } {
  const zoom = Math.max(0.5, Math.min(2, currentZoom + delta));
  if (zoom === currentZoom) return { pan, zoom };
  const oldWidth = 1200 / currentZoom;
  const oldHeight = 760 / currentZoom;
  const newWidth = 1200 / zoom;
  const newHeight = 760 / zoom;
  return {
    zoom,
    pan: {
      x: pan.x + (oldWidth - newWidth) / 2,
      y: pan.y + (oldHeight - newHeight) / 2,
    },
  };
}

export function setConnectorEndpoint(
  board: BoardV1,
  elementId: string,
  mode: "source" | "target",
  point: Point,
): BoardV1 {
  return {
    ...board,
    elements: board.elements.map((element) => {
      if (element.id !== elementId || element.type !== "connector")
        return element;
      const points = element.points.map((item) => ({ ...item }));
      if (mode === "source") points[0] = point;
      else points[points.length - 1] = point;
      const next: ConnectorElement = { ...element, points };
      if (mode === "source") delete next.source_attachment;
      else delete next.target_attachment;
      return next;
    }),
  };
}

export function snapConnectorEndpoint(
  board: BoardV1,
  elementId: string,
  mode: "source" | "target",
): BoardV1 {
  const connector = board.elements.find(
    (element): element is ConnectorElement =>
      element.id === elementId && element.type === "connector",
  );
  if (connector === undefined) return board;
  const point =
    mode === "source" ? connector.points[0] : connector.points.at(-1);
  if (point === undefined) return board;
  const target = [...board.elements].reverse().find((element) => {
    if (element.type === "connector") return false;
    return (
      point.x >= element.position.x - 18 &&
      point.x <= element.position.x + element.size.width + 18 &&
      point.y >= element.position.y - 18 &&
      point.y <= element.position.y + element.size.height + 18
    );
  });
  if (target === undefined || target.type === "connector") return board;
  const attachment = {
    element_id: target.id,
    anchor: {
      x: clamp((point.x - target.position.x) / target.size.width),
      y: clamp((point.y - target.position.y) / target.size.height),
    },
  };
  return {
    ...board,
    elements: board.elements.map((element) => {
      if (element.id !== elementId || element.type !== "connector")
        return element;
      return mode === "source"
        ? { ...element, source_attachment: attachment }
        : { ...element, target_attachment: attachment };
    }),
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function connectorPoints(connector: ConnectorElement, board: BoardV1): Point[] {
  const points = connector.points.map((point) => ({ ...point }));
  const source = attachmentPoint(
    connector.source_attachment?.element_id,
    connector.source_attachment?.anchor,
    board,
  );
  const target = attachmentPoint(
    connector.target_attachment?.element_id,
    connector.target_attachment?.anchor,
    board,
  );
  if (source !== null) points[0] = source;
  if (target !== null) points[points.length - 1] = target;
  return points;
}

function attachmentPoint(
  elementId: string | undefined,
  anchor: Point | undefined,
  board: BoardV1,
): Point | null {
  if (elementId === undefined || anchor === undefined) return null;
  const target = board.elements.find((element) => element.id === elementId);
  if (target === undefined || target.type === "connector") return null;
  return {
    x: target.position.x + target.size.width * anchor.x,
    y: target.position.y + target.size.height * anchor.y,
  };
}

function midpoint(points: Point[]): Point {
  const first = points[0] ?? { x: 0, y: 0 };
  const last = points.at(-1) ?? first;
  return { x: (first.x + last.x) / 2, y: (first.y + last.y) / 2 };
}

function clientPoint(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement | null,
): Point {
  if (svg === null) return { x: clientX, y: clientY };
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();
  if (matrix === null) return { x: clientX, y: clientY };
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
}

function readableColor(hex: string): string {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 150
    ? "#111827"
    : "#f8fafc";
}
