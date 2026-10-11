import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { isGoogleCalendarConfigured } from "@/lib/google/calendar-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { disconnectGoogleCalendar } from "./actions";

export const metadata = { title: "Calendario" };

type CalendarPageProps = Readonly<{
  searchParams: Promise<{ error?: string; message?: string }>;
}>;

const feedbackMessages = {
  configuration: "Completa la configuración OAuth de Google Calendar.",
  connected: "Google Calendar se ha conectado correctamente.",
  denied: "La conexión fue cancelada en Google.",
  disconnected: "Google Calendar se ha desconectado.",
  disconnect_failed:
    "No se pudo revocar la conexión. Inténtalo de nuevo para evitar dejar permisos activos.",
  invalid_state: "La solicitud OAuth caducó o no es válida. Vuelve a empezar.",
  missing_refresh_token:
    "Google no devolvió acceso offline. Revoca el acceso en Google y vuelve a conectar.",
  missing_scope:
    "Google no concedió todos los permisos necesarios para gestionar eventos.",
  oauth_failed: "No se pudo completar la autorización con Google.",
  save_failed: "No se pudo guardar la conexión cifrada.",
} as const;

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const user = await requireAuthenticatedUser();
  const configured = isGoogleCalendarConfigured();
  const supabase = await createSupabaseServerClient();
  const { data: connection, error: connectionError } = await supabase
    .from("google_connections")
    .select("access_expires_at,account_email,granted_scopes,updated_at")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (connectionError)
    throw new Error("No se pudo cargar la conexión de calendario.");

  const params = await searchParams;
  const feedbackCode = params.error ?? params.message;
  const feedback =
    feedbackMessages[feedbackCode as keyof typeof feedbackMessages];

  return (
    <main className="page-shell calendar-page" id="main-content" tabIndex={-1}>
      <header className="page-heading calendar-heading">
        <p className="eyebrow">Google Calendar</p>
        <h1>Tu tiempo, en un solo lugar.</h1>
        <p className="page-introduction">
          Conecta tu cuenta de Google para consultar y gestionar eventos. Tus
          tareas seguirán siendo datos de UltimateDashboard y no se convertirán
          automáticamente en eventos.
        </p>
      </header>

      {feedback && (
        <p
          className={`dashboard-feedback is-${params.error ? "error" : "success"}`}
          role={params.error ? "alert" : "status"}
        >
          {feedback}
        </p>
      )}

      <section
        aria-labelledby="calendar-connection-title"
        className="calendar-connection-card"
      >
        <div>
          <p className="eyebrow">Conexión</p>
          <h2 id="calendar-connection-title">
            {connection ? "Cuenta conectada" : "Conecta Google Calendar"}
          </h2>
          {connection ? (
            <>
              <p>
                Cuenta: <strong>{connection.account_email}</strong>
              </p>
              <p className="calendar-connection-meta">
                Acceso cifrado · actualizado el{" "}
                {new Intl.DateTimeFormat("es-ES", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(connection.updated_at))}
              </p>
            </>
          ) : (
            <p>
              Solicitaremos acceso a tu lista de calendarios y a sus eventos.
              Podrás revocarlo desde aquí.
            </p>
          )}
        </div>

        {connection ? (
          <form action={disconnectGoogleCalendar}>
            <ConfirmSubmitButton
              className="button-danger"
              confirmation="¿Desconectar Google Calendar y revocar su permiso?"
            >
              Desconectar
            </ConfirmSubmitButton>
          </form>
        ) : configured ? (
          <a
            className="button-primary calendar-connect-link"
            href="/calendar/oauth/start"
          >
            Conectar con Google
          </a>
        ) : (
          <div className="calendar-configuration-note">
            <strong>Configuración manual pendiente</strong>
            <p>
              Añade las cuatro variables de servidor indicadas en
              `.env.example`.
            </p>
          </div>
        )}
      </section>

      <section
        aria-labelledby="calendar-next-title"
        className="calendar-empty-state"
      >
        <span aria-hidden="true">□</span>
        <h2 id="calendar-next-title">Eventos y vistas, en el siguiente paso</h2>
        <p>
          Cuando la conexión esté validada añadiremos la lista de calendarios y
          las vistas de agenda, día, semana y mes.
        </p>
      </section>
    </main>
  );
}
