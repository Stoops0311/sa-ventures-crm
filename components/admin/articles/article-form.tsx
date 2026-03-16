"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TiptapEditor } from "@/components/shared/tiptap-editor"
import { ARTICLE_CATEGORIES } from "@/lib/constants"
import { toast } from "sonner"

interface ArticleFormProps {
  article?: {
    _id: Id<"articles">
    title: string
    body: string
    excerpt?: string
    category?: string
    tags?: string[]
    status: string
    coverImageStorageId?: Id<"_storage">
    coverImageUrl?: string | null
  }
}

export function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter()
  const createArticle = useMutation(api.articles.create)
  const updateArticle = useMutation(api.articles.update)
  const generateUploadUrl = useMutation(api.articles.generateUploadUrl)

  const [title, setTitle] = useState(article?.title ?? "")
  const [body, setBody] = useState(article?.body ?? "")
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "")
  const [category, setCategory] = useState(article?.category ?? "")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>(article?.tags ?? [])
  const [status, setStatus] = useState(article?.status ?? "draft")
  const [coverImageStorageId, setCoverImageStorageId] = useState<
    Id<"_storage"> | undefined
  >(article?.coverImageStorageId)
  const [coverPreview, setCoverPreview] = useState<string | null>(
    article?.coverImageUrl ?? null
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await generateUploadUrl()
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      const { storageId } = await result.json()
      setCoverImageStorageId(storageId as Id<"_storage">)
      setCoverPreview(URL.createObjectURL(file))
      toast.success("Cover image uploaded")
    } catch {
      toast.error("Failed to upload cover image")
    } finally {
      setUploading(false)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput("")
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!body.trim() || body === "<p></p>") {
      toast.error("Article body is required")
      return
    }

    setSaving(true)
    try {
      if (article) {
        await updateArticle({
          articleId: article._id,
          title: title.trim(),
          body,
          excerpt: excerpt.trim() || undefined,
          category: category || undefined,
          tags: tags.length > 0 ? tags : undefined,
          status,
          coverImageStorageId,
        })
        toast.success("Article updated")
      } else {
        await createArticle({
          title: title.trim(),
          body,
          excerpt: excerpt.trim() || undefined,
          category: category || undefined,
          tags: tags.length > 0 ? tags : undefined,
          status,
          coverImageStorageId,
        })
        toast.success("Article created")
        router.push("/admin/articles")
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save article"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Body *</Label>
            <TiptapEditor
              content={body}
              onChange={setBody}
              placeholder="Write your article..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Input
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary for listings (optional)"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border p-4">
            <h3 className="mb-4 font-semibold">Publishing</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving
                  ? "Saving..."
                  : article
                    ? "Update Article"
                    : "Create Article"}
              </Button>
            </div>
          </div>

          <div className="border p-4">
            <h3 className="mb-4 font-semibold">Cover Image</h3>
            {coverPreview && (
              <div className="mb-3 aspect-video overflow-hidden bg-muted">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              disabled={uploading}
            />
            {uploading && (
              <p className="mt-2 text-xs text-muted-foreground">
                Uploading...
              </p>
            )}
          </div>

          <div className="border p-4">
            <h3 className="mb-4 font-semibold">Category</h3>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ARTICLE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border p-4">
            <h3 className="mb-4 font-semibold">Tags</h3>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} &times;
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
