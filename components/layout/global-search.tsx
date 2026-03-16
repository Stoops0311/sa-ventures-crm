"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useDebounce } from "@/hooks/use-debounce"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserMultipleIcon } from "@hugeicons/core-free-icons"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()
  const debouncedQuery = useDebounce(query, 300)

  // Only search if query is at least 2 characters
  const searchResults = useQuery(
    api.leads.search,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip"
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    },
    []
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  function handleSelect(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search leads, projects, and more."
    >
      <CommandInput
        placeholder="Search leads by name or phone..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {debouncedQuery.length < 2 ? (
          <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
        ) : searchResults === undefined ? (
          <CommandEmpty>Searching...</CommandEmpty>
        ) : searchResults.length === 0 ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <CommandGroup heading="Leads">
            {searchResults.map((lead: { _id: string; name: string; mobileNumber: string; status: string }) => (
              <CommandItem
                key={lead._id}
                value={`${lead.name} ${lead.mobileNumber}`}
                onSelect={() => handleSelect(`/admin/leads?id=${lead._id}`)}
              >
                <HugeiconsIcon
                  icon={UserMultipleIcon}
                  strokeWidth={2}
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-xs font-medium">{lead.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {lead.mobileNumber} &middot; {lead.status}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
