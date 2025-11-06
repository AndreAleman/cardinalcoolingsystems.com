import { getBaseURL } from "@lib/util/env";
import { Metadata } from "next";
import "styles/globals.scss";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-LJL2LPB4T5"
          dangerouslySetInnerHTML={undefined as any}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-LJJ2LPB4T5');
            `,
          }}
        />
      </head>
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  );
}
