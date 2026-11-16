// GET /store/cad-downloads/:token: the state of an emailed / issued download link. Anonymous; the
// token is the credential. Never returns prices. 404 for an unknown token.
// → { cad_download: CadDownloadDTO } (lib/cad/download.ts): status, builder_type, builder_title,
//   has_step (false for PDF-only builders), part_number, description, display_id,
//   configuration_display, share_path, expires_at, downloads_remaining, files [{kind, filename, bytes}]

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { toCadDownloadDTO } from "../../../../lib/cad/download"
import { CAD_REQUEST_MODULE } from "../../../../modules/cad-request"
import type CadRequestModuleService from "../../../../modules/cad-request/service"
import type { CadPackageDTO } from "../../../../modules/cad-request/types"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve<CadRequestModuleService>(CAD_REQUEST_MODULE)
  const request = await service.findByToken(String(req.params.token ?? ""))
  if (!request) {
    return res.status(404).json({ type: "not_found", message: "This download link is not valid." })
  }
  let pkg: CadPackageDTO | null = null
  if (request.package_id) {
    const [row] = await service.listCadPackages({ id: request.package_id }, { take: 1 })
    pkg = (row as unknown as CadPackageDTO) ?? null
  }
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ cad_download: toCadDownloadDTO(request, pkg, new Date()) })
}
