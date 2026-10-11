import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

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
import {
  decryptGoogleTokens,
  encryptGoogleTokens,
} from "@/lib/google/token-cipher";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const googleUserInfoSchema = z.object({
  email: z.email(),
  email_verified: z.boolean(),
  sub: z.string().min(1).max(255),
});

function statesMatch(received: string, stored: string) {
  if (received.length !== 43 || stored.length !== 43) return false;
  const receivedBuffer = Buffer.from(received);
  const storedBuffer = Buffer.from(stored);
  return (
    receivedBuffer.length === storedBuffer.length &&
    timingSafeEqual(receivedBuffer, storedBuffer)
  );
}

function calendarRedirect(request: NextRequest, code: string, success = false) {
  const response = NextResponse.redirect(
    new URL(`/calendar?${success ? "message" : "error"}=${code}`, request.url),
  );
  const expiredCookieOptions = {
    httpOnly: true,
    maxAge: 0,
    path: "/calendar/oauth",
    sameSite: "lax" as const,
  };
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", expiredCookieOptions);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, "", expiredCookieOptions);
  return response;
}

export async function GET(request: NextRequest) {
  const user = await requireAuthenticatedUser();
  if (!isGoogleCalendarConfigured()) {
    return calendarRedirect(request, "configuration");
  }

  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value;
  if (error || !code || !state || !storedState || !verifier) {
    return calendarRedirect(
      request,
      error === "access_denied" ? "denied" : "oauth_failed",
    );
  }
  if (!statesMatch(state, storedState)) {
    return calendarRedirect(request, "invalid_state");
  }
  if (verifier.length !== 86) {
    return calendarRedirect(request, "invalid_state");
  }

  const config = getGoogleCalendarConfig();
  const oauthClient = createGoogleOAuthClient(config);
  let tokenResponse;
  try {
    tokenResponse = await oauthClient.getToken({
      code,
      codeVerifier: verifier,
    });
  } catch {
    return calendarRedirect(request, "oauth_failed");
  }

  const accessToken = tokenResponse.tokens.access_token;
  if (!accessToken) return calendarRedirect(request, "oauth_failed");

  let userInfo;
  let grantedScopes: string[];
  try {
    const [tokenInfo, userInfoResponse] = await Promise.all([
      oauthClient.getTokenInfo(accessToken),
      fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10_000),
      }),
    ]);
    if (!userInfoResponse.ok) return calendarRedirect(request, "oauth_failed");
    grantedScopes = tokenInfo.scopes;
    userInfo = googleUserInfoSchema.parse(await userInfoResponse.json());
  } catch {
    return calendarRedirect(request, "oauth_failed");
  }
  if (!userInfo.email_verified)
    return calendarRedirect(request, "oauth_failed");
  const requiredCalendarScopes = GOOGLE_CALENDAR_SCOPES.filter((scope) =>
    scope.startsWith("https://www.googleapis.com/"),
  );
  if (!requiredCalendarScopes.every((scope) => grantedScopes.includes(scope))) {
    return calendarRedirect(request, "missing_scope");
  }

  const supabase = await createSupabaseServerClient();
  let refreshToken = tokenResponse.tokens.refresh_token ?? null;
  if (!refreshToken) {
    const { data: existingConnection, error: existingError } = await supabase
      .from("google_connections")
      .select("provider_subject,token_ciphertext")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (existingError) return calendarRedirect(request, "save_failed");
    if (existingConnection?.provider_subject === userInfo.sub) {
      try {
        refreshToken = decryptGoogleTokens(
          existingConnection.token_ciphertext,
          config.encryptionKey,
        ).refreshToken;
      } catch {
        return calendarRedirect(request, "save_failed");
      }
    }
  }
  if (!refreshToken) return calendarRedirect(request, "missing_refresh_token");

  const tokenCiphertext = encryptGoogleTokens(
    {
      accessToken,
      expiryDate: tokenResponse.tokens.expiry_date ?? null,
      refreshToken,
      tokenType: tokenResponse.tokens.token_type ?? null,
    },
    config.encryptionKey,
  );
  const { error: saveError } = await supabase
    .from("google_connections")
    .upsert({
      access_expires_at: tokenResponse.tokens.expiry_date
        ? new Date(tokenResponse.tokens.expiry_date).toISOString()
        : null,
      account_email: userInfo.email,
      granted_scopes: grantedScopes,
      owner_user_id: user.id,
      provider_subject: userInfo.sub,
      token_ciphertext: tokenCiphertext,
    });
  if (saveError) return calendarRedirect(request, "save_failed");
  return calendarRedirect(request, "connected", true);
}
