"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  getGoogleCalendarConfig,
  isGoogleCalendarConfigured,
} from "@/lib/google/calendar-config";
import { createGoogleOAuthClient } from "@/lib/google/calendar-oauth";
import { decryptGoogleTokens } from "@/lib/google/token-cipher";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function disconnectGoogleCalendar() {
  const user = await requireAuthenticatedUser();
  if (!isGoogleCalendarConfigured()) {
    redirect("/calendar?error=configuration");
  }

  const supabase = await createSupabaseServerClient();
  const { data: connection, error: connectionError } = await supabase
    .from("google_connections")
    .select("token_ciphertext")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (connectionError || !connection) {
    redirect("/calendar?error=disconnect_failed");
  }

  const config = getGoogleCalendarConfig();
  let refreshToken;
  try {
    refreshToken = decryptGoogleTokens(
      connection.token_ciphertext,
      config.encryptionKey,
    ).refreshToken;
    await createGoogleOAuthClient(config).revokeToken(refreshToken);
  } catch {
    redirect("/calendar?error=disconnect_failed");
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("google_connections")
    .delete()
    .eq("owner_user_id", user.id)
    .select("owner_user_id")
    .maybeSingle();
  if (deleteError || !deleted) {
    redirect("/calendar?error=disconnect_failed");
  }
  revalidatePath("/calendar");
  redirect("/calendar?message=disconnected");
}
