// HTTP client for cad-service (plan B8/B9; ported from Sanitube). The backend is the only caller;
// the service is stateless compute on Railway's private network.
//
// Env: CAD_SERVICE_URL (e.g. http://cad-service.railway.internal:8080),
//      CAD_SERVICE_TOKEN (Bearer secret shared with the service).

import { isBuilderType, type BuilderType, type Options } from "../cpq-shared"

/**
 * The request envelope, for every builder: POST /v1/packages/{builder_type}. `config` is the
 * builder's canonical options object; `expected` (STEP kinds only) is getBuilder(type).expected(o).
 */
export type PackageRequest = {
  part_number: string
  config: Options
  tables_hash: string
  drawing_svg: string
  description: string
  expected?: Record<string, unknown>
}

export type CadServiceFile = {
  filename: string
  content_type: string
  bytes: number
  sha256: string
  base64: string
}

export type PackageResponse = {
  part_number: string
  generator_version: string
  tables_hash: string
  /** null for PDF-only kinds (cdu-kit, strainer, hose). */
  step: CadServiceFile | null
  /** null only when cad-service runs in CAD_SERVICE_DEV mode without libcairo. */
  pdf: CadServiceFile | null
  solid?: { valid: boolean; volume_in3: number; bbox_in: number[] } | null
  timings_ms?: Record<string, number>
}

/** cad-service route per builder: POST /v1/packages/{builder_type}. */
export function packagePath(builderType: BuilderType | string): string {
  if (!isBuilderType(builderType)) {
    throw new CadServiceError(`Unknown builder type: ${String(builderType)}`, 0, "invalid_builder_type")
  }
  return `/v1/packages/${builderType}`
}

export type CadServiceHealth = {
  ok: boolean
  generator_version?: string
  tables_hash?: string
  cadquery?: string
  warm?: boolean
}

/** Error from cad-service (or the network). `status` 0 = no HTTP response. */
export class CadServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message)
    this.name = "CadServiceError"
  }
}

type FetchLike = (url: string, init?: any) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<any>
  text: () => Promise<string>
}>

export const CAD_SERVICE_DEFAULT_TIMEOUT_MS = 120_000
const RETRY_DELAY_MS = 500

export function cadServiceEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!env.CAD_SERVICE_URL && !!env.CAD_SERVICE_TOKEN
}

function baseUrl(): string {
  return String(process.env.CAD_SERVICE_URL ?? "").replace(/\/+$/, "")
}

function isRetryable(err: unknown): boolean {
  if (err instanceof CadServiceError) {
    return err.status === 502 || err.status === 503 || err.code === "ECONNREFUSED"
  }
  return false
}

function networkCode(err: any): string {
  return String(err?.cause?.code ?? err?.code ?? "network_error")
}

async function callOnce(path: string, input: PackageRequest, timeoutMs: number, fetchImpl: FetchLike): Promise<PackageResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res: Awaited<ReturnType<FetchLike>>
  try {
    res = await fetchImpl(`${baseUrl()}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.CAD_SERVICE_TOKEN ?? ""}`,
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    })
  } catch (err: any) {
    if (controller.signal.aborted || err?.name === "AbortError") {
      throw new CadServiceError(`CAD service timed out after ${timeoutMs} ms`, 0, "timeout")
    }
    const code = networkCode(err)
    throw new CadServiceError(`CAD service unreachable (${code})`, 0, code)
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    let code = `http_${res.status}`
    let message = `CAD service returned ${res.status}`
    try {
      const body = await res.json()
      if (body?.error?.code) code = String(body.error.code)
      if (body?.error?.message) message = `${message}: ${body.error.message}`
    } catch {
      // non-JSON error body
    }
    throw new CadServiceError(message, res.status, code)
  }
  return (await res.json()) as PackageResponse
}

export type GenerateOpts = { timeoutMs?: number; fetch?: FetchLike; retryDelayMs?: number }

/** POST /v1/packages/{builderType}. Retries once on 502/503 (e.g. 503 warming_up)/ECONNREFUSED. */
export async function generatePackage(
  builderType: BuilderType | string,
  input: PackageRequest,
  opts: GenerateOpts = {},
): Promise<PackageResponse> {
  if (!cadServiceEnabled()) {
    throw new CadServiceError("CAD service is not configured", 0, "disabled")
  }
  const path = packagePath(builderType)
  const timeoutMs = opts.timeoutMs ?? CAD_SERVICE_DEFAULT_TIMEOUT_MS
  const fetchImpl = opts.fetch ?? (globalThis.fetch as unknown as FetchLike)
  try {
    return await callOnce(path, input, timeoutMs, fetchImpl)
  } catch (err) {
    if (!isRetryable(err)) throw err
    await new Promise((r) => setTimeout(r, opts.retryDelayMs ?? RETRY_DELAY_MS))
    return await callOnce(path, input, timeoutMs, fetchImpl)
  }
}

export type CadServiceStatus = {
  enabled: boolean
  healthy: boolean
  generator_version: string | null
  tables_hash: string | null
}

/** GET /health, for the admin settings card. Never throws. */
export async function getCadServiceHealth(
  opts: { timeoutMs?: number; fetch?: FetchLike; env?: NodeJS.ProcessEnv } = {},
): Promise<CadServiceStatus> {
  const env = opts.env ?? process.env
  const down = { enabled: cadServiceEnabled(env), healthy: false, generator_version: null, tables_hash: null }
  if (!down.enabled) return down
  const fetchImpl = opts.fetch ?? (globalThis.fetch as unknown as FetchLike)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 3000)
  try {
    const base = String(env.CAD_SERVICE_URL).replace(/\/+$/, "")
    const res = await fetchImpl(`${base}/health`, { signal: controller.signal })
    const body = (await res.json().catch(() => ({}))) as CadServiceHealth
    return {
      enabled: true,
      healthy: res.ok && body?.ok === true,
      generator_version: body?.generator_version != null ? String(body.generator_version) : null,
      tables_hash: body?.tables_hash != null ? String(body.tables_hash) : null,
    }
  } catch {
    return down
  } finally {
    clearTimeout(timer)
  }
}
