import { describe, expect, it } from "vitest";

import { decryptGoogleTokens, encryptGoogleTokens } from "./token-cipher";

const tokens = {
  accessToken: "access-token",
  expiryDate: 1_800_000_000_000,
  refreshToken: "refresh-token",
  tokenType: "Bearer",
};

describe("Google token encryption", () => {
  it("round-trips tokens without exposing plaintext", () => {
    const key = Buffer.alloc(32, 4);
    const encrypted = encryptGoogleTokens(tokens, key);

    expect(encrypted).not.toContain("access-token");
    expect(encrypted).not.toContain("refresh-token");
    expect(decryptGoogleTokens(encrypted, key)).toEqual(tokens);
  });

  it("rejects a different key and malformed payloads", () => {
    const encrypted = encryptGoogleTokens(tokens, Buffer.alloc(32, 4));
    expect(() => decryptGoogleTokens(encrypted, Buffer.alloc(32, 5))).toThrow();
    expect(() => decryptGoogleTokens("{}", Buffer.alloc(32, 4))).toThrow();
  });
});
