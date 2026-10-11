import { describe, expect, it } from "vitest";

import {
  attachmentStoragePath,
  MAX_ATTACHMENT_BYTES,
  validateAttachmentFile,
} from "./attachment-input";

describe("note attachment input", () => {
  it("accepts a supported non-empty file", () => {
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    expect(validateAttachmentFile(file)).toMatchObject({
      fileName: "notes.txt",
      mimeType: "text/plain",
    });
  });

  it("rejects unsupported, empty and oversized files", () => {
    expect(
      validateAttachmentFile(
        new File(["x"], "script.svg", { type: "image/svg+xml" }),
      ),
    ).toBeNull();
    expect(
      validateAttachmentFile(new File([], "empty.txt", { type: "text/plain" })),
    ).toBeNull();
    expect(
      validateAttachmentFile(
        new File([new Uint8Array(MAX_ATTACHMENT_BYTES + 1)], "large.png", {
          type: "image/png",
        }),
      ),
    ).toBeNull();
  });

  it("builds a path without exposing the original filename", () => {
    expect(
      attachmentStoragePath(
        "11111111-1111-4111-8111-111111111111",
        "22222222-2222-4222-8222-222222222222",
        "33333333-3333-4333-8333-333333333333",
        "image/jpeg",
      ),
    ).toBe(
      "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333.jpg",
    );
  });
});
