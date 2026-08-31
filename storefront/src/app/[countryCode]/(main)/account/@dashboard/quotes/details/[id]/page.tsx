import { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchQuote, fetchQuotePreview } from "@lib/data/quotes"
import QuoteDetails from "@modules/account/components/quote-details"

export const metadata: Metadata = {
  title: "Quote details",
  description: "Review, accept, or discuss a Cardinal quote.",
}

type Props = {
  params: { id: string; countryCode: string }
}

export default async function QuoteDetailsPage({ params }: Props) {
  const quote = await fetchQuote(params.id)

  if (!quote) {
    notFound()
  }

  // Best-effort: the preview holds staged (not yet accepted) prices.
  const preview = await fetchQuotePreview(params.id)

  return (
    <QuoteDetails
      quote={quote}
      preview={preview}
      countryCode={params.countryCode}
    />
  )
}
