export type PricingMode = "instant" | "quote";

/* One resolve of a Configuration, as recorded by POST /store/build/resolve. */
export type RecordResolveInput = {
  /** Deterministic id from config_key (configurationIdFor). */
  id: string;
  builder_type: string;
  config_key: string;
  options: Record<string, unknown>;
  bom: unknown[];
  pricing_mode: PricingMode;
  instant_price: number | null;
  weight_lb: number;
  part_number: string;
  created_by_domain: string | null;
  created_by_customer_id: string | null;
};

export type ModuleBuildConfiguration = RecordResolveInput & {
  resolve_count: number;
  last_resolved_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};
