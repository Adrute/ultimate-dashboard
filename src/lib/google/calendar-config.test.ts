import { describe, expect, it } from "vitest";

import {
  isGoogleCalendarConfigured,
  parseGoogleCalendarConfig,
} from "./calendar-config";

const validEnvironment = {
  GOOGLE_CALENDAR_CLIENT_ID: "client-id.apps.googleusercontent.com",
  GOOGLE_CALENDAR_CLIENT_SECRET: "client-secret",
  GOOGLE_CALENDAR_REDIRECT_URI: "http://localhost:3000/calendar/oauth/callback",
  GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
};

describe("Google Calendar configuration", () => {
  it("accepts complete server-only OAuth configuration", () => {
    expect(isGoogleCalendarConfigured(validEnvironment)).toBe(true);
    expect(
      parseGoogleCalendarConfig(validEnvironment).encryptionKey,
    ).toHaveLength(32);
  });

  it("rejects missing keys, insecure remote redirects and short encryption keys", () => {
    expect(isGoogleCalendarConfigured({})).toBe(false);
    expect(
      isGoogleCalendarConfigured({
        ...validEnvironment,
        GOOGLE_CALENDAR_REDIRECT_URI:
          "http://ultimate-dashboard.example/calendar/oauth/callback",
      }),
    ).toBe(false);
    expect(
      isGoogleCalendarConfigured({
        ...validEnvironment,
        GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY:
          Buffer.alloc(16).toString("base64"),
      }),
    ).toBe(false);
  });
});
