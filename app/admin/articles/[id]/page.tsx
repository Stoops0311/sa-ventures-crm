"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { ArticleForm } from "@/components/admin/articles/article-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditArticlePage() {
  const params = useParams()
  const articleId = params.id as Id<"articles">
  const article = useQuery(api.articles.getById, { articleId })

  if (article === undefined) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (article === null) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Article not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Edit Article</h1>
      <ArticleForm article={article} />
    </div>
  )
}
