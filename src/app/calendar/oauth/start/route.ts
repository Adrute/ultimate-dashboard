import { createHash, randomBytes } from "node:crypto";
import { CodeChallengeMethod } from "google-auth-library";
import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  getGoogleCalendarConfig,
  GOOGLE_CALENDAR_SCOPES,
  isGoogleCalendarConfigured,
} from "@/lib/google/calendar-config";
import {
  createGoogleOAuthClient,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
} from "@/lib/google/calendar-oauth";

export async function GET(request: Request) {
  await requireAuthenticatedUser();
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.redirect(
      new URL("/calendar?error=configuration", request.url),
    );
  }

  const config = getGoogleCalendarConfig();
  const oauthClient = createGoogleOAuthClient(config);
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(64).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorizationUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    code_challenge: challenge,
    code_challenge_method: CodeChallengeMethod.S256,
    include_granted_scopes: true,
    prompt: "consent",
    scope: [...GOOGLE_CALENDAR_SCOPES],
    state,
  });
  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/calendar/oauth",
    sameSite: "lax" as const,
    secure: config.redirectUri.startsWith("https://"),
  };
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, verifier, cookieOptions);
  return response;
}
