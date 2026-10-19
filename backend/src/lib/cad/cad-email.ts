// CAD Request emails through Cardinal's notification module (Resend provider, React Email
// templates registered in modules/email-notifications/templates/index.tsx), plus the URLs and
// recipients they use.
//
// Without RESEND_API_KEY (local), medusa-config.js registers no notification module, so
// cadEmailFromContainer returns null and the subscriber logs what it would have sent (recipients
// included), like the other Cardinal email steps ("Modules.NOTIFICATION not registered; skipping").
//
// Env is read directly (not lib/constants, which asserts DATABASE_URL etc. at import).

import { Modules } from "@medusajs/framework/utils"
import type { CadRequestAlertProps } from "../../modules/email-notifications/templates/cad-request-alert"
import type { CadRequestLinkProps } from "../../modules/email-notifications/templates/cad-request-link"
import type { CadRequestQueuedProps } from "../../modules/email-notifications/templates/cad-request-queued"

/** Staff alert recipients: CAD_REQUEST_INBOX_EMAIL (comma-separated); default Cardinal's one inbox (plan B7). */
export const CAD_REQUEST_INBOX_DEFAULT = "aleman@cardinalcoolingsystems.com"

export function cadRequestRecipients(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.CAD_REQUEST_INBOX_EMAIL || CAD_REQUEST_INBOX_DEFAULT
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Storefront country segment for emailed links (every storefront page lives under /[countryCode]). */
export const CAD_STOREFRONT_COUNTRY = "us"

export function storefrontUrl(path: string, env: NodeJS.ProcessEnv = process.env): string {
  const base = (env.STOREFRONT_URL || "https://cardinalcoolingsystems.com").replace(/\/+$/, "")
  return `${base}/${CAD_STOREFRONT_COUNTRY}${path.startsWith("/") ? path : `/${path}`}`
}

/** The storefront download page for a token: /us/cad/download/:token (storefront stream). */
export function cadDownloadUrl(token: string, env: NodeJS.ProcessEnv = process.env): string {
  return storefrontUrl(`/cad/download/${token}`, env)
}

/** Medusa Admin (served by the backend at /app). */
export function adminUrl(path: string, env: NodeJS.ProcessEnv = process.env): string {
  const base = (env.BACKEND_PUBLIC_URL || env.BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "")
  return `${base}/app${path}`
}

export type CadEmailLike = {
  sendCadRequestLink(to: string, props: CadRequestLinkProps): Promise<unknown>
  sendCadRequestQueued(to: string, props: CadRequestQueuedProps): Promise<unknown>
  sendCadRequestAlert(to: string[], props: CadRequestAlertProps): Promise<unknown>
}

type NotificationLike = {
  createNotifications(data: { to: string; channel: string; template: string; data: Record<string, unknown> }[]): Promise<unknown>
}

export function cadEmailFrom(notification: NotificationLike): CadEmailLike {
  const send = (to: string[], template: string, data: object) =>
    notification.createNotifications(to.map((t) => ({ to: t, channel: "email", template, data: data as Record<string, unknown> })))
  return {
    sendCadRequestLink: (to, props) => send([to], "cad-request-link", props),
    sendCadRequestQueued: (to, props) => send([to], "cad-request-queued", props),
    sendCadRequestAlert: (to, props) => send(to, "cad-request-alert", props),
  }
}

/**
 * True when medusa-config.js registers an email provider (the same condition it uses). Medusa 2.8
 * loads the notification module even with no provider, so resolving it is not enough: a send would
 * throw "Could not find a notification provider for channel: email".
 */
export function emailProviderConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!((env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) || (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL))
}

/** null when no email provider is configured (no RESEND_API_KEY / SENDGRID_API_KEY) or no module. */
export function cadEmailFromContainer(
  container: { resolve: <T = any>(key: string) => T },
  env: NodeJS.ProcessEnv = process.env,
): CadEmailLike | null {
  if (!emailProviderConfigured(env)) return null
  try {
    return cadEmailFrom(container.resolve<NotificationLike>(Modules.NOTIFICATION))
  } catch {
    return null
  }
}
