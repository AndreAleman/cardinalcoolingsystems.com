// A CAD Request: a request for the CAD Package of one Builder Configuration. Visitors pass the gate
// (name, company, Business Email); logged-in customers skip it and are never counted. With CAD
// Review on (plan B7), every request is generated first and held at `review` until staff approve.
//
// `configuration` holds the builder's canonical options (the Share Link reopens what they saw).
// Cross-module ids (customer_id, package_id) are plain text (no module links).

import { model } from "@medusajs/framework/utils"

export const CadRequest = model
  .define("cad_request", {
    id: model.id({ prefix: "cadr" }).primaryKey(),
    display_id: model.autoincrement(), // "CAD-{display_id}" in UI/emails
    status: model
      .enum(["pending", "queued", "review", "emailed", "ready", "failed", "rejected", "blocked"])
      .default("pending"),
    builder_type: model.enum(["cdu-kit", "row-manifold", "transition", "strainer", "hose"]),
    configuration: model.json(),
    config_key: model.text(),
    part_number: model.text().index(),
    description: model.text(),
    // requester
    is_customer: model.boolean().default(false),
    customer_id: model.text().nullable(),
    contact_name: model.text().nullable(),
    company_name: model.text().nullable(),
    email: model.text().index().nullable(), // lower-cased; customer: account email
    client_ip: model.text().index().nullable(),
    ip_source: model.enum(["forwarded", "cf", "xff", "socket"]).nullable(),
    source_page: model.text().nullable(),
    counted: model.boolean().default(false),
    block_reason: model.enum(["email_allowance", "ip_daily"]).nullable(),
    // `spam` = marked spam in admin; `other` = Reject.
    reject_reason: model.enum(["spam", "other"]).nullable(),
    // package + delivery
    package_id: model.text().nullable(),
    token_hash: model.text().unique().nullable(),
    token_expires_at: model.dateTime().nullable(),
    download_count: model.number().default(0),
    last_downloaded_at: model.dateTime().nullable(),
    emailed_at: model.dateTime().nullable(),
    queued_at: model.dateTime().nullable(),
    released_at: model.dateTime().nullable(),
    released_by: model.text().nullable(), // admin user id, or "auto"
    // CAD Review: set by Approve & send.
    approved_at: model.dateTime().nullable(),
    approved_by: model.text().nullable(), // admin user id
    attempts: model.number().default(0),
    error: model.text().nullable(),
    staff_notes: model.text().nullable(),
  })
  .indexes([
    { on: ["email", "created_at"] },
    { on: ["client_ip", "created_at"] },
    { on: ["status", "queued_at"] },
  ])
