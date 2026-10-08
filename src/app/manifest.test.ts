import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("web app manifest", () => {
  it("defines a scoped standalone application", () => {
    expect(manifest()).toMatchObject({
      display: "standalone",
      scope: "/",
      start_url: "/dashboard",
    });
  });

  it("provides a maskable application icon", () => {
    expect(manifest().icons).toContainEqual(
      expect.objectContaining({ purpose: "maskable", src: "/icon.svg" }),
    );
  });
});
