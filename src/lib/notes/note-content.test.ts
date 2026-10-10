import { describe, expect, it } from "vitest";

import {
  noteDocumentToPlainText,
  plainTextToNoteDocument,
  safeParseNoteDocument,
} from "./note-content";

describe("note content", () => {
  it("converts plain text into a structured document and back", () => {
    const document = plainTextToNoteDocument("Primera\nSegunda");

    expect(document.type).toBe("doc");
    expect(noteDocumentToPlainText(document)).toBe("Primera\nSegunda");
  });

  it("extracts searchable text from structured lists", () => {
    const document = safeParseNoteDocument({
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [{ text: "Primero", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
            {
              content: [
                {
                  content: [{ text: "Segundo", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
          ],
          type: "bulletList",
        },
      ],
      type: "doc",
    });

    expect(document && noteDocumentToPlainText(document)).toBe(
      "Primero\nSegundo",
    );
  });

  it("keeps supported formatting and safe links", () => {
    const document = safeParseNoteDocument({
      content: [
        {
          content: [
            {
              marks: [
                { attrs: { href: "https://example.com/path" }, type: "link" },
              ],
              text: "Enlace",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "doc",
    });

    expect(document?.content?.[0]?.content?.[0]?.marks?.[0]?.attrs?.href).toBe(
      "https://example.com/path",
    );
  });

  it("rejects executable links and unsupported nodes", () => {
    expect(
      safeParseNoteDocument({
        content: [
          {
            marks: [{ attrs: { href: "javascript:alert(1)" }, type: "link" }],
            text: "No",
            type: "text",
          },
        ],
        type: "doc",
      }),
    ).toBeNull();
    expect(
      safeParseNoteDocument({ content: [{ type: "image" }], type: "doc" }),
    ).toBeNull();
  });

  it("rejects malformed or oversized documents", () => {
    expect(safeParseNoteDocument("not-json")).toBeNull();
    expect(
      safeParseNoteDocument({
        content: [
          {
            content: [{ text: "a".repeat(50_001), type: "text" }],
            type: "paragraph",
          },
        ],
        type: "doc",
      }),
    ).toBeNull();
  });
});
