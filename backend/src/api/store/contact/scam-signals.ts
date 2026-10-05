/**
 * Heuristics for the supplier-targeting scams that arrive through the contact
 * form (Thomasnet-sourced "what email can I send my document to", fake-PO
 * "Dear Valued Supplier", NDA-first "strategic collaboration", and plain
 * vendor spam). Flagged submissions are still delivered, with the reasons in
 * the subject and body, so a real RFQ is never silently dropped.
 *
 * Every pattern below was seen verbatim in production submissions, Jul–Sep 2026.
 */

type Signals = { reasons: string[]; suspected: boolean }

const STRONG_PATTERNS: Array<[RegExp, string]> = [
  [/\b(best|appropriate|correct|official|preferred)\s+(official\s+)?e-?mail( address)?\b/i, "asks which email address to send a document to"],
  [/\b(document|documentation|file|brief)\b[^.]{0,80}\b(send|share|submit|forward)\b|\b(send|share|submit|forward)\b[^.]{0,80}\b(document|documentation|file|brief)\b/i, "offers to send a document instead of stating the request"],
  [/dear valued supplier/i, "'Dear Valued Supplier' purchase-order scam template"],
  [/authorization letter/i, "demands a manufacturer authorization letter"],
  [/\b(non-?disclosure agreement|NDA)\b/i, "wants an NDA before saying what they need"],
  [/strategic (collaboration|partnership)/i, "'strategic collaboration' opener"],
  [/guest post|editorial opportunit|backlink|link building|\bSEO\b/i, "SEO / guest-post vendor spam"],
  [/\bOEM manufacturer\b|reduce cost (&|and) lead time/i, "offshore manufacturer solicitation"],
  [/web design|upwork|mobile & seo-friendly/i, "web-design vendor spam"],
]

// Numbers reused across different "companies" in confirmed scam submissions.
const KNOWN_SCAM_PHONES = new Set(["4092310023"])

export function scamSignals(input: { message?: string; phone?: string; email?: string }): Signals {
  const message = input.message ?? ""
  const reasons: string[] = []

  for (const [re, why] of STRONG_PATTERNS) {
    if (re.test(message)) reasons.push(why)
  }

  const digits = (input.phone ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "")
  if (KNOWN_SCAM_PHONES.has(digits)) reasons.push("phone number seen on earlier scam submissions")

  // Real RFQs name a size, quantity or part number. A long message with no
  // digits at all is only corroboration: it never flags on its own, because a
  // genuine "my checkout failed, can I email my list?" looks the same.
  const noNumbers = message.length > 120 && !/\d/.test(message)
  if (noNumbers && reasons.length > 0) {
    reasons.push("no sizes, quantities or part numbers mentioned")
  }

  return { reasons, suspected: reasons.length > 0 }
}
