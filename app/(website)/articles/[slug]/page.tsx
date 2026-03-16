"use client"

import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ARTICLE_CATEGORIES } from "@/lib/constants"

export default function ArticleDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const article = useQuery(api.publicSite.getArticleBySlug, { slug })

  if (article === undefined) {
    return (
      <div className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="mt-8 h-8 w-96" />
          <Skeleton className="mt-4 h-96 w-full" />
        </div>
      </div>
    )
  }

  if (article === null) {
    return (
      <div className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Article Not Found</h1>
          <p className="mt-3 text-muted-foreground">
            This article may have been removed or the URL is incorrect.
          </p>
          <Link
            href="/articles"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            &larr; Back to Articles
          </Link>
        </div>
      </div>
    )
  }

  const categoryLabel =
    ARTICLE_CATEGORIES.find((c) => c.value === article.category)?.label ??
    article.category

  return (
    <article className="bg-white">
      {/* Cover */}
      {article.coverImageUrl && (
        <div className="relative h-64 overflow-hidden bg-muted sm:h-80 lg:h-96">
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3">
          {categoryLabel && (
            <Badge variant="outline" className="text-xs text-primary">
              {categoryLabel}
            </Badge>
          )}
          {article.publishedAt && (
            <span className="text-sm text-muted-foreground">
              {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            by {article.authorName}
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Body */}
        <div
          className="prose prose-sm mt-10 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-img:max-w-full [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Back */}
        <div className="mt-16 border-t pt-8">
          <Link
            href="/articles"
            className="text-sm font-medium text-primary hover:underline"
          >
            &larr; Back to Articles
          </Link>
        </div>
      </div>
    </article>
  )
}
