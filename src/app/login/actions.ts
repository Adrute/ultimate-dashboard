"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authCredentialsSchema } from "@/lib/auth/credentials";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function parseCredentials(formData: FormData) {
  return authCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=configuration");
  }

  const credentials = parseCredentials(formData);

  if (!credentials.success) {
    redirect("/login?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=configuration");
  }

  const credentials = parseCredentials(formData);

  if (!credentials.success) {
    redirect("/login?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(credentials.data);

  if (error) {
    redirect("/login?error=signup_failed");
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/login?message=check_email");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login?message=signed_out");
}
