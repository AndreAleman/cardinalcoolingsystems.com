import { z } from "zod";

/*
  Validators for the order-form store routes. Quote Requests are pricing
  inquiries so po_number is optional; the invoice-order route (later
  slice) requires it.

  po_file_url: the stored original of a PO Upload (the Read-Out's
  file_url) so the document travels with the order/quote.
*/

export const PlaceInvoiceOrder = z.object({
  cart_id: z.string().min(1, "cart_id is required"),
  // An invoice order is a commitment — the buyer's PO is required so
  // Cardinal's billing can match it.
  po_number: z
    .string()
    .min(1, "PO number is required")
    .max(100, "PO number too long"),
  attn_to: z.string().max(200, "Attn is too long").optional(),
  notes: z.string().max(2000).optional(),
  po_file_url: z.string().url().max(2000).optional(),
});

export type PlaceInvoiceOrderType = z.infer<typeof PlaceInvoiceOrder>;

export const RequestQuote = z.object({
  cart_id: z.string().min(1, "cart_id is required"),
  po_number: z.string().max(100, "PO number too long").optional(),
  attn_to: z.string().max(200, "Attn is too long").optional(),
  notes: z.string().max(2000).optional(),
  po_file_url: z.string().url().max(2000).optional(),
});

export type RequestQuoteType = z.infer<typeof RequestQuote>;

export const PlaceDepositOrder = z.object({
  cart_id: z.string().min(1, "cart_id is required"),
  po_number: z
    .string()
    .min(1, "PO number is required")
    .max(100, "PO number too long"),
  attn_to: z.string().max(200, "Attn is too long").optional(),
  notes: z.string().max(2000).optional(),
  po_file_url: z.string().url().max(2000).optional(),
});

export type PlaceDepositOrderType = z.infer<typeof PlaceDepositOrder>;

export const QuoteCart = z.object({
  region_id: z.string().min(1, "region_id is required"),
  items: z
    .array(
      z.object({
        variant_id: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, "At least one line is required"),
});

export type QuoteCartType = z.infer<typeof QuoteCart>;

export const PoUpload = z.object({
  filename: z.string().min(1).max(255),
  mime_type: z.enum([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
  ]),
  // ~15 MB of base64. PDFs of purchase orders are typically well under.
  file_base64: z.string().min(1).max(20_000_000),
});

export type PoUploadType = z.infer<typeof PoUpload>;

export const GuestQuote = z.object({
  cart_id: z.string().min(1, "cart_id is required"),
  email: z.string().email("A valid email is required").max(320),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  company_name: z.string().min(1, "Company name is required").max(200),
  phone: z.string().max(50).optional(),
  po_number: z.string().max(100, "PO number too long").optional(),
  notes: z.string().max(2000).optional(),
});

export type GuestQuoteType = z.infer<typeof GuestQuote>;
