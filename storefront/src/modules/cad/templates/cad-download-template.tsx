// Landing page for an emailed CAD link (ported from Sanitube, Cardinal branding). Server component:
// the drawing is rebuilt from the Share Link with the shared BuilderSheet. Files are only ever
// linked through /api/cad/{token}/{kind}.

import { getBuilder } from "@lib/cpq/shared"
import { BuilderSheet } from "@lib/cpq/shared/drawing"
import { cadReference, configFromSharePath, formatCadExpiry } from "@lib/builder/cad"
import { drawnDate } from "@lib/builder/page"
import type { CadDownloadDTO } from "@lib/builder/types"
import Link from "next/link"
import CadFileLinks from "../components/cad-file-links"
import PreparingAutoRefresh from "../components/preparing-auto-refresh"

const LOGO_HREF = "/images/logo/new-cardinal-cooling-logo.svg"

function Panel({ tone, children, testId }: { tone: "info" | "warn"; children: React.ReactNode; testId: string }) {
  const cls = tone === "warn" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-neutral-200 bg-white text-neutral-800"
  return (
    <div className={`flex flex-col gap-2 border p-4 text-sm ${cls}`} data-testid={testId}>
      {children}
    </div>
  )
}

export function CadDownloadUnavailable() {
  return (
    <div className="content-container max-w-3xl py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Your CAD files</h1>
      <div className="mt-6">
        <Panel tone="info" testId="cad-download-unavailable">
          <p>CAD downloads are temporarily unavailable. Please try this link again in a few minutes.</p>
        </Panel>
      </div>
    </div>
  )
}

export default function CadDownloadTemplate({ token, download: d, countryCode }: { token: string; download: CadDownloadDTO; countryCode: string }) {
  const config = configFromSharePath(d.share_path)
  const ref = cadReference(d.display_id)
  const expires = formatCadExpiry(d.expires_at)
  const remaining = typeof d.downloads_remaining === "number" ? d.downloads_remaining : null
  const exhausted = remaining !== null && remaining <= 0
  const builderHref = d.share_path ? `/${countryCode}${d.share_path.startsWith("/") ? "" : "/"}${d.share_path}` : null

  return (
    <div className="content-container flex max-w-5xl flex-col gap-6 py-10" data-testid="cad-download-page" data-status={d.status}>
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">CAD files{ref ? ` · ${ref}` : ""}</p>
        <h1 className="break-all font-mono text-2xl font-semibold text-neutral-900">{d.part_number}</h1>
        {d.description ? <p className="text-neutral-700">{d.description}</p> : null}
      </header>

      {d.status === "ready" ? (
        <Panel tone="info" testId="cad-download-ready">
          {exhausted ? <p>This link has reached its download limit. Request the files again from the builder.</p> : null}
          <CadFileLinks token={token} files={d.files} disabled={exhausted} />
          {expires || remaining !== null ? (
            <p className="text-xs text-neutral-500">
              {[expires ? `Link expires ${expires}` : null, remaining !== null ? `${remaining} download${remaining === 1 ? "" : "s"} left` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          <p className="text-xs text-neutral-500">Reference only; certified drawings come from Cardinal engineering with an approved quote.</p>
        </Panel>
      ) : d.status === "preparing" ? (
        <Panel tone="info" testId="cad-download-preparing">
          <p>We&apos;re generating these files now. This usually takes a few seconds.</p>
          <PreparingAutoRefresh />
        </Panel>
      ) : d.status === "queued" || d.status === "review" ? (
        <Panel tone="info" testId={`cad-download-${d.status}`}>
          <p>Our engineering team is reviewing this drawing. You&apos;ll get an email when it&apos;s released, normally within 1 business day.</p>
        </Panel>
      ) : d.status === "expired" ? (
        <Panel tone="warn" testId="cad-download-expired">
          <p>This link has expired. Request the files again from the builder.</p>
        </Panel>
      ) : (
        <Panel tone="warn" testId="cad-download-failed">
          <p>We&apos;re working on it; you&apos;ll get an email.</p>
        </Panel>
      )}

      {builderHref ? (
        <div className="flex flex-wrap gap-3">
          <Link href={builderHref} className="inline-flex items-center bg-cardinal-red px-4 py-2 text-sm font-semibold text-white hover:bg-cardinal-red-hover" data-testid="cad-open-in-builder">
            Open in the builder
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 medium:grid-cols-12">
        {d.configuration_display.length ? (
          <section className="medium:col-span-4" aria-label="Configuration">
            <h2 className="mb-2 text-sm font-semibold text-neutral-900">Configuration</h2>
            <table className="w-full text-sm">
              <tbody>
                {d.configuration_display.map((row) => (
                  <tr key={row.label} className="border-b border-neutral-200 last:border-0">
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal text-neutral-500">
                      {row.label}
                    </th>
                    <td className="py-1.5 text-neutral-900">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
        {config ? (
          <div className={`min-w-0 border border-neutral-200 bg-white p-2 ${d.configuration_display.length ? "medium:col-span-8" : "medium:col-span-12"}`}>
            <BuilderSheet
              builderType={config.type}
              options={config.options}
              partNumber={d.part_number || getBuilder(config.type as string).partNumber(config.options)}
              description={d.description || getBuilder(config.type as string).describe(config.options)}
              drawnDate={drawnDate()}
              logoHref={LOGO_HREF}
              className="h-auto w-full"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
