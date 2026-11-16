// Hourly CAD Request queue job (ported from Sanitube; plan B7).
//
// Each run, in order:
//   1. Release every Queued request whose release time has passed: 09:00 America/New_York on the
//      next business day after it was queued (Mon–Fri; US holidays are NOT skipped). Released
//      requests do not count against the site-wide cap.
//   2. Retry failed requests with attempts < 3 (oldest first, max 10 per run).
//   3. Re-run pending requests older than 10 minutes (a lost cad_request.created event).
//
// CAD Review (R5, R11): while `require_review` is on, steps 1–3 generate and then stop at status
// "review" (the shared pending path in the subscriber does that); the requester gets no link until
// staff approve. A failed request already approved goes on to send.
//
// The job processes requests directly (same functions as the subscriber) rather than emitting
// cad_request.released, so it works even when the event bus dropped something.

import type {MedusaContainer} from "@medusajs/framework/types"
import {nextReleaseAt} from "../lib/cad/business-day"
import {
  MAX_ATTEMPTS,
  buildCadProcessDeps,
  releaseCadRequest,
  retryCadRequest,
  type CadProcessDeps,
  type ProcessOutcome,
} from "../subscribers/cad-request-process"

export const RETRY_BATCH = 10
export const STALE_PENDING_MS = 10 * 60 * 1000

export type CadQueueDeps = CadProcessDeps & {
  nextReleaseAt(queuedAt: Date): Date
}

export type CadQueueRunResult = {
  released: {id: string; outcome: ProcessOutcome}[]
  retried: {id: string; outcome: ProcessOutcome}[]
  recovered: {id: string; outcome: ProcessOutcome}[]
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** True once 09:00 Eastern on the next business day after `queuedAt` has passed. */
export function isQueuedRequestDue(
  deps: Pick<CadQueueDeps, "nextReleaseAt">,
  queuedAt: Date | string | null | undefined,
  now: Date,
): boolean {
  const q = toDate(queuedAt)
  if (!q) return true // queued without a timestamp: don"t strand it
  return deps.nextReleaseAt(q).getTime() <= now.getTime()
}

export async function processCadQueue(
  deps: CadQueueDeps,
  now: Date = deps.now(),
): Promise<CadQueueRunResult> {
  const result: CadQueueRunResult = {released: [], retried: [], recovered: []}

  // 1. Queued → released. listQueuedDue applies the release rule; the re-check here
  // keeps the job correct even if the service returns every queued row.
  const due = (await deps.cad.listQueuedDue(now)).filter(
    (r) => r.status === "queued" && isQueuedRequestDue(deps, r.queued_at, now),
  )
  for (const r of due) {
    try {
      result.released.push({id: r.id, outcome: await releaseCadRequest(deps, r.id, "auto")})
    } catch (err) {
      deps.logger.error(`[cad] queue release failed for ${r.id}: ${(err as Error).message}`)
    }
  }

  // 2. Failed → retry (attempts < 3, oldest first, at most 10 per run).
  const failed = (
    await deps.cad.listCadRequests(
      {status: "failed"},
      {order: {created_at: "ASC"}, take: 100},
    )
  )
    .filter((r) => (r.attempts ?? 0) < MAX_ATTEMPTS)
    .slice(0, RETRY_BATCH)
  for (const r of failed) {
    try {
      result.retried.push({id: r.id, outcome: await retryCadRequest(deps, r.id)})
    } catch (err) {
      deps.logger.error(`[cad] retry failed for ${r.id}: ${(err as Error).message}`)
    }
  }

  // 3. Pending for more than 10 minutes → the subscriber never ran.
  const cutoff = now.getTime() - STALE_PENDING_MS
  const stale = (
    await deps.cad.listCadRequests(
      {status: "pending", created_at: {$lt: new Date(cutoff)}},
      {order: {created_at: "ASC"}, take: 50},
    )
  ).filter((r) => {
    const created = toDate(r.created_at)
    return !created || created.getTime() < cutoff
  })
  for (const r of stale) {
    try {
      result.recovered.push({id: r.id, outcome: await retryCadRequest(deps, r.id)})
    } catch (err) {
      deps.logger.error(`[cad] pending recovery failed for ${r.id}: ${(err as Error).message}`)
    }
  }

  const total = result.released.length + result.retried.length + result.recovered.length
  if (total) {
    deps.logger.info(
      `[cad] queue job: released ${result.released.length}, retried ${result.retried.length}, recovered ${result.recovered.length}`,
    )
  }
  return result
}

export default async function processCadQueueJob(container: MedusaContainer) {
  const deps: CadQueueDeps = {...buildCadProcessDeps(container), nextReleaseAt}
  try {
    await processCadQueue(deps)
  } catch (err) {
    deps.logger.error(`[cad] queue job failed: ${(err as Error).message}`)
  }
}

export const config = {
  name: "process-cad-queue",
  schedule: "0 * * * *",
}
