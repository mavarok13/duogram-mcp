import * as z from "zod/v4";

const uuid = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const point = z.object({ x: z.number(), y: z.number() }).strict();
const size = z
  .object({ width: z.number().positive(), height: z.number().positive() })
  .strict();
const textStyle = z
  .object({
    font_family: z.enum([
      "Roboto",
      "Montserrat",
      "Open Sans",
      "Source Sans 3",
      "System UI",
    ]),
    horizontal_alignment: z.enum(["left", "center", "right"]),
    vertical_alignment: z.enum(["top", "center", "bottom"]),
    bold: z.boolean(),
    italic: z.boolean(),
    underline: z.boolean(),
    strikethrough: z.boolean(),
  })
  .strict();
const agentMeta = z.record(z.string(), z.json());

const shape = z
  .object({
    id: uuid,
    type: z.literal("shape"),
    shape_kind: z.enum(["rectangle", "ellipse", "diamond"]),
    position: point,
    size,
    content: z.string(),
    color,
    border: z
      .object({
        style: z.enum(["solid", "dashed", "dotted"]),
        thickness: z.number().positive(),
        color,
      })
      .strict()
      .nullable(),
    text_style: textStyle,
    agent_meta: agentMeta,
  })
  .strict();

const text = z
  .object({
    id: uuid,
    type: z.literal("text"),
    position: point,
    size,
    content: z.string(),
    color,
    text_style: textStyle,
    agent_meta: agentMeta,
  })
  .strict();

const attachment = z
  .object({
    element_id: uuid,
    anchor: z
      .object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
      })
      .strict(),
  })
  .strict();

const connector = z
  .object({
    id: uuid,
    type: z.literal("connector"),
    connector_kind: z.enum(["line", "arrow"]),
    points: z.array(point).min(2),
    source_attachment: attachment.optional(),
    target_attachment: attachment.optional(),
    content: z.string(),
    color,
    agent_meta: agentMeta,
  })
  .strict();

const element = z.discriminatedUnion("type", [shape, text, connector]);

export const boardOperation = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add"), element }).strict(),
  z.object({ type: z.literal("update"), element }).strict(),
  z.object({ type: z.literal("delete"), element_id: uuid }).strict(),
]);

export const toolFields = {
  uuid,
  name: z.string().trim().min(1),
  revision: z.number().int().min(0),
  boardOperation,
} as const;
