import { OAuth2Client } from "google-auth-library";

import type { GoogleCalendarConfig } from "./calendar-config";

export const GOOGLE_OAUTH_STATE_COOKIE = "ud_google_oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "ud_google_oauth_verifier";

export function createGoogleOAuthClient(config: GoogleCalendarConfig) {
  return new OAuth2Client(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  );
}
