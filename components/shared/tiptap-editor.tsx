"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Underline } from "@tiptap/extension-underline"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { TaskList } from "@tiptap/extension-task-list"
import { TaskItem } from "@tiptap/extension-task-item"
import { Link as TiptapLink } from "@tiptap/extension-link"
import { Image as TiptapImage } from "@tiptap/extension-image"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useCallback, useState } from "react"

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

const COLORS = [
  "#000000",
  "#c23d22",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#6b7280",
]

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: TiptapEditorProps) {
  const [linkUrl, setLinkUrl] = useState("")

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0 [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li_label]:mt-0.5",
      },
    },
  })

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run()
    setLinkUrl("")
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt("Enter image URL:")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 p-1.5">
        {/* Headings */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs",
            editor.isActive("heading", { level: 1 }) && "bg-muted"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          H1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs",
            editor.isActive("heading", { level: 2 }) && "bg-muted"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs",
            editor.isActive("heading", { level: 3 }) && "bg-muted"
          )}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs font-bold",
            editor.isActive("bold") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs italic",
            editor.isActive("italic") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs underline",
            editor.isActive("underline") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
            >
              <span
                className="mr-1 inline-block h-3 w-3 border"
                style={{
                  backgroundColor:
                    (editor.getAttributes("textStyle").color as string) ??
                    "#000000",
                }}
              />
              Color
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-6 w-6 border hover:scale-110"
                  style={{ backgroundColor: color }}
                  onClick={() =>
                    editor.chain().focus().setColor(color).run()
                  }
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs",
            editor.isActive("bulletList") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs",
            editor.isActive("orderedList") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs",
            editor.isActive("taskList") && "bg-muted"
          )}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          Tasks
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Link */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-2 text-xs",
                editor.isActive("link") && "bg-muted"
              )}
            >
              Link
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3">
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addLink()
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={addLink}
              >
                Add
              </Button>
            </div>
            {editor.isActive("link") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-7 text-xs text-destructive"
                onClick={() => editor.chain().focus().unsetLink().run()}
              >
                Remove Link
              </Button>
            )}
          </PopoverContent>
        </Popover>

        {/* Image */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={addImage}
        >
          Image
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
