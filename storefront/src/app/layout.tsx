import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import Script from "next/script"
import { IBM_Plex_Sans } from "next/font/google"
import "styles/globals.scss"
import ClientProviders from "./providers"

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
const GA_ID = "G-LJL2LPB4T5"

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={ibmPlexSans.variable}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://t.contentsquare.net" />
        <link rel="dns-prefetch" href="https://r2.leadsy.ai" />
        <link rel="dns-prefetch" href="https://bucket-production-02b9.up.railway.app" />
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

        <Script id="dataLayer-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];`}
        </Script>

        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>

        <Script
          src="https://t.contentsquare.net/uxa/c8f95efdc22b3.js"
          strategy="lazyOnload"
        />
        <Script
          id="vtag-ai-js"
          src="https://r2.leadsy.ai/tag.js"
          strategy="lazyOnload"
          data-pid="1BqpijfvlFWlLguUn"
          data-version="062024"
        />
      </body>
    </html>
  )
}
