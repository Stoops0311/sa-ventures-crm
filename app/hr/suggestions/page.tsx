"use client"

import { SuggestionList } from "@/components/hr/suggestions/suggestion-list"

export default function SuggestionsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Suggestion Box</h1>
      <SuggestionList />
    </div>
  )
}
