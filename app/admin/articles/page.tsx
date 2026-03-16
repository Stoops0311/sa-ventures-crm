"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArticlesTable } from "@/components/admin/articles/articles-table"

export default function AdminArticlesPage() {
  const [tab, setTab] = useState("all")

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Button asChild>
          <Link href="/admin/articles/new">New Article</Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <ArticlesTable />
        </TabsContent>
        <TabsContent value="draft">
          <ArticlesTable statusFilter="draft" />
        </TabsContent>
        <TabsContent value="published">
          <ArticlesTable statusFilter="published" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
