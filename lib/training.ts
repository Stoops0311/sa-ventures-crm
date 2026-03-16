export const TRAINING_DAYS = [
  {
    day: 1,
    title: "Foundation Module",
    description:
      "Real estate basics, property types, SA Ventures operations, pricing, sales formulas, calling scripts, and office policies.",
    available: true,
  },
  {
    day: 2,
    title: "Day 2",
    description: "Coming soon.",
    available: false,
  },
  {
    day: 3,
    title: "Day 3",
    description: "Coming soon.",
    available: false,
  },
  {
    day: 4,
    title: "Day 4",
    description: "Coming soon.",
    available: false,
  },
  {
    day: 5,
    title: "Day 5",
    description: "Coming soon.",
    available: false,
  },
  {
    day: 6,
    title: "Day 6",
    description: "Coming soon.",
    available: false,
  },
  {
    day: 7,
    title: "Day 7",
    description: "Coming soon.",
    available: false,
  },
] as const

export type TrainingDay = (typeof TRAINING_DAYS)[number]
export const TOTAL_TRAINING_DAYS = TRAINING_DAYS.length
