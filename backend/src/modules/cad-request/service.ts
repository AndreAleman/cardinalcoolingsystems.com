// CAD Request module service: pure DB logic (no other modules). Orchestration (file store, CAD
// service, emails, events) lives in src/lib/cad/ and the subscriber. Ported from Sanitube.

import {MedusaError, MedusaService} from "@medusajs/framework/utils"
import {nextReleaseAt} from "../../lib/cad/business-day"
import {CadPackage, CadRequest, CadSetting} from "./models"
import {generateDownloadToken, hashDownloadToken, isWellFormedToken} from "./tokens"
import {
  CAD_DEFAULT_DAILY_GENERATION_CAP,
  CAD_DOWNLOAD_LIMIT,
  CAD_MAX_DAILY_GENERATION_CAP,
  CAD_TOKEN_TTL_HOURS,
  type CadPackageDTO,
  type CadRequestDTO,
  type CadSettingDTO,
} from "./types"

// Serialises recordDownload per request id (single backend container), so
// two parallel downloads cannot both take the last slot.
const downloadLocks = new Map<string, Promise<unknown>>()
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = downloadLocks.get(key) ?? Promise.resolve()
  const run = prev.catch(() => undefined).then(fn)
  const tail = run.catch(() => undefined)
  downloadLocks.set(key, tail)
  void tail.then(() => {
    if (downloadLocks.get(key) === tail) downloadLocks.delete(key)
  })
  return run
}

class CadRequestModuleService extends MedusaService({
  CadRequest,
  CadPackage,
  CadSetting,
}) {
  /** The single settings row; created with defaults on first read. */
  async getSettings(): Promise<CadSettingDTO> {
    const [row] = await this.listCadSettings({}, {take: 1, order: {created_at: "ASC"}})
    if (row) return row as unknown as CadSettingDTO
    const created = await this.createCadSettings({
      daily_generation_cap: CAD_DEFAULT_DAILY_GENERATION_CAP,
    })
    return created as unknown as CadSettingDTO
  }

  /**
   * Partial update: only the fields given change. `daily_generation_cap`
   * (0..1000) and `require_review` (CAD Review R1).
   */
  async updateSettings(input: {
    daily_generation_cap?: number
    require_review?: boolean
    updated_by?: string | null
  }): Promise<CadSettingDTO> {
    const cap = input.daily_generation_cap
    if (
      cap !== undefined &&
      (!Number.isInteger(cap) || cap < 0 || cap > CAD_MAX_DAILY_GENERATION_CAP)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `daily_generation_cap must be a whole number from 0 to ${CAD_MAX_DAILY_GENERATION_CAP}`,
      )
    }
    if (input.require_review !== undefined && typeof input.require_review !== "boolean") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "require_review must be true or false")
    }
    const current = await this.getSettings()
    const updated = await this.updateCadSettings({
      id: current.id,
      ...(cap !== undefined ? {daily_generation_cap: cap} : {}),
      ...(input.require_review !== undefined ? {require_review: input.require_review} : {}),
      updated_by: input.updated_by ?? null,
    })
    // Medusa 2.8's generated update*() returns an array.
    return (Array.isArray(updated) ? updated[0] : updated) as unknown as CadSettingDTO
  }

  /** CAD Review (R1): true unless staff turned review off. */
  async requireReview(): Promise<boolean> {
    const settings = await this.getSettings()
    return settings.require_review !== false
  }

  /**
   * CAD Review R6: the most recent other CAD Request for this Part Number
   * whose files staff approved, or null.
   */
  async findApprovedBefore(
    partNumber: string,
    excludeId: string,
  ): Promise<{id: string; display_id: number; approved_at: Date} | null> {
    const rows = (await this.listCadRequests(
      {part_number: partNumber, approved_at: {$ne: null}, id: {$ne: excludeId}} as any,
      {take: 1, order: {approved_at: "DESC"}, select: ["id", "display_id", "approved_at"]},
    )) as unknown as {id: string; display_id: number; approved_at: Date}[]
    return rows[0] ?? null
  }

  /** Counted visitor CAD Requests for a Business Email since `since` . */
  async countEmailRequests(email: string, since: Date): Promise<number> {
    const [, count] = await this.listAndCountCadRequests(
      {email: email.trim().toLowerCase(), counted: true, created_at: {$gte: since}} as any,
      {take: 1, select: ["id"]},
    )
    return count
  }

  /** Counted visitor CAD Requests from a trusted IP since `since`. */
  async countIpRequests(ip: string, since: Date): Promise<number> {
    const [, count] = await this.listAndCountCadRequests(
      {
        client_ip: ip,
        counted: true,
        ip_source: ["forwarded", "cf"],
        created_at: {$gte: since},
      } as any,
      {take: 1, select: ["id"]},
    )
    return count
  }

  /** CAD Packages that took a site-wide cap slot on `capDay`. */
  async countCapGenerations(capDay: string): Promise<number> {
    const [, count] = await this.listAndCountCadPackages(
      {counted_against_cap: true, cap_day: capDay},
      {take: 1, select: ["id"]},
    )
    return count
  }

  /** True when a CAD Package with this Part Number was ever generated (any version). */
  async everGenerated(partNumber: string): Promise<boolean> {
    const [, count] = await this.listAndCountCadPackages(
      {part_number: partNumber, status: "ready"},
      {take: 1, select: ["id"]},
    )
    return count > 0
  }

  async findPackageByCacheKey(cacheKey: string): Promise<CadPackageDTO | null> {
    const [row] = await this.listCadPackages({cache_key: cacheKey}, {take: 1})
    return (row as unknown as CadPackageDTO) ?? null
  }

  async findReadyPackage(cacheKey: string): Promise<CadPackageDTO | null> {
    const row = await this.findPackageByCacheKey(cacheKey)
    return row && row.status === "ready" ? row : null
  }

  /**
   * New download link for a CAD Request. Replaces any previous token (the old
   * link stops working) and resets the download budget.
   */
  async issueToken(
    requestId: string,
    ttlHours: number = CAD_TOKEN_TTL_HOURS,
    now: Date = new Date(),
  ): Promise<{token: string; expires_at: Date}> {
    const token = generateDownloadToken()
    const expires_at = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)
    await this.updateCadRequests({
      id: requestId,
      token_hash: hashDownloadToken(token),
      token_expires_at: expires_at,
      download_count: 0,
    })
    return {token, expires_at}
  }

  async findByToken(token: string): Promise<CadRequestDTO | null> {
    if (!isWellFormedToken(token)) return null
    const [row] = await this.listCadRequests({token_hash: hashDownloadToken(token)}, {take: 1})
    return (row as unknown as CadRequestDTO) ?? null
  }

  /** Counts one file download; refuses once CAD_DOWNLOAD_LIMIT is used. */
  async recordDownload(
    requestId: string,
    now: Date = new Date(),
  ): Promise<{ok: boolean; remaining: number}> {
    return withLock(requestId, async () => {
      const row = (await this.retrieveCadRequest(requestId)) as unknown as CadRequestDTO
      const used = Number(row.download_count ?? 0)
      if (used >= CAD_DOWNLOAD_LIMIT) return {ok: false, remaining: 0}
      await this.updateCadRequests({
        id: requestId,
        download_count: used + 1,
        last_downloaded_at: now,
      })
      return {ok: true, remaining: CAD_DOWNLOAD_LIMIT - used - 1}
    })
  }

  /** Queued requests whose automatic release time (09:00 Eastern, next business day) has passed. */
  async listQueuedDue(now: Date = new Date()): Promise<CadRequestDTO[]> {
    const rows = (await this.listCadRequests(
      {status: "queued", queued_at: {$lte: now}} as any,
      {order: {queued_at: "ASC"}, take: 500},
    )) as unknown as CadRequestDTO[]
    return rows.filter((r) => r.queued_at && nextReleaseAt(new Date(r.queued_at)) <= now)
  }
}

export default CadRequestModuleService
