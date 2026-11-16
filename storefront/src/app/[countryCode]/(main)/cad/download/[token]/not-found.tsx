// An unknown CAD download token: a 404 that says what happened and how to get the files again,
// instead of the site's generic "Page not found".

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function CadDownloadNotFound() {
  return (
    <div className="content-container max-w-3xl py-12" data-testid="cad-download-not-found">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">CAD files</p>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900">This download link isn&apos;t valid</h1>
      <p className="mt-3 text-neutral-700">
        It may have been mistyped or replaced by a newer link. Open the configuration in the builder and request the CAD files
        again, or reply to the email you received and we&apos;ll resend them.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <LocalizedClientLink
          href="/build"
          className="inline-flex items-center bg-cardinal-red px-4 py-2 text-sm font-semibold text-white hover:bg-cardinal-red-hover"
        >
          Go to the builders
        </LocalizedClientLink>
        <LocalizedClientLink href="/contact" className="inline-flex items-center border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 hover:border-neutral-900">
          Contact us
        </LocalizedClientLink>
      </div>
    </div>
  )
}
