// A mailto link wrapped in Cloudflare's <!--email_off--> comments, so Scrape Shield's Email
// Address Obfuscation leaves it alone (otherwise it renders "[email protected]" until Cloudflare's
// decode script runs). React can't emit HTML comments directly, so the link is raw HTML; every
// value is escaped. Works in server and client components.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export function emailOffHtml(email: string, className?: string, subject?: string, plain = false): string {
  if (plain) return `<!--email_off-->${esc(email)}<!--/email_off-->`
  const href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`
  const cls = className ? ` class="${esc(className)}"` : ""
  return `<!--email_off--><a href="${esc(href)}"${cls}>${esc(email)}</a><!--/email_off-->`
}

export default function EmailOff({
  email,
  className,
  subject,
  testId,
  plain = false,
}: {
  email: string
  className?: string
  subject?: string
  testId?: string
  /** Plain text (no link): the address readable and copyable even where mailto does nothing. */
  plain?: boolean
}) {
  return (
    <span
      data-testid={testId}
      className={plain ? className : undefined}
      dangerouslySetInnerHTML={{ __html: emailOffHtml(email, plain ? undefined : className, subject, plain) }}
    />
  )
}
