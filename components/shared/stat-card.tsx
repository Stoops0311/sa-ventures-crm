"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  substat,
  substatColor,
  onClick,
  className,
}: {
  label: string
  value: number | string
  substat?: string
  substatColor?: string
  onClick?: () => void
  className?: string
}) {
  const Comp = onClick ? "button" : "div"
  return (
    <Card
      className={cn(
        "transition-colors duration-1000",
        onClick && "cursor-pointer hover:bg-muted/50",
        className
      )}
    >
      <CardContent className="p-4">
        <Comp
          onClick={onClick}
          className={cn(onClick && "w-full text-left")}
        >
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-sans text-3xl font-bold tabular-nums mt-1">
            {value}
          </p>
          {substat && (
            <p
              className={cn(
                "text-[10px] mt-1",
                substatColor ?? "text-muted-foreground"
              )}
            >
              {substat}
            </p>
          )}
        </Comp>
      </CardContent>
    </Card>
  )
}
