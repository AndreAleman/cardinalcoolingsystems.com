import { z } from "zod"

const AddressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  state: z.string().optional().default(""),
  postal: z.string().min(1, "Postal code is required"),
})

const LineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  // Optional spec/variant, e.g. "316, 1in x 1/2in"
  spec: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  // What you pay the vendor — used on the purchase order
  unitCost: z.number().nonnegative("Vendor cost can't be negative"),
  // What you charge the client — used on the Stripe invoice
  unitPrice: z.number().nonnegative("Client price can't be negative"),
})

export const CreateOrderDocumentsSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  orderDate: z.string().optional().default(""),
  poNumber: z.string().optional().default(""),
  poDate: z.string().optional().default(""),
  clientPoNumber: z.string().optional().default(""),

  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("A valid customer email is required"),
    address: AddressSchema,
  }),

  vendor: z.object({
    name: z.string().min(1, "Vendor name is required"),
    address: AddressSchema.pick({ line1: true, line2: true, city: true, postal: true }),
  }),

  items: z.array(LineItemSchema).min(1, "Add at least one line item"),

  // Customer shipping charge — appears as a line on the Stripe invoice only.
  shipping: z.number().nonnegative().optional().default(0),

  notes: z.string().optional().default(""),
})

export type CreateOrderDocumentsSchema = z.infer<typeof CreateOrderDocumentsSchema>
