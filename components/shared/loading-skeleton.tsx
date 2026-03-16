"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-9 w-16 mb-1" />
        <Skeleton className="h-2.5 w-20" />
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 px-4 py-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FollowUpCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-48 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function LeadDetailSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-6 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HRDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} cols={4} />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function EmployeeDirectorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-40" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-24" />
      </div>
      <TableSkeleton rows={8} cols={7} />
    </div>
  )
}

export function EmployeeDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" />
      <div className="flex items-start gap-6 pb-6 border-b">
        <Skeleton className="size-16 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-40" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-b py-3 px-2 space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j}>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function OnboardingQueueSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>
      <TableSkeleton rows={6} cols={6} />
    </div>
  )
}

export function SelfServiceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}

export function OnboardingFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <div>
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-96 mb-3" />
        <Skeleton className="h-1.5 w-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: i === 1 ? 3 : 6 }).map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    </div>
  )
}
