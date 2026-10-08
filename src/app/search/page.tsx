import Link from "next/link";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { globalSearchSchema } from "@/lib/search/search-input";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Buscar" };

type SearchPageProps = Readonly<{
  searchParams: Promise<{ q?: string }>;
}>;

const statusLabels = {
  done: "Completada",
  in_progress: "En curso",
  todo: "Pendiente",
} as const;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await requireAuthenticatedUser();
  const { q } = await searchParams;
  const parsedQuery = globalSearchSchema.safeParse(q);
  const query = parsedQuery.success ? parsedQuery.data : "";
  const invalidQuery =
    typeof q === "string" && q.length > 0 && !parsedQuery.success;

  const supabase = await createSupabaseServerClient();
  const spacesResult = await supabase.from("spaces").select("id, name");
  if (spacesResult.error) {
    throw new Error("No se pudieron cargar tus espacios.");
  }

  const spaceNames = new Map(
    spacesResult.data.map((space) => [space.id, space.name]),
  );
  const searchResult = query
    ? await supabase.rpc("search_tasks", { search_query: query })
    : { data: [], error: null };

  if (searchResult.error) {
    throw new Error("No se pudo completar la búsqueda.");
  }

  const tasks = searchResult.data;

  return (
    <main className="page-shell search-page" id="main-content" tabIndex={-1}>
      <header className="page-heading search-heading">
        <p className="eyebrow">Búsqueda inicial</p>
        <h1>Encuentra lo importante.</h1>
        <p className="page-introduction">
          Busca en los títulos y descripciones de las tareas que puedes ver.
        </p>
      </header>

      <form
        action="/search"
        className="global-search-form"
        method="get"
        role="search"
      >
        <label htmlFor="global-search">Buscar tareas</label>
        <div>
          <input
            autoComplete="off"
            defaultValue={query}
            id="global-search"
            maxLength={80}
            name="q"
            placeholder="Por ejemplo, compra semanal"
            required
            type="search"
          />
          <button className="button-primary" type="submit">
            Buscar
          </button>
        </div>
      </form>

      {invalidQuery && (
        <p className="search-error" role="alert">
          Introduce entre 1 y 80 caracteres.
        </p>
      )}

      {query && (
        <section
          aria-labelledby="search-results-title"
          className="search-results"
        >
          <div className="task-list-heading">
            <div>
              <p className="eyebrow">Resultados</p>
              <h2 id="search-results-title">Coincidencias para “{query}”</h2>
            </div>
            <span
              aria-label={`${tasks.length} resultados`}
              className="widget-count"
            >
              {tasks.length}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="task-empty-state">
              <span aria-hidden="true">?</span>
              <h3>No encontramos coincidencias</h3>
              <p>Prueba con otra palabra o revisa tus tareas.</p>
            </div>
          ) : (
            <div className="search-result-list">
              {tasks.map((task) => (
                <article className="search-result-card" key={task.id}>
                  <div>
                    <span>
                      {spaceNames.get(task.space_id) ?? "Espacio"} ·{" "}
                      {statusLabels[task.status]}
                    </span>
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <Link
                    href={`/tasks?filter=${task.status === "done" ? "done" : "open"}&space=${task.space_id}`}
                  >
                    Ver en tareas
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
