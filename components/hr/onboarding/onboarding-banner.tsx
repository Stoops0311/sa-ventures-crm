"use client"

import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

type Props = {
  completedCount: number
  totalItems: number
  remainingItems: string[]
  onboardingHref: string
}

export function OnboardingBanner({
  completedCount,
  totalItems,
  remainingItems,
  onboardingHref,
}: Props) {
  return (
    <Alert className="border-l-4 border-l-primary bg-primary/5 border-primary/20">
      <AlertTitle className="font-sans font-semibold">
        Complete Your Onboarding
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-muted-foreground">
          You have {totalItems - completedCount} of {totalItems} items
          remaining. Please complete your personal information to finish
          onboarding.
        </p>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {completedCount} of {totalItems} complete
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${(completedCount / totalItems) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Remaining items */}
        {remainingItems.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Remaining:</p>
            <ul className="space-y-0.5">
              {remainingItems.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        )}

        <Button size="sm" asChild>
          <Link href={onboardingHref}>Complete Onboarding</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
