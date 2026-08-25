const uuidV4Pattern =
  "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
const colorPattern = "^#[0-9a-fA-F]{6}$";

const id = { type: "string", pattern: uuidV4Pattern } as const;
const point = {
  type: "object",
  additionalProperties: false,
  required: ["x", "y"],
  properties: { x: { type: "number" }, y: { type: "number" } },
} as const;
const size = {
  type: "object",
  additionalProperties: false,
  required: ["width", "height"],
  properties: {
    width: { type: "number", exclusiveMinimum: 0 },
    height: { type: "number", exclusiveMinimum: 0 },
  },
} as const;
const textStyle = {
  type: "object",
  additionalProperties: false,
  required: [
    "horizontal_alignment",
    "vertical_alignment",
    "bold",
    "italic",
    "underline",
    "strikethrough",
  ],
  properties: {
    horizontal_alignment: { enum: ["left", "center", "right"] },
    vertical_alignment: { enum: ["top", "center", "bottom"] },
    bold: { type: "boolean" },
    italic: { type: "boolean" },
    underline: { type: "boolean" },
    strikethrough: { type: "boolean" },
  },
} as const;
const agentMeta = { type: "object", additionalProperties: true } as const;
const commonProperties = {
  id,
  content: { type: "string" },
  color: { type: "string", pattern: colorPattern },
  agent_meta: agentMeta,
} as const;
const commonRequired = [
  "id",
  "type",
  "content",
  "color",
  "agent_meta",
] as const;

const shape = {
  type: "object",
  additionalProperties: false,
  required: [
    ...commonRequired,
    "shape_kind",
    "position",
    "size",
    "border",
    "text_style",
  ],
  properties: {
    ...commonProperties,
    type: { const: "shape" },
    shape_kind: { enum: ["rectangle", "ellipse", "diamond"] },
    position: point,
    size,
    border: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: ["style", "thickness", "color"],
          properties: {
            style: { enum: ["solid", "dashed", "dotted"] },
            thickness: { type: "number", exclusiveMinimum: 0 },
            color: { type: "string", pattern: colorPattern },
          },
        },
      ],
    },
    text_style: textStyle,
  },
} as const;

const text = {
  type: "object",
  additionalProperties: false,
  required: [...commonRequired, "position", "size", "text_style"],
  properties: {
    ...commonProperties,
    type: { const: "text" },
    position: point,
    size,
    text_style: textStyle,
  },
} as const;

const attachment = {
  type: "object",
  additionalProperties: false,
  required: ["element_id", "anchor"],
  properties: {
    element_id: id,
    anchor: {
      ...point,
      properties: {
        x: { type: "number", minimum: 0, maximum: 1 },
        y: { type: "number", minimum: 0, maximum: 1 },
      },
    },
  },
} as const;

const connector = {
  type: "object",
  additionalProperties: false,
  required: [...commonRequired, "connector_kind", "points"],
  properties: {
    ...commonProperties,
    type: { const: "connector" },
    connector_kind: { enum: ["line", "arrow"] },
    points: { type: "array", minItems: 2, items: point },
    source_attachment: attachment,
    target_attachment: attachment,
  },
} as const;

export const boardSchemaV1 = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://duogram.dev/schemas/board.v1.json",
  title: "Duogram Board v1",
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "id", "revision", "elements"],
  properties: {
    schema_version: { const: 1 },
    id,
    revision: { type: "integer", minimum: 0 },
    elements: {
      type: "array",
      items: { oneOf: [shape, text, connector] },
    },
  },
} as const;

export const projectSchemaV1 = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://duogram.dev/schemas/project.v1.json",
  title: "Duogram Project v1",
  type: "object",
  additionalProperties: false,
  required: ["schema_version", "id", "name", "revision", "spaces"],
  properties: {
    schema_version: { const: 1 },
    id,
    name: { type: "string", minLength: 1 },
    revision: { type: "integer", minimum: 0 },
    spaces: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "boards"],
        properties: {
          id,
          name: { type: "string", minLength: 1 },
          boards: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "name"],
              properties: {
                id,
                name: { type: "string", minLength: 1 },
              },
            },
          },
        },
      },
    },
  },
} as const;
