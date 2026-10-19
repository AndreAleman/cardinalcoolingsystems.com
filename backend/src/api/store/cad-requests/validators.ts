import { z } from "zod"
import { CAD_BUILDER_TYPES } from "../../../modules/cad-request/types"

export type StoreCreateCadRequestType = z.infer<typeof StoreCreateCadRequest>

/*
  POST /store/cad-requests body (Cardinal Builder plan B7):
    { builder_type, options, name, company, email, website (honeypot), turnstile_token?, elapsed_ms?,
      source_page? }
  `options` is the builder's options object (canonical values, or URL-style strings); the route
  decodes it with the builder and refuses invalid keys. name / company / email are required for
  visitors (checked in the route) and ignored for logged-in customers. `website`, `elapsed_ms` and
  `turnstile_token` are read by the bot-protection middlewares before this validator runs.
*/
const OptionValue = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string().max(50), z.number()])).max(20),
])

export const StoreCreateCadRequest = z
  .object({
    builder_type: z.enum(CAD_BUILDER_TYPES),
    options: z.record(z.string().max(40), OptionValue),
    name: z.string().trim().max(120).optional().nullable(),
    company: z.string().trim().max(200).optional().nullable(),
    email: z.string().trim().toLowerCase().max(254).optional().nullable(),
    source_page: z.string().trim().max(300).optional().nullable(),
    // Bot protection (ADR-0008): honeypot field, time-to-submit, Turnstile token.
    website: z.string().max(200).optional().nullable(),
    elapsed_ms: z.number().optional().nullable(),
    turnstile_token: z.string().max(2048).optional().nullable(),
  })
  .strict()
