import { redirect } from "next/navigation";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const userIdSchema = z.uuid();

export type AuthenticatedUser = Readonly<{
  displayName: string | null;
  email: string | null;
  id: string;
}>;

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userIdResult = userIdSchema.safeParse(claims?.sub);

  if (error || !claims || !userIdResult.success) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userIdResult.data)
    .maybeSingle();

  if (profileError) {
    throw new Error("No se pudo cargar el perfil autenticado.");
  }

  return {
    displayName: profile?.display_name ?? null,
    email: typeof claims.email === "string" ? claims.email : null,
    id: userIdResult.data,
  };
}

export async function requireAuthenticatedUser() {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=configuration");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login?error=session_required");
  }

  return user;
}
