const MAX_CONTENT_BYTES = 200_000;
const MAX_DEPTH = 20;
const MAX_NODES = 2_000;
const MAX_TEXT_LENGTH = 50_000;

const nodeTypes = new Set([
  "blockquote",
  "bulletList",
  "codeBlock",
  "doc",
  "hardBreak",
  "heading",
  "horizontalRule",
  "listItem",
  "orderedList",
  "paragraph",
  "text",
]);
const markTypes = new Set(["bold", "code", "italic", "link", "strike"]);

type NoteAttributes = Record<string, boolean | number | string>;

export type NoteMark = Readonly<{
  attrs?: NoteAttributes;
  type: string;
}>;

export type NoteNode = Readonly<{
  attrs?: NoteAttributes;
  content?: NoteNode[];
  marks?: NoteMark[];
  text?: string;
  type: string;
}>;

export type NoteDocument = NoteNode & Readonly<{ type: "doc" }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeHref(value: unknown) {
  if (typeof value !== "string" || value.length > 2_048) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function normalizeMarks(value: unknown): NoteMark[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 8) return null;

  const marks: NoteMark[] = [];
  for (const mark of value) {
    if (!isRecord(mark) || typeof mark.type !== "string") return null;
    if (!markTypes.has(mark.type)) return null;
    if (mark.type === "link") {
      const rawAttributes = isRecord(mark.attrs) ? mark.attrs : {};
      const href = normalizeHref(rawAttributes.href);
      if (!href) return null;
      marks.push({
        attrs: {
          href,
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
        type: "link",
      });
    } else {
      marks.push({ type: mark.type });
    }
  }
  return marks;
}

function normalizeAttributes(
  type: string,
  value: unknown,
): NoteAttributes | null {
  const attributes = isRecord(value) ? value : {};
  if (type === "heading") {
    const level = attributes.level;
    return level === 1 || level === 2 || level === 3 ? { level } : null;
  }
  if (type === "orderedList") {
    const start = attributes.start;
    if (start === undefined) return {};
    return Number.isInteger(start) &&
      Number(start) >= 1 &&
      Number(start) <= 9_999
      ? { start: Number(start) }
      : null;
  }
  if (type === "codeBlock") {
    const language = attributes.language;
    return language === null || language === undefined
      ? {}
      : typeof language === "string" && language.length <= 32
        ? { language }
        : null;
  }
  return {};
}

export function safeParseNoteDocument(value: unknown): NoteDocument | null {
  let candidate = value;
  if (typeof value === "string") {
    if (new TextEncoder().encode(value).length > MAX_CONTENT_BYTES) return null;
    try {
      candidate = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  try {
    if (
      new TextEncoder().encode(JSON.stringify(candidate)).length >
      MAX_CONTENT_BYTES
    ) {
      return null;
    }
  } catch {
    return null;
  }

  let nodes = 0;
  let textLength = 0;
  function visit(rawNode: unknown, depth: number): NoteNode | null {
    if (depth > MAX_DEPTH || ++nodes > MAX_NODES || !isRecord(rawNode)) {
      return null;
    }
    const type = rawNode.type;
    if (typeof type !== "string" || !nodeTypes.has(type)) return null;

    if (type === "text") {
      if (typeof rawNode.text !== "string") return null;
      textLength += rawNode.text.length;
      if (textLength > MAX_TEXT_LENGTH) return null;
      const marks = normalizeMarks(rawNode.marks);
      if (!marks) return null;
      return {
        ...(marks.length ? { marks } : {}),
        text: rawNode.text,
        type,
      };
    }

    const attrs = normalizeAttributes(type, rawNode.attrs);
    if (!attrs) return null;
    if (rawNode.content !== undefined && !Array.isArray(rawNode.content)) {
      return null;
    }
    const content: NoteNode[] = [];
    for (const child of rawNode.content ?? []) {
      const normalizedChild = visit(child, depth + 1);
      if (!normalizedChild) return null;
      content.push(normalizedChild);
    }

    return {
      ...(Object.keys(attrs).length ? { attrs } : {}),
      ...(content.length ? { content } : {}),
      type,
    };
  }

  const document = visit(candidate, 0);
  return document?.type === "doc" ? (document as NoteDocument) : null;
}

export function plainTextToNoteDocument(body: string): NoteDocument {
  return {
    content: body.split("\n").map((line) => ({
      ...(line ? { content: [{ text: line, type: "text" }] } : {}),
      type: "paragraph",
    })),
    type: "doc",
  };
}

export function noteDocumentToPlainText(document: NoteDocument) {
  function read(node: NoteNode): string {
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return "\n";
    const text = node.content?.map(read).join("") ?? "";
    if (["codeBlock", "heading", "paragraph"].includes(node.type)) {
      return `${text}\n`;
    }
    return text;
  }

  return read(document)
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd()
    .slice(0, MAX_TEXT_LENGTH);
}
