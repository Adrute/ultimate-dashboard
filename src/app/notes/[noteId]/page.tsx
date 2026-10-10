import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { deleteNote } from "../actions";
import {
  createChildNote,
  restoreNoteVersion,
  updateDetailedNote,
} from "./actions";

type NoteDetailPageProps = Readonly<{
  params: Promise<{ noteId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}>;

const feedbackMessages = {
  child_create_failed: "No se pudo crear la subpágina.",
  child_created: "Subpágina creada.",
  restore_failed:
    "No se pudo restaurar esa versión. Es posible que su página superior ya no exista.",
  restored: "Versión restaurada y guardada como un cambio nuevo.",
  update_failed: "No se pudo guardar la nota.",
  updated: "Nota guardada.",
} as const;

export default async function NoteDetailPage({
  params,
  searchParams,
}: NoteDetailPageProps) {
  const user = await requireAuthenticatedUser();
  const parsedNoteId = z.uuid().safeParse((await params).noteId);
  if (!parsedNoteId.success) notFound();

  const noteId = parsedNoteId.data;
  const supabase = await createSupabaseServerClient();
  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("body,id,parent_note_id,space_id,title,updated_at")
    .eq("id", noteId)
    .maybeSingle();

  if (noteError) throw new Error("No se pudo cargar la nota.");
  if (!note) notFound();

  const [spaceResult, membershipResult, pagesResult, versionsResult] =
    await Promise.all([
      supabase
        .from("spaces")
        .select("id,kind,name,owner_user_id")
        .eq("id", note.space_id)
        .single(),
      supabase
        .from("space_members")
        .select("role")
        .eq("space_id", note.space_id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("notes")
        .select("id,parent_note_id,title,updated_at")
        .eq("space_id", note.space_id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("note_versions")
        .select("created_at,id,title,version_number")
        .eq("note_id", note.id)
        .order("version_number", { ascending: false }),
    ]);

  if (
    spaceResult.error ||
    membershipResult.error ||
    pagesResult.error ||
    versionsResult.error
  ) {
    throw new Error("No se pudo cargar el contenido de la nota.");
  }

  const space = spaceResult.data;
  const canEdit =
    (space.kind === "personal" && space.owner_user_id === user.id) ||
    membershipResult.data?.role === "admin" ||
    membershipResult.data?.role === "editor";
  const pages = pagesResult.data;
  const pageById = new Map(pages.map((page) => [page.id, page]));
  const breadcrumbs: typeof pages = [];
  let parentId = note.parent_note_id;
  const visited = new Set<string>();
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = pageById.get(parentId);
    if (!parent) break;
    breadcrumbs.unshift(parent);
    parentId = parent.parent_note_id;
  }
  const children = pages.filter(
    ({ parent_note_id }) => parent_note_id === note.id,
  );
  const feedbackParams = await searchParams;
  const feedbackCode = feedbackParams.error ?? feedbackParams.message;
  const feedback =
    feedbackMessages[feedbackCode as keyof typeof feedbackMessages];

  return (
    <main
      className="page-shell note-detail-page"
      id="main-content"
      tabIndex={-1}
    >
      <nav aria-label="Ruta de la nota" className="note-breadcrumbs">
        <Link href="/notes">Notas</Link>
        {breadcrumbs.map((parent) => (
          <span key={parent.id}>
            <span aria-hidden="true">/</span>
            <Link href={`/notes/${parent.id}`}>{parent.title}</Link>
          </span>
        ))}
        <span aria-current="page">/ {note.title}</span>
      </nav>

      {feedback && (
        <p
          aria-live="polite"
          className={`dashboard-feedback is-${feedbackParams.error ? "error" : "success"}`}
          role={feedbackParams.error ? "alert" : "status"}
        >
          {feedback}
        </p>
      )}

      <div className="note-workspace">
        <article className="note-editor-card">
          <p className="eyebrow">{space.name}</p>
          {canEdit ? (
            <form action={updateDetailedNote} className="note-detail-form">
              <input name="noteId" type="hidden" value={note.id} />
              <label className="sr-only" htmlFor="detail-note-title">
                Título
              </label>
              <input
                className="note-title-input"
                defaultValue={note.title}
                id="detail-note-title"
                maxLength={160}
                name="title"
                required
              />
              <label className="sr-only" htmlFor="detail-note-body">
                Contenido
              </label>
              <textarea
                className="note-body-input"
                defaultValue={note.body}
                id="detail-note-body"
                maxLength={50000}
                name="body"
                placeholder="Empieza a escribir…"
                rows={18}
              />
              <div className="note-editor-footer">
                <span>Texto plano · historial automático</span>
                <button className="button-primary" type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          ) : (
            <div className="note-readonly-content">
              <h1>{note.title}</h1>
              <p>{note.body || "Nota vacía"}</p>
            </div>
          )}
        </article>

        <aside className="note-context-panel">
          <section aria-labelledby="child-pages-title">
            <div className="note-panel-heading">
              <h2 id="child-pages-title">Subpáginas</h2>
              <span>{children.length}</span>
            </div>
            {children.length ? (
              <ul className="child-page-list">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link href={`/notes/${child.id}`}>{child.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="note-panel-empty">Aún no hay subpáginas.</p>
            )}
            {canEdit && (
              <details className="child-note-composer">
                <summary>＋ Añadir subpágina</summary>
                <form action={createChildNote}>
                  <input name="spaceId" type="hidden" value={note.space_id} />
                  <input name="parentNoteId" type="hidden" value={note.id} />
                  <label>
                    Título
                    <input maxLength={160} name="title" required />
                  </label>
                  <input name="body" type="hidden" value="" />
                  <button type="submit">Crear</button>
                </form>
              </details>
            )}
          </section>

          <section aria-labelledby="version-history-title">
            <div className="note-panel-heading">
              <h2 id="version-history-title">Historial</h2>
              <span>{versionsResult.data.length}</span>
            </div>
            <ol className="note-version-list">
              {versionsResult.data.map((version, index) => (
                <li key={version.id}>
                  <div>
                    <strong>Versión {version.version_number}</strong>
                    <time dateTime={version.created_at}>
                      {new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(version.created_at))}
                    </time>
                  </div>
                  {canEdit && index > 0 && (
                    <form action={restoreNoteVersion}>
                      <input name="noteId" type="hidden" value={note.id} />
                      <input
                        name="versionId"
                        type="hidden"
                        value={version.id}
                      />
                      <ConfirmSubmitButton
                        confirmation={`¿Restaurar la versión ${version.version_number}? El estado actual se conservará en el historial.`}
                      >
                        Restaurar
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {canEdit && (
            <form action={deleteNote} className="note-detail-delete">
              <input name="noteId" type="hidden" value={note.id} />
              <ConfirmSubmitButton
                className="button-danger"
                confirmation={`¿Eliminar “${note.title}”? Sus subpáginas pasarán al nivel principal.`}
              >
                Eliminar nota
              </ConfirmSubmitButton>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
