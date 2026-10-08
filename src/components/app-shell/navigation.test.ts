import { describe, expect, it } from "vitest";

import { primaryNavigationItems } from "./navigation";

describe("primary navigation", () => {
  it("uses unique, internal destinations", () => {
    const destinations = primaryNavigationItems.map(({ href }) => href);

    expect(new Set(destinations).size).toBe(destinations.length);
    expect(destinations.every((href) => href.startsWith("/"))).toBe(true);
  });
});
