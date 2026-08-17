import { getBaseURL } from "@lib/util/env";
import { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Sans } from "next/font/google";
import "styles/globals.scss";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={ibmPlexSans.variable}>
      <head>
        {/* Initialize Data Layer FIRST so queued events survive until GTM loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LJL2LPB4T5');
              gtag('config', 'G-30XK2WTS1V');
            `,
          }}
        />
      </head>

      <body className={ibmPlexSans.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `
              <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W3H2TDDZ"
              height="0" width="0" style="display:none;visibility:hidden"></iframe>
            `,
          }}
        />
        <main className="relative">{props.children}</main>

        {/* Third-party scripts load after hydration so they never block rendering */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-W3H2TDDZ');
            `,
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LJL2LPB4T5"
          strategy="afterInteractive"
        />
        <Script
          src="https://t.contentsquare.net/uxa/c8f95efdc22b3.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
