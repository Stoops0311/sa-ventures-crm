"use client"

import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getArticleStatusStyle, ARTICLE_CATEGORIES } from "@/lib/constants"
import { toast } from "sonner"

interface ArticlesTableProps {
  statusFilter?: string
}

export function ArticlesTable({ statusFilter }: ArticlesTableProps) {
  const articles = useQuery(api.articles.list, {
    status: statusFilter,
  })
  const removeArticle = useMutation(api.articles.remove)

  const handleDelete = async (articleId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      await removeArticle({ articleId: articleId as never })
      toast.success("Article deleted")
    } catch {
      toast.error("Failed to delete article")
    }
  }

  if (articles === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No articles found.
      </div>
    )
  }

  return (
    <div className="border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => {
            const statusStyle = getArticleStatusStyle(article.status)
            const categoryLabel =
              ARTICLE_CATEGORIES.find((c) => c.value === article.category)
                ?.label ?? article.category

            return (
              <TableRow key={article._id}>
                <TableCell>
                  <Link
                    href={`/admin/articles/${article._id}`}
                    className="font-medium hover:text-primary"
                  >
                    {article.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                  >
                    {statusStyle.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {categoryLabel || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {article.authorName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(article.createdAt).toLocaleDateString("en-IN")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/articles/${article._id}`}>Edit</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        handleDelete(article._id, article.title)
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
