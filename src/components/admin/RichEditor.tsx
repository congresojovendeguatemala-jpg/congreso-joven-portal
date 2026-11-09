"use client";
import { useEditor, EditorContent, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { useRef, useState } from "react";

/**
 * Editor visual de artículos. Guarda el contenido como JSON de TipTap en un campo oculto;
 * el sitio público lo renderiza con un renderizador propio (sin HTML arbitrario).
 */
export function RichEditor({ name, initial, disabled = false }: { name: string; initial?: JSONContent | null; disabled?: boolean }) {
  const [json, setJson] = useState<string>(initial ? JSON.stringify(initial) : "");
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
      }),
      Image.configure({ HTMLAttributes: { class: "my-6" } }),
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
    ],
    content: initial ?? "",
    editorProps: { attributes: { class: "prose-cj min-h-[320px] px-5 py-4 outline-none text-[1.02rem]" } },
    onUpdate: ({ editor }) => setJson(JSON.stringify(editor.getJSON())),
  });

  async function upload(file: File) {
    setMsg("Subiendo imagen…");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/admin/api/upload", { method: "POST", body: fd });
    const data = (await r.json()) as { url?: string; error?: string };
    if (!r.ok || !data.url) return setMsg(data.error ?? "No se pudo subir la imagen.");
    const alt = window.prompt("Describe la imagen (texto alternativo para accesibilidad):") ?? "";
    editor?.chain().focus().setImage({ src: data.url, alt }).run();
    setMsg(null);
  }

  return (
    <div className="border border-stone-200 bg-white">
      <input type="hidden" name={name} value={json} />
      {!disabled && editor && <Toolbar editor={editor} onImage={() => fileRef.current?.click()} />}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {msg && <p className="border-b border-stone-200 bg-amber-50 px-4 py-2 text-xs">{msg}</p>}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const B = ({ on, active, label, children }: { on: () => void; active?: boolean; label: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={on}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`min-w-8 rounded px-2 py-1 text-sm ${active ? "bg-navy-900 text-white" : "text-graphite hover:bg-stone-100"}`}
    >
      {children}
    </button>
  );
  const c = () => editor.chain().focus();
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-stone-200 bg-paper px-2 py-1.5">
      <B label="Negrita" on={() => c().toggleBold().run()} active={editor.isActive("bold")}><b>B</b></B>
      <B label="Cursiva" on={() => c().toggleItalic().run()} active={editor.isActive("italic")}><i>I</i></B>
      <span className="mx-1 h-5 w-px bg-stone-200" />
      <B label="Subtítulo" on={() => c().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>H2</B>
      <B label="Subtítulo menor" on={() => c().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>H3</B>
      <B label="Cita" on={() => c().toggleBlockquote().run()} active={editor.isActive("blockquote")}>❝</B>
      <B label="Lista" on={() => c().toggleBulletList().run()} active={editor.isActive("bulletList")}>•</B>
      <B label="Lista numerada" on={() => c().toggleOrderedList().run()} active={editor.isActive("orderedList")}>1.</B>
      <span className="mx-1 h-5 w-px bg-stone-200" />
      <B
        label="Enlace"
        active={editor.isActive("link")}
        on={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Dirección del enlace (vacío para quitarlo):", prev ?? "https://");
          if (url === null) return;
          if (url === "") return c().unsetLink().run();
          if (!/^https?:\/\//i.test(url)) return window.alert("El enlace debe empezar con https://");
          c().extendMarkRange("link").setLink({ href: url }).run();
        }}
      >
        🔗
      </B>
      <B label="Imagen" on={onImage}>🖼</B>
      <B
        label="Video de YouTube"
        on={() => {
          const url = window.prompt("Enlace del video de YouTube:");
          if (url && /youtu\.?be/.test(url)) c().setYoutubeVideo({ src: url }).run();
        }}
      >
        ▶
      </B>
      <B label="Separador" on={() => c().setHorizontalRule().run()}>—</B>
      <span className="mx-1 h-5 w-px bg-stone-200" />
      <B label="Deshacer" on={() => c().undo().run()}>↶</B>
      <B label="Rehacer" on={() => c().redo().run()}>↷</B>
    </div>
  );
}
