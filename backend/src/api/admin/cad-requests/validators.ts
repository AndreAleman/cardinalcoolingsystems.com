import { createFindParams, createSelectParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"
import { CAD_BUILDER_TYPES } from "../../../modules/cad-request/types"
import { CAD_REJECT_REASONS, CAD_REQUEST_STATUSES } from "./module"

const Status = z.enum(CAD_REQUEST_STATUSES)

// ?status=queued, ?status=emailed,ready, or ?status[]=emailed&status[]=ready
const StatusList = z.preprocess((v) => {
  if (v === undefined || v === null || v === "") return undefined
  const arr = Array.isArray(v) ? v : [v]
  return arr
    .flatMap((s) => String(s).split(","))
    .map((s) => s.trim())
    .filter(Boolean)
}, z.array(Status).optional())

const QueryBoolean = z.preprocess((v) => (v === "true" || v === true ? true : v === "false" || v === false ? false : v), z.boolean().optional())

export type AdminListCadRequestsParamsType = z.infer<typeof AdminListCadRequestsParams>
export const AdminListCadRequestsParams = createFindParams({ limit: 25, offset: 0 }).merge(
  z.object({
    status: StatusList,
    builder_type: z.enum(CAD_BUILDER_TYPES).optional(),
    q: z.string().max(200).optional(),
    email: z.string().max(320).optional(),
    // The Spam tab, and the All tab's default.
    reject_reason: z.enum(CAD_REJECT_REASONS).optional(),
    exclude_spam: QueryBoolean,
  }),
)

export type AdminGetCadRequestParamsType = z.infer<typeof AdminGetCadRequestParams>
export const AdminGetCadRequestParams = createSelectParams()

export type AdminUpdateCadRequestType = z.infer<typeof AdminUpdateCadRequest>
export const AdminUpdateCadRequest = z.object({ staff_notes: z.string().max(4000).nullable() }).strict()

export type AdminRejectCadRequestType = z.infer<typeof AdminRejectCadRequest>
export const AdminRejectCadRequest = z.object({ staff_notes: z.string().max(4000).nullable().optional() }).strict()

export type AdminSpamCadRequestType = z.infer<typeof AdminSpamCadRequest>
export const AdminSpamCadRequest = z.object({ staff_notes: z.string().max(4000).nullable().optional() }).strict()
