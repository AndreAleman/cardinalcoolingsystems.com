/*
  Portal UI tokens — the buyer portal's single source of visual truth,
  matched to the public site's design language (IBM Plex Sans, cardinal
  red #E3000F, 5px radius, h-12 controls, neutral grays).

  Exactly two button styles portal-wide:
    - btnPrimary   → brand red, white text (the site's CTA treatment)
    - btnSecondary → outlined neutral

  One type scale:
    - headingClass    → section headings (Quick Order, Quotes, Orders, Team)
    - subheadingClass → group headings inside a section
    - bodyClass       → body copy
    - captionClass    → secondary/caption text
    - tableHeadClass  → data-table header cells (uppercase, tracked)

  Large controls stay large on purpose — the audience is older and
  non-technical (h-12 everywhere, 16px+ text).
*/

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[5px] bg-[#E3000F] text-white text-[16px] font-medium transition-colors motion-reduce:transition-none hover:bg-[#c0000d] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#E3000F]"

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 h-12 px-5 rounded-[5px] border border-gray-300 bg-white text-[#111111] text-[16px] font-medium transition-colors motion-reduce:transition-none hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"

/* Selected state for secondary toggle buttons (aria-pressed) — a tint of
   the brand, not a third button style. */
export const btnToggleActive =
  "border-[#E3000F] text-[#E3000F] bg-[rgba(227,0,15,0.06)] hover:bg-[rgba(227,0,15,0.1)]"

/* Text inputs — brand focus ring at low opacity. */
export const inputClass =
  "h-12 rounded-[5px] border border-gray-300 bg-white px-3 text-[16px] text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/15 disabled:opacity-50 disabled:cursor-not-allowed"

export const headingClass = "text-xl font-semibold tracking-tight text-[#111111]"
export const subheadingClass = "text-[16px] font-semibold text-[#111111]"
export const bodyClass = "text-[16px] text-[#374151]"
export const captionClass = "text-[14px] text-[#6b7280]"

export const tableHeadClass =
  "text-[13px] font-medium uppercase tracking-wider text-[#6b7280]"

/* SKUs/part numbers — deliberate mono, matching the site's product-sku
   treatment. */
export const skuClass = "font-mono text-[16px] font-medium text-[#111111]"

/* Panels/cards — one border color, one radius. */
export const cardClass = "rounded-[5px] border border-gray-200"

/* Quiet amber pill for quote-only / not-matched markers. */
export const amberPillClass =
  "inline-flex items-center rounded-[5px] border border-amber-200 bg-amber-50 px-2 py-0.5 text-[13px] font-medium text-amber-800"

/* Empty-state copy — one quiet style everywhere. */
export const emptyStateClass = "text-[15px] text-[#6b7280]"

/* Uniform thumbnail treatment. */
export const thumbClass =
  "h-12 w-12 rounded-[5px] border border-gray-200 object-cover bg-gray-50"
