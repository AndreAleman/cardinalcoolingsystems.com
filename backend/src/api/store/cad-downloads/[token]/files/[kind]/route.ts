// GET /store/cad-downloads/:token/files/:kind (kind = step | pdf): streams one CAD Package file
// from the private CAD store. 404 unknown token / kind (and `step` on a PDF-only package), 410
// expired, 409 package not ready, 429 when the 20-download budget is used. Browsers reach this
// through the storefront proxy, which adds the publishable key (and should forward x-client-ip
// with x-storefront-secret so the flood limit is per buyer).

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCadStore } from "../../../../../../lib/cad/cad-store"
import { CAD_FILE_CONTENT_TYPE, CAD_FILE_EXT, isTokenExpired, type CadFileKind } from "../../../../../../lib/cad/download"
import { CAD_REQUEST_MODULE } from "../../../../../../modules/cad-request"
import type CadRequestModuleService from "../../../../../../modules/cad-request/service"
import type { CadPackageDTO } from "../../../../../../modules/cad-request/types"

const KINDS: readonly CadFileKind[] = ["step", "pdf"]

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Cache-Control", "private, no-store")
  const kind = String(req.params.kind ?? "") as CadFileKind
  if (!KINDS.includes(kind)) {
    return res.status(404).json({ type: "not_found", message: "Unknown file." })
  }
  const service = req.scope.resolve<CadRequestModuleService>(CAD_REQUEST_MODULE)
  const request = await service.findByToken(String(req.params.token ?? ""))
  if (!request) {
    return res.status(404).json({ type: "not_found", message: "This download link is not valid." })
  }
  if (isTokenExpired(request, new Date()) || !["emailed", "ready"].includes(request.status)) {
    return res.status(410).json({ type: "expired", message: "This link has expired. Request the CAD files again from the builder." })
  }
  let pkg: CadPackageDTO | null = null
  if (request.package_id) {
    const [row] = await service.listCadPackages({ id: request.package_id }, { take: 1 })
    pkg = (row as unknown as CadPackageDTO) ?? null
  }
  if (!pkg || pkg.status !== "ready") {
    return res.status(409).json({ type: "not_ready", message: "These CAD files are still being prepared." })
  }
  const key = kind === "step" ? pkg.step_key : pkg.pdf_key
  if (!key) {
    // PDF-only builders (cdu-kit, strainer, hose) have no STEP (plan B8).
    return res.status(404).json({ type: "not_found", message: "This CAD Package has no STEP file." })
  }

  const store = getCadStore()
  let stream
  try {
    stream = await store.get(key)
  } catch {
    return res.status(409).json({ type: "not_ready", message: "These CAD files are still being prepared." })
  }

  const counted = await service.recordDownload(request.id)
  if (!counted.ok) {
    stream.destroy()
    return res.status(429).json({
      type: "download_limit",
      message: "This link has reached its download limit. Request the CAD files again from the builder.",
    })
  }

  const bytes = kind === "step" ? pkg.step_bytes : pkg.pdf_bytes
  res.status(200)
  res.setHeader("Content-Type", CAD_FILE_CONTENT_TYPE[kind])
  if (bytes) res.setHeader("Content-Length", String(bytes))
  res.setHeader("Content-Disposition", `attachment; filename="${request.part_number}.${CAD_FILE_EXT[kind]}"`)
  res.setHeader("X-Downloads-Remaining", String(counted.remaining))
  stream.on("error", () => {
    if (!res.headersSent) res.status(500).end()
    else res.destroy()
  })
  stream.pipe(res)
}
