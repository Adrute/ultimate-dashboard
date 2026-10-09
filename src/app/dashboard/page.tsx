import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  createDashboardWidget,
  moveDashboardWidget,
  removeDashboardWidget,
  resizeDashboardWidget,
} from "./actions";
import { getDashboardFeedback } from "./feedback";

export const metadata = {
  title: "Panel",
};

type DashboardPageProps = Readonly<{
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}>;

const sizeLabels = {
  large: "Grande",
  medium: "Mediano",
  small: "Pequeño",
} as const;

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();
  const { error, message } = await searchParams;
  const feedback = getDashboardFeedback(error, message);

  const [layoutResult, personalSpaceResult] = await Promise.all([
    supabase
      .from("dashboard_layouts")
      .select("id, name")
      .eq("owner_user_id", user.id)
      .eq("is_default", true)
      .single(),
    supabase
      .from("spaces")
      .select("id, name")
      .eq("owner_user_id", user.id)
      .eq("kind", "personal")
      .single(),
  ]);

  if (layoutResult.error || personalSpaceResult.error) {
    throw new Error("No se pudo cargar la configuración del panel.");
  }

  const layout = layoutResult.data;
  const personalSpace = personalSpaceResult.data;
  const { data: widgets, error: widgetsError } = await supabase
    .from("dashboard_widgets")
    .select("id, position, size, title")
    .eq("layout_id", layout.id)
    .order("position", { ascending: true });

  if (widgetsError) {
    throw new Error("No se pudieron cargar los widgets del panel.");
  }

  return (
    <main className="page-shell dashboard-page" id="main-content" tabIndex={-1}>
      <header className="page-heading dashboard-heading dashboard-hero">
        <p className="eyebrow">Panel personal</p>
        <h1>Buenos días, {user.displayName ?? "Adrián"} 👋</h1>
        <p className="page-introduction">
          “Disciplina hoy, más tiempo mañana.”
        </p>
      </header>

      {feedback && (
        <p
          aria-live="polite"
          className={`dashboard-feedback is-${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}

      <section aria-labelledby="add-widget-title" className="widget-composer">
        <div>
          <p className="eyebrow">Personalizar</p>
          <h2 id="add-widget-title">Añade una tarjeta</h2>
          <p>
            Se guardará en {personalSpace.name} y podrás ordenarla o cambiar su
            tamaño.
          </p>
        </div>

        <form action={createDashboardWidget} className="widget-form">
          <input name="layoutId" type="hidden" value={layout.id} />
          <input name="spaceId" type="hidden" value={personalSpace.id} />

          <label htmlFor="widget-title">Título</label>
          <input
            id="widget-title"
            maxLength={60}
            name="title"
            placeholder="Por ejemplo, Prioridades"
            required
          />

          <label htmlFor="widget-size">Tamaño</label>
          <select defaultValue="medium" id="widget-size" name="size">
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
          </select>

          <button className="button-primary" type="submit">
            Añadir al panel
          </button>
        </form>
      </section>

      <section aria-labelledby="dashboard-layout-title" className="widget-area">
        <div className="widget-area-heading">
          <div>
            <p className="eyebrow">Vista actual</p>
            <h2 id="dashboard-layout-title">{layout.name}</h2>
          </div>
          <span
            aria-label={`${widgets.length} tarjetas`}
            className="widget-count"
          >
            {widgets.length}
          </span>
        </div>

        {widgets.length === 0 ? (
          <div className="dashboard-empty-state">
            <span aria-hidden="true">+</span>
            <h3>Tu panel está vacío</h3>
            <p>
              Añade la primera tarjeta con el formulario anterior. Este estado
              se guarda en tu cuenta, no en este navegador.
            </p>
          </div>
        ) : (
          <div className="widget-grid">
            {widgets.map((widget, index) => (
              <article
                className={`dashboard-widget is-${widget.size}`}
                key={widget.id}
              >
                <header>
                  <div>
                    <span>Tarjeta · {sizeLabels[widget.size]}</span>
                    <h3>{widget.title}</h3>
                  </div>
                  <span aria-hidden="true" className="widget-grip">
                    ···
                  </span>
                </header>

                <p>
                  Marcador preparado para conectar datos autorizados de tus
                  módulos.
                </p>

                <div className="widget-controls">
                  <form action={moveDashboardWidget}>
                    <input name="widgetId" type="hidden" value={widget.id} />
                    <input name="direction" type="hidden" value="up" />
                    <button disabled={index === 0} type="submit">
                      Mover antes
                    </button>
                  </form>

                  <form action={moveDashboardWidget}>
                    <input name="widgetId" type="hidden" value={widget.id} />
                    <input name="direction" type="hidden" value="down" />
                    <button
                      disabled={index === widgets.length - 1}
                      type="submit"
                    >
                      Mover después
                    </button>
                  </form>

                  <form action={resizeDashboardWidget} className="resize-form">
                    <input name="widgetId" type="hidden" value={widget.id} />
                    <label htmlFor={`widget-size-${widget.id}`}>Tamaño</label>
                    <select
                      defaultValue={widget.size}
                      id={`widget-size-${widget.id}`}
                      name="size"
                    >
                      <option value="small">Pequeño</option>
                      <option value="medium">Mediano</option>
                      <option value="large">Grande</option>
                    </select>
                    <button type="submit">Guardar</button>
                  </form>

                  <form action={removeDashboardWidget}>
                    <input name="widgetId" type="hidden" value={widget.id} />
                    <ConfirmSubmitButton
                      className="button-danger"
                      confirmation={`¿Eliminar la tarjeta «${widget.title}»?`}
                    >
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
