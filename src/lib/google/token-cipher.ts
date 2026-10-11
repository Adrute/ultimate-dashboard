import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";

const storedGoogleTokensSchema = z.object({
  accessToken: z.string().min(1).max(8192),
  expiryDate: z.number().int().positive().nullable(),
  refreshToken: z.string().min(1).max(8192),
  tokenType: z.string().min(1).max(64).nullable(),
});

export type StoredGoogleTokens = z.infer<typeof storedGoogleTokensSchema>;

const encryptedPayloadSchema = z.object({
  ciphertext: z.string().min(1).max(32_768),
  iv: z.string().min(1).max(64),
  tag: z.string().min(1).max(64),
  version: z.literal(1),
});

export function encryptGoogleTokens(tokens: StoredGoogleTokens, key: Buffer) {
  const validatedTokens = storedGoogleTokensSchema.parse(tokens);
  if (key.length !== 32) throw new Error("Invalid token encryption key.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(validatedTokens), "utf8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    ciphertext: ciphertext.toString("base64url"),
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    version: 1,
  });
}

export function decryptGoogleTokens(payload: string, key: Buffer) {
  if (key.length !== 32) throw new Error("Invalid token encryption key.");
  if (payload.length > 33_000)
    throw new Error("Invalid encrypted token payload.");
  const parsedPayload = encryptedPayloadSchema.parse(JSON.parse(payload));
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(parsedPayload.iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(parsedPayload.tag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(parsedPayload.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  return storedGoogleTokensSchema.parse(JSON.parse(plaintext));
}
