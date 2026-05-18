import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

const TOOLBAR_BTNS = [
  { cmd: 'toggleBold',        icon: 'B',  title: 'Bold (Ctrl+B)',   active: e => e.isActive('bold')        },
  { cmd: 'toggleItalic',      icon: 'I',  title: 'Italic (Ctrl+I)', active: e => e.isActive('italic'),  italic: true },
  { cmd: 'toggleStrike',      icon: 'S̶',  title: 'Strike',          active: e => e.isActive('strike')      },
  { sep: true },
  { cmd: 'toggleBulletList',  icon: '≡',  title: 'Lista',           active: e => e.isActive('bulletList')  },
  { cmd: 'toggleOrderedList', icon: '1.', title: 'Numerirana lista', active: e => e.isActive('orderedList') },
  { sep: true },
  { cmd: 'toggleHeading1',    icon: 'H1', title: 'Naslov 1',        active: e => e.isActive('heading', { level: 1 }), heading: 1 },
  { cmd: 'toggleHeading2',    icon: 'H2', title: 'Naslov 2',        active: e => e.isActive('heading', { level: 2 }), heading: 2 },
  { sep: true },
  { cmd: 'toggleBlockquote',  icon: '"',  title: 'Citat',           active: e => e.isActive('blockquote')  },
  { cmd: 'toggleCodeBlock',   icon: '<>', title: 'Kod',             active: e => e.isActive('codeBlock')   },
]

export default function RichEditor({ content, onChange, placeholder = 'Počni pisati...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 120px; font-family: DM Sans, sans-serif; font-size: 14px; line-height: 1.75; color: var(--text-2, #6b6860);',
      },
    },
  })

  // Sync external content changes (e.g. OCR)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (content !== current) {
      editor.commands.setContent(content || '')
    }
  }, [content])

  if (!editor) return null

  const run = (btn) => {
    if (btn.heading) {
      editor.chain().focus().toggleHeading({ level: btn.heading }).run()
    } else {
      editor.chain().focus()[btn.cmd]().run()
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2,
        padding: '6px 8px', background: 'var(--bg, #f7f6f3)',
        borderRadius: '8px', marginBottom: 10,
        border: '1px solid var(--border, #e8e6e1)',
      }}>
        {TOOLBAR_BTNS.map((btn, i) => {
          if (btn.sep) return (
            <div key={i} style={{ width: 1, height: 18, background: 'var(--border, #e8e6e1)', margin: '0 4px' }} />
          )
          const isActive = btn.active(editor)
          return (
            <button key={i} onClick={() => run(btn)} title={btn.title}
              style={{
                padding: '4px 8px', border: 'none', borderRadius: 6, cursor: 'pointer',
                background: isActive ? 'var(--blue, #2563eb)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-2, #6b6860)',
                fontSize: 13, fontWeight: btn.italic ? 'normal' : 500,
                fontStyle: btn.italic ? 'italic' : 'normal',
                fontFamily: 'DM Sans, sans-serif',
                minWidth: 28, textAlign: 'center',
                transition: 'all .1s',
              }}>
              {btn.icon}
            </button>
          )
        })}
      </div>

      {/* Editor */}
      <div style={{ padding: '4px 0' }}>
        <style>{`
          .ProseMirror p { margin: 0 0 8px; }
          .ProseMirror ul, .ProseMirror ol { padding-left: 20px; margin: 0 0 8px; }
          .ProseMirror li { margin-bottom: 4px; }
          .ProseMirror h1 { font-size: 20px; font-weight: 500; margin: 0 0 8px; color: var(--text-1, #1a1916); }
          .ProseMirror h2 { font-size: 17px; font-weight: 500; margin: 0 0 8px; color: var(--text-1, #1a1916); }
          .ProseMirror blockquote { border-left: 3px solid var(--blue, #2563eb); padding-left: 12px; margin: 0 0 8px; color: var(--text-3, #a8a59f); }
          .ProseMirror code { background: var(--bg, #f7f6f3); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
          .ProseMirror pre { background: var(--bg, #f7f6f3); padding: 10px; border-radius: 8px; margin: 0 0 8px; }
          .ProseMirror strong { font-weight: 500; color: var(--text-1, #1a1916); }
          .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--text-3, #a8a59f); pointer-events: none; float: left; height: 0; }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
