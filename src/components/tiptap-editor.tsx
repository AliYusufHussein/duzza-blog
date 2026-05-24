import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function textToHtml(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  // If already looks like HTML, pass through
  if (/^\s*<(p|h[1-6]|ul|ol|blockquote|hr|div)[\s>]/i.test(trimmed)) {
    return trimmed;
  }
  // Convert plain text to paragraphs, preserving blank-line splits.
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${escape(block).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function ToolbarBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-transparent text-[#f0ede8]/70 hover:bg-white/5 hover:text-[#f0ede8]"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1.5">
      <ToolbarBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolbarBtn>
      <ToolbarBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolbarBtn>
      <div className="mx-1 h-5 w-px bg-[#2a2a2a]" />
      <ToolbarBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </ToolbarBtn>
      <ToolbarBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarBtn>
      <ToolbarBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarBtn>
      <div className="mx-1 h-5 w-px bg-[#2a2a2a]" />
      <ToolbarBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </ToolbarBtn>
      <ToolbarBtn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </ToolbarBtn>
      <ToolbarBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </ToolbarBtn>
      <ToolbarBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ―
      </ToolbarBtn>
      <div className="mx-1 h-5 w-px bg-[#2a2a2a]" />
      <ToolbarBtn title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolbarBtn>
      <ToolbarBtn title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolbarBtn>
    </div>
  );
}

export function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
  const lastEmitted = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing..." }),
    ],
    content: textToHtml(value),
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[300px] w-full max-w-none px-4 py-3 text-[14px] leading-relaxed text-[#f0ede8] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // When value changes externally (e.g. platform switch, regenerate), reset content.
  useEffect(() => {
    if (!editor) return;
    const incoming = textToHtml(value);
    if (incoming !== lastEmitted.current && incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
      lastEmitted.current = incoming;
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#141414]">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
