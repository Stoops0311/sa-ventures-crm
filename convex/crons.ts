import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// Clean up expired temporary vehicles every hour
crons.interval(
  "cleanup temporary vehicles",
  { hours: 1 },
  internal.vehicles.cleanupTemporary
)

// Process scheduled messages every minute
crons.interval(
  "process scheduled messages",
  { minutes: 1 },
  internal.messaging.processScheduledMessages
)

// Auto-close stale breaks (forgotten/browser closed) every 15 minutes
crons.interval(
  "cleanup stale breaks",
  { minutes: 15 },
  internal.breakTime.cleanupStaleBreaks
)

export default crons
