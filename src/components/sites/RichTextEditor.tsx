"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#00A0FF] hover:underline",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-2 text-[#CCCCCC]",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="h-[200px] bg-[#060606] border border-[#1A1A1A] rounded-lg flex items-center justify-center text-[#8A8A8A]">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="rich-text-editor border border-[#1A1A1A] rounded-lg overflow-hidden bg-[#060606]">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-[#1A1A1A] bg-[#0F0F0F]">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-[#1A1A1A] transition-colors ${
            editor.isActive("bold") ? "bg-[#1A1A1A] text-[#00A0FF]" : "text-[#8A8A8A]"
          }`}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-[#1A1A1A] transition-colors ${
            editor.isActive("italic") ? "bg-[#1A1A1A] text-[#00A0FF]" : "text-[#8A8A8A]"
          }`}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-[#1A1A1A] transition-colors ${
            editor.isActive("heading", { level: 1 }) ? "bg-[#1A1A1A] text-[#00A0FF]" : "text-[#8A8A8A]"
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-[#1A1A1A] transition-colors ${
            editor.isActive("heading", { level: 2 }) ? "bg-[#1A1A1A] text-[#00A0FF]" : "text-[#8A8A8A]"
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-[#1A1A1A] transition-colors ${
            editor.isActive("heading", { level: 3 }) ? "bg-[#1A1A1A] text-[#00A0FF]" : "text-[#8A8A8A]"
          }`}
          title="Heading 3"
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-[#1A1A1A] transition-colors ${
            editor.isActive("bulletList") ? "bg-[#1A1A1A] text-[#00A0FF]" : "text-[#8A8A8A]"
          }`}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-[#1A1A1A] transition-colors ${
            editor.isActive("orderedList") ? "bg-[#1A1A1A] text-[#00A0FF]" : "text-[#8A8A8A]"
          }`}
          title="Numbered List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </button>
        <button
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-2 rounded hover:bg-[#1A1A1A] transition-colors ${
            editor.isActive("link") ? "bg-[#1A1A1A] text-[#00A0FF]" : "text-[#8A8A8A]"
          }`}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
      </div>
      {/* Editor */}
      <EditorContent editor={editor} />
      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          outline: none;
        }
        .rich-text-editor .ProseMirror p {
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror a {
          color: #00A0FF;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
