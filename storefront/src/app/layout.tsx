import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
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

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={ibmPlexSans.variable}>
      <head>
        {/* Initialize Data Layer FIRST */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];`,
          }}
        />
        <script src="https://t.contentsquare.net/uxa/c8f95efdc22b3.js"></script>
        <script
          id="vtag-ai-js"
          async
          src="https://r2.leadsy.ai/tag.js"
          data-pid="1BqpijfvlFWlLguUn"
          data-version="062024"
        ></script>

        {/* RB2B */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(key) {if (window.reb2b) return;window.reb2b = {loaded: true};var s = document.createElement("script");s.async = true;s.src = "https://ddwl4m2hdecbv.cloudfront.net/b/" + key + "/" + key + ".js.gz";document.getElementsByTagName("script")[0].parentNode.insertBefore(s, document.getElementsByTagName("script")[0]);}("EN4M0HJL37OM");`,
          }}
        />

        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W3H2TDDZ');`,
          }}
        />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-LJL2LPB4T5" />
        <script
          dangerouslySetInnerHTML={{
            __html: `function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-LJL2LPB4T5');`,
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W3H2TDDZ"
height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />
        <ClientProviders>
          <main className="relative">{props.children}</main>
        </ClientProviders>
      </body>
    </html>
  )
}
