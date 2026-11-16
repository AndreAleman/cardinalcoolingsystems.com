// /[cc]/cad/download/<token>: landing page for an emailed CAD link (ported from Sanitube).
// Never indexed; always rendered per request.

import { getCadDownload } from "@lib/data/builder"
import type { CadDownloadDTO } from "@lib/builder/types"
import CadDownloadTemplate, { CadDownloadUnavailable } from "@modules/cad/templates/cad-download-template"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Your CAD files | Cardinal Cooling Systems",
  robots: { index: false, follow: false },
}

type Props = { params: { countryCode: string; token: string } }

export default async function CadDownloadPage({ params }: Props) {
  let download: CadDownloadDTO | null
  try {
    download = await getCadDownload(params.token)
  } catch (err) {
    console.error("cad download page:", (err as Error)?.message ?? "unknown")
    return <CadDownloadUnavailable />
  }
  if (!download) notFound()
  return <CadDownloadTemplate token={params.token} download={download} countryCode={params.countryCode} />
}
