import { z } from "zod";

const normalizedEmailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email().max(254),
);

export const authCredentialsSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(8).max(128),
});

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;
