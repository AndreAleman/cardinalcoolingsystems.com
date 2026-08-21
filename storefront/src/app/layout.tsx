import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import "styles/globals.scss"
import ClientProviders from "./providers"
import CookieConsent from "@modules/layout/components/cookie-consent"
import TrackingScripts from "@modules/layout/components/cookie-consent/tracking-scripts"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

const GTM_ID = "GTM-W3H2TDDZ"
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={ibmPlexSans.variable}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://t.contentsquare.net" />
        <link rel="dns-prefetch" href="https://r2.leadsy.ai" />
        <link rel="dns-prefetch" href="https://bucket-production-02b9.up.railway.app" />
        {POSTHOG_KEY && <link rel="dns-prefetch" href={POSTHOG_HOST} />}
      </head>
      <body>
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />
        <ClientProviders>
          <main className="relative">{props.children}</main>
        </ClientProviders>

        <TrackingScripts />
        <CookieConsent />
      </body>
    </html>
  )
}
