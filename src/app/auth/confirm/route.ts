import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const confirmationSchema = z.object({
  tokenHash: z.string().min(1),
  type: z.enum([
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email",
  ]),
});

export async function GET(request: NextRequest) {
  const redirectTo = new URL("/login?error=verification_failed", request.url);

  if (!isSupabaseConfigured()) {
    redirectTo.searchParams.set("error", "configuration");
    return NextResponse.redirect(redirectTo);
  }

  const confirmation = confirmationSchema.safeParse({
    tokenHash: request.nextUrl.searchParams.get("token_hash"),
    type: request.nextUrl.searchParams.get("type"),
  });

  if (!confirmation.success) {
    return NextResponse.redirect(redirectTo);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: confirmation.data.tokenHash,
    type: confirmation.data.type as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(redirectTo);
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
