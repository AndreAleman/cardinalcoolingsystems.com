export type QuoteStatus =
  | "pending_merchant"
  | "pending_customer"
  | "accepted"
  | "customer_rejected"
  | "merchant_rejected";

export type ModuleQuote = {
  id: string;
  status: QuoteStatus;
  customer_id: string;
  draft_order_id: string;
  order_change_id: string;
  cart_id: string;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export type ModuleCreateQuote = {
  customer_id: string;
  draft_order_id: string;
  order_change_id: string;
  cart_id: string;
  status?: QuoteStatus;
};

export type ModuleQuoteMessage = {
  id: string;
  text: string;
  item_id: string | null;
  admin_id: string | null;
  customer_id: string | null;
  quote_id: string;
};

export type ModuleUpdateQuote = Partial<
  Omit<ModuleQuote, "id" | "created_at" | "updated_at">
> & {
  id: string;
};

/* A Quote row as query.graph returns it (subset of fields, loosely
   typed — callers only ever select what they need). */
export type QueryQuote = {
  id: string;
  status: QuoteStatus;
  customer_id?: string | null;
  draft_order_id?: string;
  cart_id?: string;
  [key: string]: unknown;
};

export type ModuleQuoteLinePricing = {
  id: string;
  quote_id: string;
  item_id: string;
  cost: number;
  markup_pct: number;
};

export type ModuleCreateQuoteMessage = {
  quote_id: string;
  text: string;
  item_id?: string | null;
  admin_id?: string | null;
  customer_id?: string | null;
};
