/*
  Cardinal Builder cart lines (plan B3) — pure seam, no Medusa imports.

  A Quote-mode Configuration enters the cart as ONE custom line item at
  unit_price 0 carrying this metadata (built server-side by
  POST /store/build/quote-lines). Such a cart can never complete
  checkout: it goes through Guest Quote or Request Quote instead
  (workflows/hooks/validate-cart-completion.ts).
*/

export type BuilderLineMetadata = {
  builder: true;
  builder_type: string;
  /** Canonical options. */
  configuration: Record<string, unknown>;
  configuration_display: { label: string; value: string }[];
  part_number: string;
  pricing_mode: "quote" | "instant";
  lead_time: { kind: "stock" | "custom"; label: string };
  configuration_id: string;
  config_key?: string;
  share_path?: string;
  quote_reasons?: string[];
  source_page?: string | null;
};

type LineLike = { metadata?: Record<string, unknown> | null } | null | undefined;

/** A builder Quote line: never checks out. */
export function isBuilderQuoteLine(line: LineLike): boolean {
  const md = line?.metadata;
  return !!md && md.builder === true && md.pricing_mode === "quote";
}

export const BUILDER_QUOTE_CART_MESSAGE =
  "This cart includes a custom-built part that Cardinal must quote. Please request a quote instead of checking out.";

/** Configuration rows to show under a builder line (email, admin); [] for any other line. */
export function builderLineDetails(line: LineLike): string[] {
  const md = line?.metadata;
  if (!md || md.builder !== true) return [];
  const rows = Array.isArray(md.configuration_display) ? md.configuration_display : [];
  return rows
    .filter((r: any) => r && typeof r.label === "string" && typeof r.value === "string")
    .map((r: any) => `${r.label}: ${r.value}`);
}
