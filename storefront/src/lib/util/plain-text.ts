// Product descriptions imported from WooCommerce can carry raw HTML
// ("<p><img …>"). Anywhere we render a description as text, show the words only.
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
  "&#8243;": "″",
  "&#8211;": "–",
  "&#8212;": "—",
}

export function plainText(html: string | null | undefined): string {
  if (!html) return ""
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[#a-z0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim()
}
