import type { Editor } from '@tiptap/react'
import {
    Bold, Italic, Underline, Strikethrough, Code, Link2, Image,
    List, ListOrdered, Quote, Undo, Redo, Heading1, Heading2, AlignLeft,
    AlignCenter, AlignRight, Minus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ToolbarButtonProps {
    onClick: () => void
    active?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
    return (
        <Button
            type         = "button"
            variant      = "ghost"
            size         = "icon"
            className    = {cn('h-7 w-7', active && 'bg-accent text-accent-foreground')}
            onClick      = {onClick}
            disabled     = {disabled}
            title        = {title}
        >
            {children}
        </Button>
    )
}

interface EditorToolbarProps {
    editor: Editor
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
    function addLink() {
        const url = window.prompt('URL du lien :')
        if (url) {
            editor.chain().focus().setLink({ href: url }).run()
        }
    }

    function addImage() {
        const url = window.prompt("URL de l'image :")
        if (url) {
            editor.chain().focus().setImage({ src: url }).run()
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler">
                <Undo className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refaire">
                <Redo className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-5" />

            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                active     = {editor.isActive('heading', { level: 1 })}
                title      = "Titre 1"
            >
                <Heading1 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active     = {editor.isActive('heading', { level: 2 })}
                title      = "Titre 2"
            >
                <Heading2 className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-5" />

            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleBold().run()}
                active     = {editor.isActive('bold')}
                title      = "Gras"
            >
                <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleItalic().run()}
                active     = {editor.isActive('italic')}
                title      = "Italique"
            >
                <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleUnderline().run()}
                active     = {editor.isActive('underline')}
                title      = "Souligné"
            >
                <Underline className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleStrike().run()}
                active     = {editor.isActive('strike')}
                title      = "Barré"
            >
                <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleCode().run()}
                active     = {editor.isActive('code')}
                title      = "Code inline"
            >
                <Code className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-5" />

            <ToolbarButton
                onClick    = {() => editor.chain().focus().setTextAlign('left').run()}
                active     = {editor.isActive({ textAlign: 'left' })}
                title      = "Aligner à gauche"
            >
                <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().setTextAlign('center').run()}
                active     = {editor.isActive({ textAlign: 'center' })}
                title      = "Centrer"
            >
                <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().setTextAlign('right').run()}
                active     = {editor.isActive({ textAlign: 'right' })}
                title      = "Aligner à droite"
            >
                <AlignRight className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-5" />

            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleBulletList().run()}
                active     = {editor.isActive('bulletList')}
                title      = "Liste à puces"
            >
                <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleOrderedList().run()}
                active     = {editor.isActive('orderedList')}
                title      = "Liste numérotée"
            >
                <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().toggleBlockquote().run()}
                active     = {editor.isActive('blockquote')}
                title      = "Citation"
            >
                <Quote className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
                onClick    = {() => editor.chain().focus().setHorizontalRule().run()}
                title      = "Séparateur horizontal"
            >
                <Minus className="h-3.5 w-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-5" />

            <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Insérer un lien">
                <Link2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton onClick={addImage} title="Insérer une image">
                <Image className="h-3.5 w-3.5" />
            </ToolbarButton>
        </div>
    )
}
