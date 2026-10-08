import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { signIn, signUp } from "./actions";
import { getLoginFeedback } from "./feedback";

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}>;

export const metadata = {
  title: "Acceso",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configured = isSupabaseConfigured();
  const user = configured ? await getAuthenticatedUser() : null;

  if (user) {
    redirect("/dashboard");
  }

  const { error, message } = await searchParams;
  const feedback = getLoginFeedback(error, message);

  return (
    <main className="auth-page" id="main-content">
      <section aria-labelledby="auth-title" className="auth-card">
        <Link
          aria-label="Volver al inicio"
          className="brand auth-brand"
          href="/"
        >
          <span aria-hidden="true" className="brand-mark">
            U
          </span>
          <span className="mobile-brand-name">UltimateDashboard</span>
        </Link>

        <div className="auth-heading">
          <p className="eyebrow">Espacio personal</p>
          <h1 id="auth-title">Entra a tu espacio</h1>
          <p>Accede con tu correo o crea una cuenta nueva.</p>
        </div>

        {feedback && (
          <p
            className={`auth-feedback is-${feedback.kind}`}
            role={feedback.kind === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        )}

        {!configured && (
          <div className="configuration-note">
            <strong>Configuración pendiente</strong>
            <p>Copia `.env.example` a `.env.local` y completa:</p>
            <code>NEXT_PUBLIC_SUPABASE_URL</code>
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
          </div>
        )}

        <form className="auth-form">
          <label htmlFor="email">Correo electrónico</label>
          <input
            autoComplete="email"
            disabled={!configured}
            id="email"
            inputMode="email"
            name="email"
            placeholder="tu@ejemplo.com"
            required
            type="email"
          />

          <label htmlFor="password">Contraseña</label>
          <input
            autoComplete="current-password"
            disabled={!configured}
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />

          <div className="auth-actions">
            <button disabled={!configured} formAction={signIn} type="submit">
              Entrar
            </button>
            <button
              className="button-secondary"
              disabled={!configured}
              formAction={signUp}
              type="submit"
            >
              Crear cuenta
            </button>
          </div>
        </form>

        <Link className="back-link" href="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
