"use client"

import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ARTICLE_CATEGORIES } from "@/lib/constants"

export default function ArticlesPage() {
  const articles = useQuery(api.publicSite.listPublishedArticles, {})

  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Articles &amp; Tips
          </h1>
          <p className="mt-3 text-muted-foreground">
            Insights and guides to help you navigate the real estate market
          </p>
        </div>

        {articles === undefined ? (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Articles coming soon. Check back later!
            </p>
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
                      <h2 className="line-clamp-2 text-base font-semibold group-hover:text-primary">
                        {article.title}
                      </h2>
                      {article.excerpt && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {article.excerpt}
                        </p>
                      )}
                      {article.publishedAt && (
                        <p className="mt-3 text-xs text-muted-foreground">
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
      </div>
    </div>
  )
}
