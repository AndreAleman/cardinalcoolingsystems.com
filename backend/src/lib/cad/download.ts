// Download-link state for GET /store/cad-downloads/:token. Pure.
// PDF-only packages (cdu-kit, strainer, hose; plan B8) list only the PDF, and `has_step` is false
// so the download page can say "STEP files for the stocked parts on request".

import { getBuilder, isBuilderType, type BuilderType } from "../cpq-shared"
import { CAD_DOWNLOAD_LIMIT, type CadPackageDTO, type CadRequestDTO } from "../../modules/cad-request/types"
import { builderHasStep, builderTitle, storedBuilderOptions } from "./builder-options"

export type CadDownloadStatus = "ready" | "preparing" | "queued" | "expired" | "failed"
export type CadFileKind = "step" | "pdf"
export type CadFileDTO = { kind: CadFileKind; filename: string; bytes: number }

export type CadDownloadDTO = {
  status: CadDownloadStatus
  builder_type: BuilderType | string
  builder_title: string
  /** False for the PDF-only builders (cdu-kit, strainer, hose). */
  has_step: boolean
  part_number: string
  description: string
  display_id: number
  configuration_display: { label: string; value: string }[]
  /** Builder Share Link without the country prefix ("/build/transition?v=1&..."), or null. */
  share_path: string | null
  expires_at: string | null
  downloads_remaining: number
  files: CadFileDTO[]
}

export const CAD_FILE_EXT: Record<CadFileKind, string> = { step: "step", pdf: "pdf" }
export const CAD_FILE_CONTENT_TYPE: Record<CadFileKind, string> = {
  step: "model/step",
  pdf: "application/pdf",
}

export function isTokenExpired(request: Pick<CadRequestDTO, "token_expires_at">, now: Date): boolean {
  if (!request.token_expires_at) return true
  return new Date(request.token_expires_at).getTime() <= now.getTime()
}

/** The files a ready package has: the STEP only when it was generated (never for PDF-only kinds). */
export function cadFiles(partNumber: string, pkg: Pick<CadPackageDTO, "status" | "step_key" | "pdf_key" | "step_bytes" | "pdf_bytes"> | null): CadFileDTO[] {
  if (!pkg || pkg.status !== "ready") return []
  const files: CadFileDTO[] = []
  if (pkg.step_key) files.push({ kind: "step", filename: `${partNumber}.step`, bytes: Number(pkg.step_bytes ?? 0) })
  if (pkg.pdf_key) files.push({ kind: "pdf", filename: `${partNumber}.pdf`, bytes: Number(pkg.pdf_bytes ?? 0) })
  return files
}

export function downloadStatus(
  request: Pick<CadRequestDTO, "status" | "token_expires_at">,
  pkg: Pick<CadPackageDTO, "status"> | null,
  now: Date,
): CadDownloadStatus {
  if (isTokenExpired(request, now)) return "expired"
  switch (request.status) {
    case "emailed":
    case "ready":
      return pkg?.status === "ready" ? "ready" : "preparing"
    case "pending":
    case "review":
      return "preparing"
    case "queued":
      return "queued"
    case "failed":
      return "failed"
    default:
      // rejected / blocked never carry a working link
      return "expired"
  }
}

export function toCadDownloadDTO(request: CadRequestDTO, pkg: CadPackageDTO | null, now: Date): CadDownloadDTO {
  const parsed = storedBuilderOptions(request.builder_type, request.configuration)
  const status = downloadStatus(request, pkg, now)
  return {
    status,
    builder_type: request.builder_type,
    builder_title: builderTitle(request.builder_type),
    has_step: builderHasStep(request.builder_type),
    part_number: request.part_number,
    description: request.description,
    display_id: request.display_id,
    configuration_display: parsed ? parsed.builder.display(parsed.options) : [],
    // Unparseable stored options fall back to the builder page itself.
    share_path: parsed
      ? parsed.builder.sharePath(parsed.options)
      : isBuilderType(request.builder_type)
        ? getBuilder(request.builder_type as string).path
        : null,
    expires_at: request.token_expires_at ? new Date(request.token_expires_at).toISOString() : null,
    downloads_remaining: Math.max(0, CAD_DOWNLOAD_LIMIT - Number(request.download_count ?? 0)),
    files: status === "ready" ? cadFiles(request.part_number, pkg) : [],
  }
}
