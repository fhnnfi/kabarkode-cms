"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Check, Copy } from "lucide-react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

/** Code block dengan header + tombol Copy (redesign §41). */
function CodeBlockView({ editor, node }: { editor: Editor; node: { textContent: string } }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(node.textContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [node.textContent]);
  return (
    <NodeViewWrapper as="div" className="code-block-view my-3 overflow-hidden rounded-lg">
      <div className="flex items-center justify-between bg-neutral-800 px-3 py-1.5">
        <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
          Code
        </span>
        <button
          type="button"
          onClick={copy}
          disabled={!editor.isEditable}
          aria-label="Copy code"
          className="kk-transition flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-neutral-300 hover:bg-neutral-700 hover:text-white"
        >
          {copied ? <Check className="size-3 text-brand" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {/* Tiptap mendeklarasikan `as` sempit (hanya "div"); "pre" valid secara runtime. */}
      <NodeViewContent as={"pre" as "div"} className="!mt-0 !rounded-none" />
    </NodeViewWrapper>
  );
}

const CodeBlockWithCopy = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  editable?: boolean;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn("size-8", active && "bg-muted text-foreground")}
      onMouseDown={(e) => e.preventDefault() /* jangan kehilangan fokus editor */}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    try {
      // validasi dasar + tolak skrip URL (javascript:, data:) sebelum apply
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:" && u.protocol !== "mailto:") {
        toast.error("Hanya URL http/https/mailto yang diizinkan");
        return;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
    } catch {
      toast.error("URL tidak valid");
    }
  }

  return (
    <div className="kk-transition flex flex-wrap items-center gap-0.5 border-b bg-card p-1.5">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic />
      </ToolbarButton>
      <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="text-sm font-semibold underline">U</span>
      </ToolbarButton>
      <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 />
      </ToolbarButton>
      <ToolbarButton label="Paragraf" active={!editor.isActive("heading")} onClick={() => editor.chain().focus().setParagraph().run()}>
        <span className="text-xs font-semibold">¶</span>
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List />
      </ToolbarButton>
      <ToolbarButton label="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote />
      </ToolbarButton>
      <ToolbarButton label="Code inline" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code />
      </ToolbarButton>
      <ToolbarButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <span className="text-[10px] font-bold">{"</>"}</span>
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton label="Sisipkan tautan" active={editor.isActive("link")} onClick={setLink}>
        <Link2 />
      </ToolbarButton>
      <ToolbarButton label="Hapus tautan" onClick={() => editor.chain().focus().unsetLink().run()}>
        <Unlink />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 />
      </ToolbarButton>
    </div>
  );
}

/**
 * Adapter editor (requirement §23): komponen luar hanya mengenal
 * value/onChange HTML — implementasi Tiptap terisolasi di sini.
 */
export function RichTextEditor({ value, onChange, onBlur, editable = true }: RichTextEditorProps) {
  // Ref ke callback terbaru: onUpdate/onBlur dibuat sekali saat editor dibuat,
  // tanpa ref closure-nya basi dan perubahan tidak tersimpan.
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  });

  const editor = useEditor({
    // SSR/Next.js: JANGAN render editor di server — tanpa ini, hidrasi bisa
    // mismatch dan ProseMirror tidak pernah memasang event handler di browser
    // (gejala: editor tampil tapi tidak bisa diketik sama sekali).
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: false }),
      CodeBlockWithCopy.configure({ lowlight }),
      Placeholder.configure({ placeholder: "Tulis artikel di sini…" }),
    ],
    content: value,
    editable,
    editorProps: {
      attributes: {
        class:
          "tiptap-content min-h-[400px] max-w-none px-4 py-3 focus:outline-none text-[15px] leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getHTML()),
    onBlur: () => onBlurRef.current?.(),
  });

  // Prop editable berubah setelah mount (mis. saat mutasi busy) — sinkronkan.
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {editor && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
