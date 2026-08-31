import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http";
import { ensureCompanyApproved } from "../../middlewares/ensure-company-approved";
import { ensureInvoicePaymentEnabled } from "../../middlewares/ensure-invoice-payment-enabled";
import {
  GuestQuote,
  PlaceDepositOrder,
  PlaceInvoiceOrder,
  QuoteCart,
  RequestQuote,
} from "./validators";

const dashboardGate = [
  authenticate("customer", ["session", "bearer"]),
  ensureCompanyApproved,
];

export const orderFormMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/order-form/request-quote",
    methods: ["POST"],
    middlewares: [...dashboardGate, validateAndTransformBody(RequestQuote)],
  },
  {
    // Public on purpose: guests quote without an account (decided
    // 2026-08-31). Publishable-key protection only, like /store/carts.
    matcher: "/store/order-form/guest-quote",
    methods: ["POST"],
    middlewares: [validateAndTransformBody(GuestQuote)],
  },
  {
    matcher: "/store/order-form/quote-cart",
    methods: ["POST"],
    middlewares: [...dashboardGate, validateAndTransformBody(QuoteCart)],
  },
  {
    matcher: "/store/order-form/place-deposit-order",
    methods: ["POST"],
    middlewares: [
      ...dashboardGate,
      validateAndTransformBody(PlaceDepositOrder),
    ],
  },
  {
    matcher: "/store/order-form/place-invoice-order",
    methods: ["POST"],
    middlewares: [
      ...dashboardGate,
      ensureInvoicePaymentEnabled,
      validateAndTransformBody(PlaceInvoiceOrder),
    ],
  },
];
