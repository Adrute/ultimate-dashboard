"use client";

import LinkExtension from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { NoteDocument } from "@/lib/notes/note-content";

import { updateDetailedNote } from "@/app/notes/[noteId]/actions";

type RichNoteEditorProps = Readonly<{
  canEdit: boolean;
  content: NoteDocument;
  noteId: string;
  pages: ReadonlyArray<Readonly<{ id: string; title: string }>>;
  title: string;
}>;

type ToolbarButtonProps = Readonly<{
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}>;

function ToolbarButton({
  active,
  children,
  disabled = false,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={active ? "is-active" : undefined}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

export function RichNoteEditor({
  canEdit,
  content,
  noteId,
  pages,
  title,
}: RichNoteEditorProps) {
  const router = useRouter();
  const [serializedContent, setSerializedContent] = useState(() =>
    JSON.stringify(content),
  );
  const [showInternalLink, setShowInternalLink] = useState(false);
  const [targetPageId, setTargetPageId] = useState(pages[0]?.id ?? "");
  const editor = useEditor({
    content,
    editable: canEdit,
    editorProps: {
      attributes: {
        "aria-label": canEdit
          ? "Editor de contenido de la nota"
          : "Contenido de la nota",
        class: "rich-note-content",
      },
    },
    extensions: [
      StarterKit.configure({ link: false }),
      LinkExtension.configure({
        enableClickSelection: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
        },
        isAllowedUri: (url, context) =>
          (url.startsWith("/") && !url.startsWith("//")) ||
          context.defaultValidate(url),
        openOnClick: !canEdit,
      }),
      TableKit.configure({
        table: {
          renderWrapper: true,
          resizable: false,
        },
      }),
    ],
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setSerializedContent(JSON.stringify(currentEditor.getJSON()));
    },
  });

  if (!editor) {
    return <div aria-label="Cargando editor" className="note-editor-loading" />;
  }

  if (!canEdit) {
    return (
      <div className="note-readonly-content">
        <h1>{title}</h1>
        <EditorContent editor={editor} />
      </div>
    );
  }

  function editLink() {
    if (!editor) return;
    const previousHref = String(editor.getAttributes("link").href ?? "");
    const href = window.prompt("Dirección del enlace", previousHref);
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: href.trim(),
        target: href.trim().startsWith("/") ? "_self" : "_blank",
      })
      .run();
  }

  function insertInternalLink() {
    if (!editor) return;
    const page = pages.find(({ id }) => id === targetPageId);
    if (!page) return;
    const href = `/notes/${page.id}`;
    const chain = editor.chain().focus();
    if (editor.state.selection.empty) {
      chain
        .insertContent({
          marks: [{ attrs: { href, target: "_self" }, type: "link" }],
          text: page.title,
          type: "text",
        })
        .run();
    } else {
      chain.setLink({ href, target: "_self" }).run();
    }
    setShowInternalLink(false);
  }

  function openActiveLink() {
    if (!editor) return;
    const href = String(editor.getAttributes("link").href ?? "");
    if (href.startsWith("/") && !href.startsWith("//")) {
      router.push(href);
      return;
    }
    try {
      const url = new URL(href);
      if (["http:", "https:", "mailto:"].includes(url.protocol)) {
        window.open(url.href, "_blank", "noopener,noreferrer");
      }
    } catch {
      // Invalid draft links are ignored and rejected by the server on save.
    }
  }

  return (
    <form action={updateDetailedNote} className="note-detail-form">
      <input name="noteId" type="hidden" value={noteId} />
      <input name="content" type="hidden" value={serializedContent} />
      <label className="sr-only" htmlFor="detail-note-title">
        Título
      </label>
      <input
        className="note-title-input"
        defaultValue={title}
        id="detail-note-title"
        maxLength={160}
        name="title"
        required
      />

      <div
        aria-label="Formato de texto"
        className="note-editor-toolbar"
        role="toolbar"
      >
        <ToolbarButton
          active={editor.isActive("bold")}
          label="Negrita"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>N</strong>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          label="Cursiva"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>C</em>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          label="Tachado"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>T</s>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          label="Encabezado"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          label="Lista con viñetas"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • Lista
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          label="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. Lista
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          label="Cita"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          “ Cita
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("codeBlock")}
          label="Bloque de código"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          {"</>"}
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("link")}
          label="Añadir o editar enlace"
          onClick={editLink}
        >
          Enlace
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton label="Abrir enlace" onClick={openActiveLink}>
            Abrir ↗
          </ToolbarButton>
        )}
        <ToolbarButton
          active={showInternalLink}
          disabled={pages.length === 0}
          label="Enlazar otra página"
          onClick={() => setShowInternalLink((visible) => !visible)}
        >
          Página
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("table")}
          label="Insertar tabla"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ cols: 3, rows: 3, withHeaderRow: true })
              .run()
          }
        >
          Tabla
        </ToolbarButton>
        <span aria-hidden="true" className="note-toolbar-separator" />
        <ToolbarButton
          disabled={!editor.can().chain().focus().undo().run()}
          label="Deshacer"
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          disabled={!editor.can().chain().focus().redo().run()}
          label="Rehacer"
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </ToolbarButton>
      </div>

      {showInternalLink && (
        <div className="note-internal-link-panel">
          <label htmlFor="internal-note-target">Página de destino</label>
          <select
            id="internal-note-target"
            onChange={(event) => setTargetPageId(event.target.value)}
            value={targetPageId}
          >
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.title}
              </option>
            ))}
          </select>
          <button onClick={insertInternalLink} type="button">
            Insertar enlace
          </button>
        </div>
      )}

      {editor.isActive("table") && (
        <div
          aria-label="Editar tabla"
          className="note-table-toolbar"
          role="toolbar"
        >
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            type="button"
          >
            ＋ Fila
          </button>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            type="button"
          >
            ＋ Columna
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            type="button"
          >
            Eliminar fila
          </button>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            type="button"
          >
            Eliminar columna
          </button>
          <button
            className="is-danger"
            onClick={() => editor.chain().focus().deleteTable().run()}
            type="button"
          >
            Eliminar tabla
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      <div className="note-editor-footer">
        <span>Contenido enriquecido · historial automático</span>
        <button className="button-primary" type="submit">
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
