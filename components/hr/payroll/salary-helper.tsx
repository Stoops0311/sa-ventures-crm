"use client"

export function SalaryHelper({
  components,
}: {
  components: { name: string; type: string; amount: number }[]
}) {
  const basic = components.find((c) => c.name === "Basic")?.amount ?? 0
  const gross = components
    .filter((c) => c.type === "earning")
    .reduce((s, c) => s + c.amount, 0)
  const hints: { label: string; value: string }[] = []

  if (basic > 0) {
    hints.push({
      label: "40% of Basic (HRA guidance)",
      value: `\u20B9${Math.round(basic * 0.4).toLocaleString("en-IN")}`,
    })
    hints.push({
      label: "12% of Basic (PF guidance)",
      value: `\u20B9${Math.round(basic * 0.12).toLocaleString("en-IN")}`,
    })
  }
  if (gross > 0 && gross <= 21000) {
    hints.push({
      label: "0.75% of Gross (ESI guidance)",
      value: `\u20B9${Math.round(gross * 0.0075).toLocaleString("en-IN")}`,
    })
  }
  if (hints.length === 0) return null

  return (
    <div className="mt-2 p-2 bg-muted/50 border text-xs text-muted-foreground space-y-0.5">
      <p className="font-medium text-foreground">Advisory calculations</p>
      {hints.map((h) => (
        <p key={h.label}>
          {h.label}:{" "}
          <span className="font-mono font-medium text-foreground">
            {h.value}
          </span>
        </p>
      ))}
    </div>
  )
}
