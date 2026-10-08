import { describe, expect, it } from "vitest";

import { isSupabaseConfigured, parseSupabaseConfig } from "./config";

describe("Supabase configuration", () => {
  it("accepts a valid project URL and publishable key", () => {
    const configuration = parseSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    });

    expect(configuration.url).toBe("https://project.supabase.co");
  });

  it("rejects missing or malformed values", () => {
    expect(isSupabaseConfigured({})).toBe(false);
    expect(() =>
      parseSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
