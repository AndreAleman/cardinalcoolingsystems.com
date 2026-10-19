// ensureCadPackage: the one place a CAD Package is generated (ported from Sanitube).
//
//   cache hit (status ready)      → return it
//   otherwise                     → create or claim the CadPackage row (unique cache_key), render
//                                   the drawing SVG (BuilderSheet), call cad-service, store the
//                                   files, mark ready
//   failure                       → row status failed + error, rethrow
//
// Concurrent calls for the same cache key in this process share one promise, so the service is
// called once. Every builder goes through the same path via the registry: cad-service is called on
// /v1/packages/{builder_type}; `expected` (getBuilder(type).expected) is sent for the STEP kinds,
// and a STEP is required back only when getBuilder(type).hasStep (plan B8).

import crypto from "node:crypto"
import { CPQ_TABLES_HASH, getBuilder, type BuilderType, type Options } from "../cpq-shared"
import { DRAWING_VERSION } from "../cpq-shared/drawing"
import { CAD_REQUEST_MODULE } from "../../modules/cad-request"
import type CadRequestModuleService from "../../modules/cad-request/service"
import type { CadPackageDTO, CadRequestDTO } from "../../modules/cad-request/types"
import { storedBuilderOptions } from "./builder-options"
import { drawnDateFor } from "./business-day"
import { CAD_GENERATOR_VERSION, PART_NUMBER_RE, cadCacheKey, cadObjectKeys } from "./cache-key"
import { generatePackage, type PackageRequest, type PackageResponse } from "./cad-service-client"
import { getCadStore, type CadStore } from "./cad-store"
import { renderDrawingSvg } from "./render-drawing"

type Container = { resolve: <T = any>(key: string) => T }

export type EnsureCadPackageInput = {
  builderType: BuilderType
  /** The builder's canonical options. */
  options: Options
  partNumber: string
  /** Defaults to getBuilder(type).describe(options). */
  description?: string
  /** Only used when this call creates the row (admission reserves slots itself). */
  countAgainstCap?: boolean
  capDay?: string | null
  timeoutMs?: number
  now?: Date
}

export type EnsureCadPackageDeps = {
  store: CadStore
  generate: (builderType: BuilderType, input: PackageRequest, opts: { timeoutMs?: number }) => Promise<PackageResponse>
  render: (builderType: BuilderType, options: Options, partNumber: string, drawnDate: string, description: string) => string
  logger?: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }
}

function defaultDeps(container: Container): EnsureCadPackageDeps {
  let logger: EnsureCadPackageDeps["logger"]
  try {
    logger = container.resolve("logger")
  } catch {
    logger = undefined
  }
  return {
    store: getCadStore(),
    generate: (builderType, input, opts) => generatePackage(builderType, input, opts),
    render: renderDrawingSvg,
    logger,
  }
}

const inflight = new Map<string, Promise<CadPackageDTO>>()

/** Medusa 2.8's generated update*() always returns an array (create*() returns one row for one). */
function one<T>(r: T | T[]): T {
  return Array.isArray(r) ? r[0] : r
}

/** The `expected` block cad-service checks its own geometry against (STEP kinds), else undefined. */
export function expectedGeometry(builderType: BuilderType, options: Options): Record<string, unknown> | undefined {
  const b = getBuilder(builderType as string)
  return b.hasStep && b.expected ? b.expected(options) : undefined
}

function decodeFile(file: { base64: string; sha256: string; bytes: number } | null | undefined, kind: string): Buffer {
  // cad-service in CAD_SERVICE_DEV mode without libcairo returns pdf: null. A package without its
  // files is a failure and is never cached.
  if (!file) throw new Error(`CAD service returned no ${kind} file`)
  const buf = Buffer.from(file.base64 ?? "", "base64")
  if (buf.length === 0) throw new Error(`CAD service returned an empty ${kind} file`)
  const sha = crypto.createHash("sha256").update(buf).digest("hex")
  if (file.sha256 && sha !== String(file.sha256).toLowerCase()) {
    throw new Error(`CAD service ${kind} sha256 mismatch`)
  }
  return buf
}

export async function ensureCadPackage(
  container: Container,
  input: EnsureCadPackageInput,
  deps: EnsureCadPackageDeps = defaultDeps(container),
): Promise<CadPackageDTO> {
  if (!PART_NUMBER_RE.test(input.partNumber)) {
    throw new Error(`Invalid Part Number for a CAD Package: ${input.partNumber}`)
  }
  const service = container.resolve<CadRequestModuleService>(CAD_REQUEST_MODULE)
  const cacheKey = cadCacheKey(input.partNumber)

  const ready = await service.findReadyPackage(cacheKey)
  if (ready) return ready

  const running = inflight.get(cacheKey)
  if (running) return running

  const job = generate(service, cacheKey, input, deps).finally(() => {
    inflight.delete(cacheKey)
  })
  inflight.set(cacheKey, job)
  return job
}

async function claimRow(service: CadRequestModuleService, cacheKey: string, input: EnsureCadPackageInput): Promise<CadPackageDTO> {
  const existing = await service.findPackageByCacheKey(cacheKey)
  if (existing) {
    if (existing.status === "ready") return existing
    return one(await service.updateCadPackages({ id: existing.id, status: "generating", error: null })) as unknown as CadPackageDTO
  }
  const counted = !!input.countAgainstCap
  try {
    return (await service.createCadPackages({
      part_number: input.partNumber,
      cache_key: cacheKey,
      builder_type: input.builderType,
      configuration: input.options as Record<string, unknown>,
      tables_hash: CPQ_TABLES_HASH,
      generator_version: CAD_GENERATOR_VERSION,
      drawing_version: DRAWING_VERSION,
      status: "generating",
      counted_against_cap: counted,
      cap_day: counted ? input.capDay ?? null : null,
    })) as unknown as CadPackageDTO
  } catch (e) {
    // Unique cache_key: another writer created it first.
    const raced = await service.findPackageByCacheKey(cacheKey)
    if (raced) return raced
    throw e
  }
}

async function generate(
  service: CadRequestModuleService,
  cacheKey: string,
  input: EnsureCadPackageInput,
  deps: EnsureCadPackageDeps,
): Promise<CadPackageDTO> {
  const row = await claimRow(service, cacheKey, input)
  if (row.status === "ready") return row

  const builder = getBuilder(input.builderType as string)
  const now = input.now ?? new Date()
  const description = input.description ?? builder.describe(input.options)
  try {
    const svg = deps.render(input.builderType, input.options, input.partNumber, drawnDateFor(now), description)
    const expected = expectedGeometry(input.builderType, input.options)
    const res = await deps.generate(
      input.builderType,
      {
        part_number: input.partNumber,
        config: input.options,
        tables_hash: CPQ_TABLES_HASH,
        drawing_svg: svg,
        description,
        ...(expected ? { expected } : {}),
      },
      { timeoutMs: input.timeoutMs },
    )
    if (res.generator_version && String(res.generator_version) !== CAD_GENERATOR_VERSION) {
      deps.logger?.warn(
        `[cad] cad-service generator_version ${res.generator_version} != backend CAD_GENERATOR_VERSION ${CAD_GENERATOR_VERSION}; bump lib/cad/cache-key.ts`,
      )
    }
    const step = builder.hasStep ? decodeFile(res.step, "STEP") : null
    const pdf = decodeFile(res.pdf, "PDF")
    const keys = cadObjectKeys(input.partNumber)
    if (step) await deps.store.put(keys.step, step, "model/step")
    await deps.store.put(keys.pdf, pdf, "application/pdf")
    const sha = (b: Buffer) => crypto.createHash("sha256").update(b).digest("hex")
    const updated = one(await service.updateCadPackages({
      id: row.id,
      status: "ready",
      step_key: step ? keys.step : null,
      pdf_key: keys.pdf,
      step_bytes: step ? step.length : null,
      pdf_bytes: pdf.length,
      step_sha256: step ? sha(step) : null,
      pdf_sha256: sha(pdf),
      generator_version: String(res.generator_version || CAD_GENERATOR_VERSION),
      generated_at: new Date(),
      error: null,
    }))
    deps.logger?.info(`[cad] generated ${cacheKey} (${step ? `${step.length} + ` : "PDF only, "}${pdf.length} bytes)`)
    return updated as unknown as CadPackageDTO
  } catch (err: any) {
    const message = String(err?.message ?? err).slice(0, 2000)
    try {
      await service.updateCadPackages({ id: row.id, status: "failed", error: message })
    } catch {
      // keep the original error
    }
    deps.logger?.error(`[cad] generation failed for ${cacheKey}: ${message}`)
    throw err
  }
}

/**
 * Generates (or reuses) the CAD Package for a stored CAD Request, for the subscriber / queue job.
 * Never counts against the cap: admission reserved the cap slot (if any) on the package row
 * already, and released requests are free.
 */
export async function ensurePackageForRequest(
  container: Container,
  request: Pick<CadRequestDTO, "configuration" | "part_number"> & { builder_type?: string | null; description?: string },
  opts: { timeoutMs?: number; now?: Date } = {},
  deps?: EnsureCadPackageDeps,
): Promise<CadPackageDTO> {
  const parsed = storedBuilderOptions(request.builder_type, request.configuration)
  if (!parsed) {
    throw new Error(`Stored configuration no longer validates for builder "${String(request.builder_type)}"`)
  }
  return ensureCadPackage(
    container,
    {
      builderType: parsed.type,
      options: parsed.options,
      partNumber: request.part_number,
      description: request.description,
      countAgainstCap: false,
      ...opts,
    },
    deps,
  )
}
