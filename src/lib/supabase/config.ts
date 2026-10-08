import { z } from "zod";

const supabaseConfigSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type SupabaseConfig = Readonly<{
  publishableKey: string;
  url: string;
}>;

type PublicEnvironment = Readonly<{
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
}>;

function readPublicEnvironment(): PublicEnvironment {
  return {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
}

export function isSupabaseConfigured(
  environment: PublicEnvironment = readPublicEnvironment(),
) {
  return supabaseConfigSchema.safeParse(environment).success;
}

export function parseSupabaseConfig(
  environment: PublicEnvironment,
): SupabaseConfig {
  const result = supabaseConfigSchema.safeParse(environment);

  if (!result.success) {
    throw new Error(
      "Supabase requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY válidas.",
    );
  }

  return {
    publishableKey: result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    url: result.data.NEXT_PUBLIC_SUPABASE_URL,
  };
}

export function getSupabaseConfig() {
  return parseSupabaseConfig(readPublicEnvironment());
}
