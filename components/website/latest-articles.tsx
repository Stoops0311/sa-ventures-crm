"use client"

import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ARTICLE_CATEGORIES } from "@/lib/constants"

export function LatestArticles() {
  const articles = useQuery(api.publicSite.listPublishedArticles, { limit: 3 })

  if (articles !== undefined && articles.length === 0) return null

  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Articles &amp; Tips
          </h2>
          <p className="mt-3 text-muted-foreground">
            Insights to help you make smarter property decisions
          </p>
        </div>

        {articles === undefined ? (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const categoryLabel =
                ARTICLE_CATEGORIES.find((c) => c.value === article.category)
                  ?.label ?? article.category

              return (
                <Link key={article._id} href={`/articles/${article.slug}`}>
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {article.coverImageUrl ? (
                        <Image
                          src={article.coverImageUrl}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-primary/5">
                          <span className="text-2xl font-bold text-primary/20">
                            SA
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      {categoryLabel && (
                        <Badge
                          variant="outline"
                          className="mb-2 text-xs text-primary"
                        >
                          {categoryLabel}
                        </Badge>
                      )}
                      <h3 className="line-clamp-2 text-base font-semibold group-hover:text-primary">
                        {article.title}
                      </h3>
                      {article.publishedAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {new Date(article.publishedAt).toLocaleDateString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {articles && articles.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/articles"
              className="text-sm font-medium text-primary hover:underline"
            >
              Read All Articles &rarr;
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
