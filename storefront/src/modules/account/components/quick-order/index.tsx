"use client"

/*
  Quick Order — the table at the top of the Dashboard where a Team
  Member types part numbers and quantities and sees price and stock per
  line (CONTEXT.md). Ported from accurateforklift.net's order form and
  adapted for Cardinal:

  - Prices and stock ARE shown per line (Company Price List honored).
  - No ad-hoc SKU row (Cardinal parts only).
  - A quantity above stock flips the line to Quote-Only with a visible
    marker but keeps the quantity.
  - One primary submit button whose path follows the money rules
    (money-rules.ts); a mixed cart splits into a pay submission plus a
    Quote Request in one click.
  - Persistent post-submit confirmation replaces the form (large green
    banner) so it can't be missed or double-submitted.

  Large controls on purpose: this audience is older and non-technical.
*/

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Table, Toaster, toast } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { capturePortalEvent } from "@lib/util/portal-analytics"
import { usePortalCart } from "@lib/context/portal-cart-context"
import {
  searchPortalProducts,
  getPortalProductsByVariantIds,
  submitPortalInvoiceOrder,
  submitPortalDepositOrder,
  submitPortalQuoteRequest,
  preparePortalCheckoutCart,
  type SubmitLine,
  type CartAddressPayload,
} from "@lib/data/order-form"
import { addFavorite, removeFavorite } from "@lib/data/dashboard"
import { addCustomerAddress } from "@lib/data/customer"
import OrderReviewDrawer, {
  type DrawerSubmitExtras,
  type SubmitOutcome,
} from "./order-review-drawer"
import type { AddressPickerValue } from "./address-picker"
import {
  planCart,
  isQuoteOnlyLine,
  type CartPlan,
  type PortalCartLine,
} from "./money-rules"
import {
  buildVariantRowMap,
  productVariantToRow,
  rowToCartLine,
  type VariantRow,
} from "./variant-info"
import PoUpload, { type PoLoadedPayload } from "./po-upload"

type Props = {
  countryCode: string
  initialProducts: HttpTypes.StoreProduct[]
  addresses: HttpTypes.StoreCustomerAddress[]
  initialFavorites: VariantRow[]
  invoicePaymentEnabled: boolean
  currencyCode: string
}

type Confirmation = {
  outcome: SubmitOutcome
  itemCount: number
  po: string
}

const PAGE_SIZE = 10

export default function QuickOrder({
  countryCode,
  initialProducts,
  addresses,
  initialFavorites,
  invoicePaymentEnabled,
  currencyCode,
}: Props) {
  const router = useRouter()
  const { lines, addLine, updateQty, removeLine, clear } = usePortalCart()
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<HttpTypes.StoreProduct[]>(initialProducts)
  const [isSearching, startSearch] = useTransition()
  const [rowQty, setRowQty] = useState<Record<string, number>>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [favorites, setFavorites] = useState<VariantRow[]>(initialFavorites)
  const [favView, setFavView] = useState<"all" | "favorites">("all")
  const [reviewOpen, setReviewOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  // Prefills a PO Upload hands to the review drawer: the PO's number and
  // an "Also quote: …" note carrying its unmatched lines.
  const [poPrefill, setPoPrefill] = useState("")
  const [notesPrefill, setNotesPrefill] = useState("")

  const favoriteVariantIds = useMemo(
    () => new Set(favorites.map((f) => f.variantId)),
    [favorites]
  )

  const fmt = (amount: number, code?: string | null) =>
    convertToLocale({ amount, currency_code: code || currencyCode || "usd" })

  /* ---- Search ---- */

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    startSearch(async () => {
      try {
        const products = await searchPortalProducts({
          q: searchTerm.trim(),
          countryCode,
        })
        setResults(products)
      } catch (err: any) {
        toast.error(`Search failed: ${err?.message ?? "unknown error"}`)
      }
    })
  }

  /* Flatten to per-variant rows, filtered live as the user types. */
  const filteredVariants = useMemo(() => {
    const flat = results.flatMap((product) =>
      (product.variants ?? []).map((variant) => ({ product, variant }))
    )
    const term = searchTerm.trim().toLowerCase()
    if (!term) return flat
    return flat.filter(({ product, variant }) => {
      const sku = variant.sku?.toLowerCase() ?? ""
      const title = product.title?.toLowerCase() ?? ""
      return sku.includes(term) || title.includes(term)
    })
  }, [results, searchTerm])

  const favoriteRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return favorites
      .filter((f) => f.available)
      .filter(
        (f) =>
          !term ||
          (f.sku ?? "").toLowerCase().includes(term) ||
          (f.title ?? "").toLowerCase().includes(term)
      )
  }, [favorites, searchTerm])

  const rowCount =
    favView === "favorites" ? favoriteRows.length : filteredVariants.length

  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm, results, favView])

  const totalPages = Math.max(1, Math.ceil(rowCount / PAGE_SIZE))
  const pageStart = currentPage * PAGE_SIZE

  /* ---- Favorites ---- */

  const toggleFavorite = async (row: VariantRow) => {
    const wasFavorite = favoriteVariantIds.has(row.variantId)
    const snapshot = favorites
    setFavorites((prev) =>
      wasFavorite
        ? prev.filter((f) => f.variantId !== row.variantId)
        : [row, ...prev]
    )
    try {
      if (wasFavorite) {
        await removeFavorite(row.variantId)
      } else {
        await addFavorite(row.variantId)
      }
    } catch (err: any) {
      setFavorites(snapshot)
      toast.error(
        `Couldn't ${wasFavorite ? "remove" : "save"} favorite: ${
          err?.message ?? "unknown error"
        }`
      )
    }
  }

  /* ---- Cart / plan ---- */

  const plan: CartPlan = useMemo(
    () => planCart(lines, invoicePaymentEnabled),
    [lines, invoicePaymentEnabled]
  )

  /* "Both paths are one click" (spec story 26): even when every line is
     payable, the buyer can send the whole list as a Quote Request. */
  const [quoteEverything, setQuoteEverything] = useState(false)
  const reviewPlan: CartPlan = useMemo(
    () =>
      quoteEverything
        ? {
            ...plan,
            path: "quote_only",
            payLines: [],
            quoteLines: [...plan.payLines, ...plan.quoteLines],
          }
        : plan,
    [plan, quoteEverything]
  )

  const addRowToOrder = (line: PortalCartLine) => {
    addLine(line)
    toast.success(`Added ${line.qty}× ${line.sku}`)
  }

  /* ---- PO Upload → Quick Order ---- */

  /*
    "Load into Quick Order": hydrate the matched variants through the
    same live-price/stock fetch Order Again and Favorites use, so
    price, stock, and Quote-Only detection all behave normally; carry
    unmatched lines in the quote-note prefill (the portal cart has no
    free-text lines — quote submissions are variant_id + qty only).
  */
  const handlePoLoad = async (
    payload: PoLoadedPayload
  ): Promise<{ loadedCount: number }> => {
    let loadedCount = 0

    if (payload.matched.length) {
      const products = await getPortalProductsByVariantIds(
        payload.matched.map((m) => m.variantId),
        countryCode
      )
      const rowMap = buildVariantRowMap(products)
      for (const m of payload.matched) {
        const row = rowMap[m.variantId]
        if (row) {
          addLine(rowToCartLine(row, m.quantity))
          loadedCount++
        }
      }
    }

    const noteEntries = payload.unmatched.map(
      (u) => `Also quote: ${u.quantity}× ${u.description}`
    )
    if (payload.poNumber) {
      setPoPrefill(payload.poNumber)
    }
    if (noteEntries.length) {
      const note = noteEntries.join("\n")
      setNotesPrefill((prev) => (prev ? `${prev}\n${note}` : note))
    }

    return { loadedCount }
  }

  /* ---- Submission ---- */

  const resolveAddress = async (
    v: AddressPickerValue
  ): Promise<CartAddressPayload | null> => {
    if (!v) return null
    if (v.kind === "saved") {
      const a = addresses.find((x) => x.id === v.id)
      if (!a) throw new Error("Selected saved address not found")
      return {
        first_name: a.first_name ?? undefined,
        last_name: a.last_name ?? undefined,
        company: a.company ?? undefined,
        address_1: a.address_1 ?? "",
        address_2: a.address_2 ?? undefined,
        city: a.city ?? "",
        postal_code: a.postal_code ?? "",
        province: a.province ?? undefined,
        country_code: countryCode,
        phone: a.phone ?? undefined,
      }
    }
    const normalized = { ...v.address, country_code: countryCode }
    if (v.save) {
      // Best-effort save into the customer's address book — the order
      // matters more than the address-book write.
      const fd = new FormData()
      Object.entries(normalized).forEach(([k, val]) => {
        if (val != null) fd.set(k, String(val))
      })
      await addCustomerAddress(null, fd).catch((err) =>
        console.warn("Failed to save address:", err)
      )
    }
    return normalized
  }

  const toSubmitLines = (ls: PortalCartLine[]): SubmitLine[] =>
    ls.map((l) => ({ variant_id: l.variantId, quantity: l.qty }))

  const handleReviewSubmit = async (
    extras: DrawerSubmitExtras
  ): Promise<SubmitOutcome> => {
    const billing_address = await resolveAddress(extras.billing)
    const shipping_address = extras.shipping_same_as_billing
      ? billing_address
      : await resolveAddress(extras.shipping)

    const outcome: SubmitOutcome = {}
    const quoteExtras = {
      po_number: extras.po_number || undefined,
      attn_to: extras.attn_to || undefined,
      notes: extras.notes || undefined,
      billing_address,
      shipping_address,
    }

    if (plan.path === "invoice" || plan.path === "deposit") {
      const submit =
        plan.path === "invoice"
          ? submitPortalInvoiceOrder
          : submitPortalDepositOrder
      const result = await submit(toSubmitLines(plan.payLines), countryCode, {
        ...quoteExtras,
        po_number: extras.po_number,
      })
      outcome.orderPlaced = true
      outcome.orderPendingApproval = result.pending_approval
      capturePortalEvent("portal_order_placed", {
        path: plan.path,
        items: plan.payLines.length,
        total: plan.payableTotal,
      })
    }

    if (plan.path === "checkout" && plan.payLines.length) {
      await preparePortalCheckoutCart(toSubmitLines(plan.payLines), countryCode)
      outcome.checkoutReady = true
      capturePortalEvent("portal_order_placed", {
        path: "checkout",
        items: plan.payLines.length,
        total: plan.payableTotal,
      })
    }

    if (plan.quoteLines.length) {
      const result = await submitPortalQuoteRequest(
        toSubmitLines(plan.quoteLines),
        countryCode,
        quoteExtras
      )
      outcome.quoteSent = true
      outcome.quotePendingApproval = result.pending_approval
      capturePortalEvent("portal_quote_requested", {
        items: plan.quoteLines.length,
      })
    }

    // Persistent page-level confirmation + double-submit protection:
    // the form area is replaced by the banner as soon as this resolves.
    setConfirmation({
      outcome,
      itemCount: lines.length,
      po: extras.po_number,
    })
    clear()
    setPoPrefill("")
    setNotesPrefill("")
    router.refresh()
    return outcome
  }

  const goToCheckout = () => {
    router.push(`/${countryCode}/checkout`)
  }

  /* ---- Persistent confirmation banner ---- */

  if (confirmation && !reviewOpen) {
    const o = confirmation.outcome
    return (
      <div className="flex flex-col gap-y-6">
        <div
          className="rounded-lg border-2 border-green-600 bg-green-50 p-8 text-center"
          data-testid="quick-order-confirmation"
        >
          <div className="text-3xl font-semibold text-green-800 mb-3">
            ✓{" "}
            {o.orderPlaced
              ? o.orderPendingApproval
                ? "Order submitted for approval"
                : "Order placed"
              : o.checkoutReady
              ? "Ready for checkout"
              : "Quote request sent"}
          </div>
          <div className="text-[18px] text-green-900 flex flex-col gap-1 mb-2">
            {o.orderPlaced && (
              <p>
                {o.orderPendingApproval
                  ? "Your order is waiting for your admin's approval — you'll see it in the Quotes section below."
                  : "Cardinal received your order and will follow up shortly."}
              </p>
            )}
            {o.quoteSent && (
              <p>
                {o.quotePendingApproval
                  ? "Your quote request is waiting for your admin's approval."
                  : "Cardinal will price the quote-only items and reply with a Quote."}
              </p>
            )}
            {o.checkoutReady && (
              <p>Your in-stock items are in the cart, ready to pay for.</p>
            )}
          </div>
          {confirmation.po && (
            <p className="text-[16px] text-green-900 mb-4">
              PO number: <span className="font-mono">{confirmation.po}</span>
            </p>
          )}
          <div className="flex justify-center gap-3">
            {o.checkoutReady && (
              <Button
                variant="primary"
                size="large"
                className="h-12 text-[18px] bg-green-600 hover:bg-green-700"
                onClick={goToCheckout}
              >
                Continue to Checkout →
              </Button>
            )}
            <Button
              variant={o.checkoutReady ? "secondary" : "primary"}
              size="large"
              className="h-12 text-[18px]"
              onClick={() => setConfirmation(null)}
            >
              Start a new order
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  /* ---- Table row renderers ---- */

  const renderCatalogRow = (
    product: HttpTypes.StoreProduct,
    variant: HttpTypes.StoreProductVariant
  ) => {
    const row = productVariantToRow(product, variant)
    return renderRow(row, `${product.id}-${variant.id}`)
  }

  const renderRow = (row: VariantRow, key: string) => {
    const qty = rowQty[row.variantId] ?? 1
    const probe = rowToCartLine(row, qty)
    const quoteOnly = isQuoteOnlyLine(probe)
    const outOfStock =
      row.manageInventory &&
      row.inventoryQuantity != null &&
      row.inventoryQuantity <= 0

    return (
      <Table.Row key={key} className="[&>td]:py-[12px]">
        <Table.Cell className="text-center align-middle">
          <button
            type="button"
            onClick={() => toggleFavorite(row)}
            aria-label={
              favoriteVariantIds.has(row.variantId)
                ? `Remove ${row.sku} from favorites`
                : `Save ${row.sku} to favorites`
            }
            aria-pressed={favoriteVariantIds.has(row.variantId)}
            className={`text-[26px] leading-none px-2 py-0.5 rounded-md hover:bg-amber-50 ${
              favoriteVariantIds.has(row.variantId)
                ? "text-amber-500 hover:text-amber-600"
                : "text-neutral-300 hover:text-amber-500"
            }`}
          >
            {favoriteVariantIds.has(row.variantId) ? "★" : "☆"}
          </button>
        </Table.Cell>
        <Table.Cell className="align-middle">
          <div className="font-mono text-[18px] font-semibold">{row.sku}</div>
          <div className="text-[15px] text-neutral-600">{row.title}</div>
        </Table.Cell>
        <Table.Cell className="align-middle">
          {row.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.thumbnail}
              alt={row.title}
              className="h-14 w-14 object-cover rounded"
            />
          ) : (
            <div className="h-14 w-14 bg-neutral-100 rounded" />
          )}
        </Table.Cell>
        <Table.Cell className="align-middle text-[18px] tabular-nums">
          {row.unitPrice && row.unitPrice > 0 ? (
            fmt(row.unitPrice, row.currencyCode)
          ) : (
            <span className="text-amber-700 text-[15px] font-semibold">
              Quote only
            </span>
          )}
        </Table.Cell>
        <Table.Cell className="align-middle text-[16px]">
          {!row.manageInventory ? (
            <span className="text-green-700">In stock</span>
          ) : outOfStock ? (
            <span className="text-amber-700 font-semibold">
              Out of stock — quote only
            </span>
          ) : (
            <span className="text-green-700">
              {row.inventoryQuantity} in stock
            </span>
          )}
        </Table.Cell>
        <Table.Cell className="align-middle">
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) =>
              setRowQty((prev) => ({
                ...prev,
                [row.variantId]: Math.max(1, Number(e.target.value) || 1),
              }))
            }
            className="w-20 h-12 text-[16px]"
            aria-label={`Quantity for ${row.sku}`}
          />
          {quoteOnly &&
            row.manageInventory &&
            row.inventoryQuantity != null &&
            row.inventoryQuantity > 0 &&
            qty > row.inventoryQuantity && (
              <div className="text-[13px] text-amber-700 font-semibold mt-1">
                Over stock — quote only
              </div>
            )}
        </Table.Cell>
        <Table.Cell className="align-middle">
          <Button
            variant="secondary"
            className="h-12 px-5 text-[16px]"
            onClick={() => addRowToOrder(rowToCartLine(row, qty))}
          >
            Add
          </Button>
        </Table.Cell>
      </Table.Row>
    )
  }

  const pagedCatalog = filteredVariants.slice(pageStart, pageStart + PAGE_SIZE)
  const pagedFavorites = favoriteRows.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <div className="flex flex-col gap-y-5" data-testid="quick-order">
      <header>
        <h2 className="text-xl-semi m-0">Quick Order</h2>
        <p className="text-[16px] text-neutral-500">
          Search by part number, set quantities, and place your order or
          request a quote — all from this table.
        </p>
      </header>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
        <Input
          placeholder="Search part number or name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isSearching}
          className="h-12 text-[16px]"
        />
        <Button
          type="submit"
          disabled={isSearching}
          className="h-12 px-6 text-[16px]"
        >
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {/* PO Upload — drop a purchase order, verify the Read-Out, load it
          into this same table, then use the normal submit buttons. */}
      <PoUpload currencyCode={currencyCode} onLoad={handlePoLoad} />

      <div className="flex items-center gap-3">
        <span className="text-[16px] font-medium text-neutral-600">Show:</span>
        <Button
          variant={favView === "all" ? "primary" : "secondary"}
          onClick={() => setFavView("all")}
          aria-pressed={favView === "all"}
          className="h-12 px-5 text-[16px]"
        >
          All parts
        </Button>
        <Button
          variant={favView === "favorites" ? "primary" : "secondary"}
          onClick={() => setFavView("favorites")}
          aria-pressed={favView === "favorites"}
          className="h-12 px-5 text-[16px]"
        >
          ★ Favorites ({favorites.length})
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="text-center">
                Favorite
              </Table.HeaderCell>
              <Table.HeaderCell>Part</Table.HeaderCell>
              <Table.HeaderCell>Picture</Table.HeaderCell>
              <Table.HeaderCell>Price</Table.HeaderCell>
              <Table.HeaderCell>Stock</Table.HeaderCell>
              <Table.HeaderCell>Qty</Table.HeaderCell>
              <Table.HeaderCell>Add</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {favView === "all" &&
              pagedCatalog.map(({ product, variant }) =>
                renderCatalogRow(product, variant)
              )}
            {favView === "favorites" &&
              pagedFavorites.map((row) => renderRow(row, row.variantId))}
            {rowCount === 0 && (
              <Table.Row>
                <td
                  colSpan={7}
                  className="text-center text-neutral-500 px-4 py-4 text-[16px]"
                >
                  {favView === "favorites"
                    ? favorites.length === 0
                      ? "You haven't starred any parts yet. Click the ☆ to save a part here."
                      : `No favorites match "${searchTerm}".`
                    : searchTerm
                    ? `No matches for "${searchTerm}". Try a different part number.`
                    : "No products found."}
                </td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>

      {rowCount > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 -mt-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 text-[18px] rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            ←
          </button>
          <span className="text-[15px] text-neutral-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 text-[18px] rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            →
          </button>
        </div>
      )}

      {/* In-progress order preview */}
      {lines.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-[18px] font-semibold mb-2">
            In your order ({lines.length})
          </h3>
          <ul className="flex flex-col gap-y-1">
            {lines.map((line) => {
              const quoteOnly = isQuoteOnlyLine(line)
              return (
                <li
                  key={line.variantId}
                  className="flex items-center justify-between gap-3 py-2 border-b border-neutral-100 last:border-b-0"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-[16px]">{line.sku}</span>
                    <span className="text-[14px] text-neutral-500 truncate">
                      {line.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {quoteOnly ? (
                      <span className="text-[14px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                        Quote only
                      </span>
                    ) : (
                      <span className="text-[16px] tabular-nums">
                        {fmt((line.unitPrice ?? 0) * line.qty, line.currencyCode)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => updateQty(line.variantId, line.qty - 1)}
                      disabled={line.qty <= 1}
                      aria-label={`Decrease ${line.sku} quantity`}
                      className="w-10 h-10 flex items-center justify-center rounded border border-neutral-200 text-[18px] hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="text-[16px] font-medium w-8 text-center">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.variantId, line.qty + 1)}
                      aria-label={`Increase ${line.sku} quantity`}
                      className="w-10 h-10 flex items-center justify-center rounded border border-neutral-200 text-[18px] hover:bg-neutral-100"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLine(line.variantId)}
                      aria-label={`Remove ${line.sku}`}
                      className="w-10 h-10 flex items-center justify-center rounded border border-neutral-200 text-[18px] text-red-700 hover:bg-red-50 ml-1"
                    >
                      ×
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Plan summary + submit */}
          <div className="mt-4 flex flex-col gap-3">
            {plan.payLines.length > 0 && (
              <div className="flex justify-between text-[17px]">
                <span className="text-neutral-600">
                  Payable now ({plan.payLines.length}{" "}
                  {plan.payLines.length === 1 ? "item" : "items"})
                </span>
                <span className="font-semibold tabular-nums">
                  {fmt(plan.payableTotal)}
                </span>
              </div>
            )}
            {plan.quoteLines.length > 0 && (
              <p className="text-[15px] text-amber-800 m-0">
                {plan.path === "quote_all"
                  ? "This order is over 120 lbs and under $7,500, so the whole order will be quoted by Cardinal."
                  : `${plan.quoteLines.length} ${
                      plan.quoteLines.length === 1 ? "item" : "items"
                    } will be sent to Cardinal as a Quote Request.`}
              </p>
            )}
            <div className="flex justify-end gap-3">
              {plan.payLines.length > 0 &&
                plan.path !== "quote_all" &&
                plan.path !== "quote_only" && (
                  <Button
                    variant="secondary"
                    size="large"
                    className="h-12 px-6 text-[18px]"
                    onClick={() => {
                      setQuoteEverything(true)
                      setReviewOpen(true)
                    }}
                    data-testid="quick-order-quote-instead"
                  >
                    Submit Quote Request
                  </Button>
                )}
              <Button
                variant="primary"
                size="large"
                className="h-12 px-8 text-[18px] bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setQuoteEverything(false)
                  setReviewOpen(true)
                }}
                data-testid="quick-order-submit"
              >
                {plan.path === "invoice" && "Place Order"}
                {plan.path === "deposit" && "Place Order (50% deposit)"}
                {plan.path === "checkout" && "Review & Pay"}
                {(plan.path === "quote_all" || plan.path === "quote_only") &&
                  "Submit Quote Request"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <OrderReviewDrawer
        open={reviewOpen}
        onClose={() => {
          setReviewOpen(false)
          setQuoteEverything(false)
        }}
        plan={reviewPlan}
        addresses={addresses}
        countryCode={countryCode}
        currencyCode={currencyCode}
        poPrefill={poPrefill}
        notesPrefill={notesPrefill}
        onSubmit={handleReviewSubmit}
        onGoToCheckout={goToCheckout}
      />

      <Toaster />
    </div>
  )
}
