"use client"

import { ArticleForm } from "@/components/admin/articles/article-form"

export default function NewArticlePage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">New Article</h1>
      <ArticleForm />
    </div>
  )
}
