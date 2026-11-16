// CAD Allowance admission (ported from Sanitube; plan B7).
//
// Visitor order (the Standard Range is checked by the route before this):
//   1. Business Email: ≥ 10 counted requests in the rolling 30 days → block
//   2. IP (trusted source only): ≥ 5 counted requests in the rolling 24 h → block
//   3. Ready package for the current cache key → serve_cached (free)
//   4. Part Number ever generated, or a package row already claimed for this cache key →
//      generate, not counted (free)
//   5. Today's counted generations < cap → generate, counted (the slot is reserved now by creating
//      the package row); else → queue
// Logged-in customers skip 1, 2 and 5 and never count against the cap.
//
// The cap check (3–5) runs under an in-process mutex so two requests cannot both take the last
// slot (single backend container).

import { CPQ_TABLES_HASH, type BuilderType, type Options } from "../cpq-shared"
import { DRAWING_VERSION } from "../cpq-shared/drawing"
import { CAD_REQUEST_MODULE } from "../../modules/cad-request"
import type CadRequestModuleService from "../../modules/cad-request/service"
import {
  CAD_EMAIL_ALLOWANCE,
  CAD_EMAIL_WINDOW_MS,
  CAD_IP_DAILY_LIMIT,
  CAD_IP_WINDOW_MS,
  type CadBlockReason,
  type CadIpSource,
} from "../../modules/cad-request/types"
import { capDayFor } from "./business-day"
import { CAD_GENERATOR_VERSION, cadCacheKey } from "./cache-key"

type Container = { resolve: <T = any>(key: string) => T }

/** The subset of the module service admission uses (fakeable in tests). */
export type AdmissionService = Pick<
  CadRequestModuleService,
  | "getSettings"
  | "countEmailRequests"
  | "countIpRequests"
  | "countCapGenerations"
  | "everGenerated"
  | "findReadyPackage"
  | "findPackageByCacheKey"
  | "createCadPackages"
>

export type AdmissionInput = {
  builderType: BuilderType
  options: Options
  partNumber: string
  isCustomer: boolean
  email: string | null
  ip: string | null
  ipSource: CadIpSource | null
  now: Date
}

export type AdmissionOutcome = "generate" | "serve_cached" | "queue" | "block"

export type AdmissionResult = {
  outcome: AdmissionOutcome
  blockReason?: CadBlockReason
  countAgainstCap: boolean
  capDay: string
  /** Set when a cap slot was reserved (the claimed CadPackage row). */
  reservedPackageId?: string
  /** For staff alerts / logs. */
  counters?: { emailRequests30d?: number; ipRequests24h?: number; generatedToday?: number; cap?: number }
}

export const CAD_ALLOWANCE_MESSAGES: Record<CadBlockReason, string> = {
  email_allowance:
    "This email has reached its limit of 10 CAD requests in 30 days. We've let our engineering team know, and they'll be in touch.",
  ip_daily: "Too many CAD requests from this network today. Please try again tomorrow, or request a quote.",
}

/** Only the storefront-proven client IP is trusted for the per-IP limit. */
export function isTrustedIpSource(source: CadIpSource | null | undefined): boolean {
  return source === "forwarded" || source === "cf"
}

let capLock: Promise<unknown> = Promise.resolve()
function withCapLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = capLock.catch(() => undefined).then(fn)
  capLock = run.catch(() => undefined)
  return run
}

export async function admitCadRequest(container: Container, input: AdmissionInput): Promise<AdmissionResult> {
  const service = container.resolve<AdmissionService>(CAD_REQUEST_MODULE)
  const { now, partNumber } = input
  const capDay = capDayFor(now)
  const cacheKey = cadCacheKey(partNumber)

  if (input.isCustomer) {
    const ready = await service.findReadyPackage(cacheKey)
    return { outcome: ready ? "serve_cached" : "generate", countAgainstCap: false, capDay }
  }

  // 1. Business Email allowance.
  const email = (input.email ?? "").trim().toLowerCase()
  const emailRequests30d = email ? await service.countEmailRequests(email, new Date(now.getTime() - CAD_EMAIL_WINDOW_MS)) : 0
  if (emailRequests30d >= CAD_EMAIL_ALLOWANCE) {
    return { outcome: "block", blockReason: "email_allowance", countAgainstCap: false, capDay, counters: { emailRequests30d } }
  }

  // 2. IP limit, only for an IP from a trusted source.
  let ipRequests24h: number | undefined
  if (input.ip && isTrustedIpSource(input.ipSource)) {
    ipRequests24h = await service.countIpRequests(input.ip, new Date(now.getTime() - CAD_IP_WINDOW_MS))
    if (ipRequests24h >= CAD_IP_DAILY_LIMIT) {
      return {
        outcome: "block",
        blockReason: "ip_daily",
        countAgainstCap: false,
        capDay,
        counters: { emailRequests30d, ipRequests24h },
      }
    }
  }

  return withCapLock(async () => {
    // 3. Already generated for the current tables/generator/drawing.
    if (await service.findReadyPackage(cacheKey)) {
      return { outcome: "serve_cached" as const, countAgainstCap: false, capDay, counters: { emailRequests30d, ipRequests24h } }
    }
    // 4. Free: ever generated (any version), or a generation already claimed.
    if ((await service.everGenerated(partNumber)) || (await service.findPackageByCacheKey(cacheKey))) {
      return { outcome: "generate" as const, countAgainstCap: false, capDay, counters: { emailRequests30d, ipRequests24h } }
    }
    // 5. Site-wide cap of never-generated Part Numbers per Eastern day.
    const settings = await service.getSettings()
    const cap = Number(settings.daily_generation_cap)
    const generatedToday = await service.countCapGenerations(capDay)
    const counters = { emailRequests30d, ipRequests24h, generatedToday, cap }
    if (generatedToday >= cap) {
      return { outcome: "queue" as const, countAgainstCap: false, capDay, counters }
    }
    const row = await service.createCadPackages({
      part_number: partNumber,
      cache_key: cacheKey,
      builder_type: input.builderType,
      configuration: input.options as Record<string, unknown>,
      tables_hash: CPQ_TABLES_HASH,
      generator_version: CAD_GENERATOR_VERSION,
      drawing_version: DRAWING_VERSION,
      status: "generating",
      counted_against_cap: true,
      cap_day: capDay,
    })
    return {
      outcome: "generate" as const,
      countAgainstCap: true,
      capDay,
      reservedPackageId: (row as any)?.id,
      counters: { ...counters, generatedToday: generatedToday + 1 },
    }
  })
}
