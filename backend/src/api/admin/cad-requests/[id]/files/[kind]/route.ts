import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCadStore } from "../../../../../../lib/cad/cad-store"
import { CAD_FILE_CONTENT_TYPE, CAD_FILE_EXT, type CadFileKind } from "../../../../../../lib/cad/download"
import { cadService, loadCadRequestRow } from "../../../load"

const KINDS: readonly CadFileKind[] = ["step", "pdf"]

// GET /admin/cad-requests/:id/files/:kind   (kind = pdf | step; CAD Review R10)
// Admin-only (Medusa authenticates /admin/*). Streams the request's CAD Package file from the
// private CAD store so staff can review it; never touches download_count or the requester's link.
// The PDF is served inline (the admin iframe), the STEP as an attachment; `?download=1` forces an
// attachment for the PDF too. 404 unknown request / kind or no STEP (PDF-only builders), 409 no
// ready package.
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  res.setHeader("Cache-Control", "private, no-store")
  const kind = String(req.params.kind ?? "") as CadFileKind
  if (!KINDS.includes(kind)) return res.status(404).json({ type: "not_found", message: "Unknown file." })
  const row = await loadCadRequestRow(req.scope, req.params.id)
  const [pkg] = row.package_id ? await cadService(req.scope).listCadPackages({ id: row.package_id }, { take: 1 }) : []
  if (!pkg || pkg.status !== "ready") {
    return res.status(409).json({ type: "not_ready", message: "The CAD files for this request are not generated yet." })
  }
  const key = (kind === "step" ? pkg.step_key : pkg.pdf_key) ?? null
  if (!key) return res.status(404).json({ type: "not_found", message: "This CAD Package has no STEP file (PDF only)." })

  let stream
  try {
    stream = await getCadStore().get(key)
  } catch {
    return res.status(409).json({ type: "not_ready", message: "The CAD files could not be read from the CAD store." })
  }
  const bytes = kind === "step" ? pkg.step_bytes : pkg.pdf_bytes
  const inline = kind === "pdf" && String((req.query as any)?.download ?? "") !== "1"
  res.status(200)
  res.setHeader("Content-Type", CAD_FILE_CONTENT_TYPE[kind])
  if (bytes) res.setHeader("Content-Length", String(bytes))
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${row.part_number}.${CAD_FILE_EXT[kind]}"`)
  stream.on("error", () => {
    if (!res.headersSent) res.status(500).end()
    else res.destroy()
  })
  stream.pipe(res)
}
