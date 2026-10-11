import { z } from "zod";

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

const redirectUriSchema = z.url().refine((url) => {
  const parsed = new URL(url);
  return (
    parsed.protocol === "https:" ||
    (parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(parsed.hostname))
  );
}, "La redirección debe usar HTTPS, salvo en localhost.");

const encryptionKeySchema = z.string().refine((value) => {
  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.length === 32 && decoded.toString("base64") === value;
  } catch {
    return false;
  }
}, "La clave de cifrado debe contener 32 bytes en base64.");

const googleCalendarConfigSchema = z.object({
  GOOGLE_CALENDAR_CLIENT_ID: z.string().trim().min(20).max(255),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().trim().min(8).max(255),
  GOOGLE_CALENDAR_REDIRECT_URI: redirectUriSchema,
  GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY: encryptionKeySchema,
});

export type GoogleCalendarConfig = Readonly<{
  clientId: string;
  clientSecret: string;
  encryptionKey: Buffer;
  redirectUri: string;
}>;

type GoogleCalendarEnvironment = Readonly<{
  GOOGLE_CALENDAR_CLIENT_ID?: string;
  GOOGLE_CALENDAR_CLIENT_SECRET?: string;
  GOOGLE_CALENDAR_REDIRECT_URI?: string;
  GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY?: string;
}>;

function readEnvironment(): GoogleCalendarEnvironment {
  return {
    GOOGLE_CALENDAR_CLIENT_ID: process.env.GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    GOOGLE_CALENDAR_REDIRECT_URI: process.env.GOOGLE_CALENDAR_REDIRECT_URI,
    GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY:
      process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY,
  };
}

export function isGoogleCalendarConfigured(
  environment: GoogleCalendarEnvironment = readEnvironment(),
) {
  return googleCalendarConfigSchema.safeParse(environment).success;
}

export function parseGoogleCalendarConfig(
  environment: GoogleCalendarEnvironment,
): GoogleCalendarConfig {
  const result = googleCalendarConfigSchema.safeParse(environment);
  if (!result.success) {
    throw new Error(
      "Google Calendar requiere client ID, client secret, redirect URI y una clave de cifrado válidos.",
    );
  }
  return {
    clientId: result.data.GOOGLE_CALENDAR_CLIENT_ID,
    clientSecret: result.data.GOOGLE_CALENDAR_CLIENT_SECRET,
    encryptionKey: Buffer.from(
      result.data.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY,
      "base64",
    ),
    redirectUri: result.data.GOOGLE_CALENDAR_REDIRECT_URI,
  };
}

export function getGoogleCalendarConfig() {
  return parseGoogleCalendarConfig(readEnvironment());
}
