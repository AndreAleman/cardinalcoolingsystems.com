// In-memory fakes for the CAD Request subscriber / queue job tests. Not a test file itself (no
// .unit.spec), and __tests__ is skipped by Medusa's subscriber loader.

import { getBuilder } from "../../lib/cpq-shared"
import type { CadProcessDeps, CadRequestRecord, CadRequestServiceLike } from "../cad-request-process"

export const TRANSITION_OPTIONS = { ...getBuilder("transition").defaults }
export const MANIFOLD_OPTIONS = { ...getBuilder("row-manifold").defaults }
export const KIT_OPTIONS = { ...getBuilder("cdu-kit").defaults }

let seq = 1000

export function makeRequest(over: Partial<CadRequestRecord> = {}): CadRequestRecord {
  seq += 1
  return {
    id: `cadr_${seq}`,
    display_id: seq,
    status: "pending",
    builder_type: "transition",
    configuration: { ...TRANSITION_OPTIONS },
    part_number: "clmp-fl150-tspool-l12-6-200",
    description: '2" TRANSITION SPOOL 12" OAL TC X 150# FLG T316L',
    is_customer: false,
    contact_name: "Ada Lovelace",
    company_name: "Acme CDU",
    // Unique per request so the in-memory email cooldowns don't leak between tests.
    email: `ada${seq}@acme-cdu.com`,
    client_ip: "203.0.113.9",
    ip_source: "forwarded",
    source_page: "/us/build/transition?v=1",
    block_reason: null,
    attempts: 0,
    created_at: new Date("2026-10-16T15:00:00Z"),
    ...over,
  }
}

export class FakeCadService implements CadRequestServiceLike {
  rows = new Map<string, CadRequestRecord>()
  tokens = 0
  /** CAD Review setting. On by default, as in production (plan B7). */
  requireReview: boolean | undefined = true
  constructor(rows: CadRequestRecord[] = []) {
    for (const r of rows) this.rows.set(r.id, { ...r })
  }
  get(id: string) {
    return this.rows.get(id)!
  }
  async retrieveCadRequest(id: string) {
    const r = this.rows.get(id)
    if (!r) throw new Error(`not found: ${id}`)
    return { ...r }
  }
  async listCadRequests(filters: Record<string, any>) {
    return [...this.rows.values()]
      .filter((r) => !filters.status || r.status === filters.status)
      .filter((r) => {
        const lt = filters.created_at?.$lt as Date | undefined
        return !lt || new Date(r.created_at as any).getTime() < lt.getTime()
      })
      .sort((a, b) => new Date(a.created_at as any).getTime() - new Date(b.created_at as any).getTime())
      .map((r) => ({ ...r }))
  }
  async updateCadRequests(data: { id: string } & Record<string, unknown>) {
    const r = this.rows.get(data.id)!
    this.rows.set(data.id, { ...r, ...(data as any) })
    return this.rows.get(data.id)
  }
  async issueToken(_id: string) {
    this.tokens += 1
    return { token: `tok${this.tokens}`, expires_at: new Date("2026-10-23T00:00:00Z") }
  }
  async countEmailRequests() {
    return 7
  }
  async countCapGenerations() {
    return 10
  }
  async getSettings() {
    return { daily_generation_cap: 10, require_review: this.requireReview }
  }
  // Deliberately returns EVERY queued row: the job must apply the release rule itself too.
  async listQueuedDue(_now: Date) {
    return [...this.rows.values()].filter((r) => r.status === "queued").map((r) => ({ ...r }))
  }
}

export function makeDeps(cad: FakeCadService, opts: { withEmail?: boolean; failGeneration?: boolean | string; now?: Date } = {}) {
  const sent = {
    link: [] as { to: string; props: any }[],
    queued: [] as { to: string; props: any }[],
    alert: [] as { to: string[]; props: any }[],
  }
  const logs: string[] = []
  const ensurePackage = jest.fn(async (req: CadRequestRecord) => {
    if (opts.failGeneration) throw new Error(typeof opts.failGeneration === "string" ? opts.failGeneration : "CAD service 500")
    return { id: `cadpkg_${req.part_number}` }
  })
  const email =
    opts.withEmail === false
      ? null
      : {
          sendCadRequestLink: jest.fn(async (to: any, props: any) => {
            sent.link.push({ to, props })
            return {}
          }),
          sendCadRequestQueued: jest.fn(async (to: any, props: any) => {
            sent.queued.push({ to, props })
            return {}
          }),
          sendCadRequestAlert: jest.fn(async (to: any, props: any) => {
            sent.alert.push({ to, props })
            return {}
          }),
        }
  const deps: CadProcessDeps = {
    cad,
    email: email as any,
    logger: {
      info: (m) => logs.push(`info ${m}`),
      warn: (m) => logs.push(`warn ${m}`),
      error: (m) => logs.push(`error ${m}`),
    },
    ensurePackage,
    capDayFor: () => "2026-10-16",
    isExistingCustomer: async () => false,
    now: () => opts.now ?? new Date("2026-10-16T15:05:00Z"),
    isProduction: false,
  }
  return { deps, sent, logs, ensurePackage }
}
