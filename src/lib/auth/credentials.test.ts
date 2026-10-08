import { describe, expect, it } from "vitest";

import { authCredentialsSchema } from "./credentials";

describe("authentication credentials", () => {
  it("normalizes valid email credentials", () => {
    const result = authCredentialsSchema.parse({
      email: "  PERSONA@EXAMPLE.COM ",
      password: "a-secure-password",
    });

    expect(result.email).toBe("persona@example.com");
  });

  it("rejects invalid email addresses and short passwords", () => {
    expect(
      authCredentialsSchema.safeParse({
        email: "incorrecta",
        password: "short",
      }).success,
    ).toBe(false);
  });
});
