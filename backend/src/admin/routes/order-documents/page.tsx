import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar, Plus, Trash, ArrowDownTray } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  IconButton,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

// ── Types ────────────────────────────────────────────────────────────────────

type ItemRow = {
  description: string
  spec: string
  sku: string
  quantity: string
  unitCost: string
  unitPrice: string
}

type InvoiceResult = {
  id: string
  status: "draft"
  total: number
  currency: string
  dashboardUrl: string
}

type DocsResult = {
  packingSlipPdfBase64: string
  purchaseOrderPdfBase64: string
  poNumber: string
  invoice: InvoiceResult
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_VENDOR = {
  name: "Sanitube",
  line1: "180 Contractors Way,",
  line2: "",
  city: "Lakeland, FL",
  postal: "33801",
}

const emptyItem = (): ItemRow => ({
  description: "",
  spec: "",
  sku: "",
  quantity: "1",
  unitCost: "",
  unitPrice: "",
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function downloadBase64Pdf(base64: string, filename: string) {
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  const blob = new Blob([arr], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

// ── Page ─────────────────────────────────────────────────────────────────────

const OrderDocumentsRoute = () => {
  const [orderNumber, setOrderNumber] = useState("")
  const [clientPoNumber, setClientPoNumber] = useState("")

  const [custName, setCustName] = useState("")
  const [custEmail, setCustEmail] = useState("")
  const [custLine1, setCustLine1] = useState("")
  const [custLine2, setCustLine2] = useState("")
  const [custCity, setCustCity] = useState("")
  const [custState, setCustState] = useState("")
  const [custPostal, setCustPostal] = useState("")

  const [vendorName, setVendorName] = useState(DEFAULT_VENDOR.name)
  const [vendorLine1, setVendorLine1] = useState(DEFAULT_VENDOR.line1)
  const [vendorLine2, setVendorLine2] = useState(DEFAULT_VENDOR.line2)
  const [vendorCity, setVendorCity] = useState(DEFAULT_VENDOR.city)
  const [vendorPostal, setVendorPostal] = useState(DEFAULT_VENDOR.postal)

  const [items, setItems] = useState<ItemRow[]>([emptyItem()])
  const [shipping, setShipping] = useState("")
  const [notes, setNotes] = useState("")

  const [result, setResult] = useState<DocsResult | null>(null)

  const updateItem = (idx: number, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    )
  }
  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (idx: number) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))

  // Live invoice total preview (client prices + shipping)
  const invoiceTotal = useMemo(() => {
    const itemsTotal = items.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0
      const p = parseFloat(it.unitPrice) || 0
      return sum + q * p
    }, 0)
    return itemsTotal + (parseFloat(shipping) || 0)
  }, [items, shipping])

  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      sdk.client.fetch<DocsResult>("/admin/order-documents", {
        method: "POST",
        body,
      }),
    onSuccess: (data) => {
      setResult(data)
      toast.success("Documents generated", {
        description: `Packing slip, PO ${data.poNumber}, and a Stripe draft invoice are ready.`,
      })
    },
    onError: (err: any) => {
      toast.error("Couldn't generate documents", {
        description: err?.message ?? "Please check the fields and try again.",
      })
    },
  })

  const handleGenerate = () => {
    // Light client-side checks; the server validates strictly.
    if (!orderNumber.trim()) return toast.error("Order number is required")
    if (!custName.trim() || !custEmail.trim())
      return toast.error("Customer name and email are required")
    if (!custLine1.trim() || !custCity.trim() || !custPostal.trim())
      return toast.error("Customer address (line 1, city, postal) is required")
    const validItems = items.filter((it) => it.description.trim())
    if (validItems.length === 0) return toast.error("Add at least one line item")

    setResult(null)
    mutation.mutate({
      orderNumber: orderNumber.trim(),
      clientPoNumber: clientPoNumber.trim(),
      customer: {
        name: custName.trim(),
        email: custEmail.trim(),
        address: {
          line1: custLine1.trim(),
          line2: custLine2.trim(),
          city: custCity.trim(),
          state: custState.trim(),
          postal: custPostal.trim(),
        },
      },
      vendor: {
        name: vendorName.trim(),
        address: {
          line1: vendorLine1.trim(),
          line2: vendorLine2.trim(),
          city: vendorCity.trim(),
          postal: vendorPostal.trim(),
        },
      },
      items: validItems.map((it) => ({
        description: it.description.trim(),
        spec: it.spec.trim(),
        sku: it.sku.trim(),
        quantity: parseInt(it.quantity, 10) || 1,
        unitCost: parseFloat(it.unitCost) || 0,
        unitPrice: parseFloat(it.unitPrice) || 0,
      })),
      shipping: parseFloat(shipping) || 0,
      notes: notes.trim(),
    })
  }

  const pending = mutation.isPending

  return (
    <Container className="flex flex-col gap-y-6 p-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-ui-border-base">
        <Heading level="h1">Order Documents</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          One form → packing slip + purchase order PDFs and a Stripe draft invoice.
          Enter your vendor cost and the client price per line. No sales tax is applied.
        </Text>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-y-8">
        {/* Order info */}
        <Section title="Order">
          <Field label="Order #" required>
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="1012" />
          </Field>
          <Field label="Client PO #">
            <Input value={clientPoNumber} onChange={(e) => setClientPoNumber(e.target.value)} placeholder="0455636" />
          </Field>
        </Section>

        {/* Customer */}
        <Section title="Customer (ships to / invoiced)">
          <Field label="Name" required>
            <Input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="empirical foods, Inc. - SSC" />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="ap@customer.com" />
          </Field>
          <Field label="Address line 1" required>
            <Input value={custLine1} onChange={(e) => setCustLine1(e.target.value)} placeholder="390 164th St." />
          </Field>
          <Field label="Address line 2">
            <Input value={custLine2} onChange={(e) => setCustLine2(e.target.value)} placeholder="Suite 200 (optional)" />
          </Field>
          <Field label="City" required>
            <Input value={custCity} onChange={(e) => setCustCity(e.target.value)} placeholder="South Sioux City" />
          </Field>
          <Field label="State">
            <Input value={custState} onChange={(e) => setCustState(e.target.value)} placeholder="NE" />
          </Field>
          <Field label="Postal code" required>
            <Input value={custPostal} onChange={(e) => setCustPostal(e.target.value)} placeholder="68776" />
          </Field>
        </Section>

        {/* Vendor */}
        <Section title="Vendor (purchase order)">
          <Field label="Vendor name" required>
            <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
          </Field>
          <Field label="Address line 1">
            <Input value={vendorLine1} onChange={(e) => setVendorLine1(e.target.value)} />
          </Field>
          <Field label="Address line 2">
            <Input value={vendorLine2} onChange={(e) => setVendorLine2(e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={vendorCity} onChange={(e) => setVendorCity(e.target.value)} />
          </Field>
          <Field label="Postal code">
            <Input value={vendorPostal} onChange={(e) => setVendorPostal(e.target.value)} />
          </Field>
        </Section>

        {/* Line items */}
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <Text size="small" weight="plus">Line items</Text>
            <Button variant="secondary" size="small" onClick={addItem} type="button">
              <Plus /> Add item
            </Button>
          </div>

          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_0.6fr_0.9fr_0.9fr_auto] gap-2 px-1">
            {["Description", "Spec", "SKU", "Qty", "Vendor cost", "Client price", ""].map((h) => (
              <Text key={h} size="xsmall" className="text-ui-fg-subtle">{h}</Text>
            ))}
          </div>

          {items.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-2 md:grid-cols-[2fr_1.5fr_1fr_0.6fr_0.9fr_0.9fr_auto] gap-2 items-center"
            >
              <Input value={it.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="Butt Weld Reducing Tee" />
              <Input value={it.spec} onChange={(e) => updateItem(idx, "spec", e.target.value)} placeholder="316, 1in x 1/2in" />
              <Input value={it.sku} onChange={(e) => updateItem(idx, "sku", e.target.value)} placeholder="7WRT6P-100050" />
              <Input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} placeholder="8" />
              <Input type="number" min="0" step="0.01" value={it.unitCost} onChange={(e) => updateItem(idx, "unitCost", e.target.value)} placeholder="22.70" />
              <Input type="number" min="0" step="0.01" value={it.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} placeholder="34.00" />
              <IconButton variant="transparent" type="button" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                <Trash />
              </IconButton>
            </div>
          ))}
        </div>

        {/* Shipping + notes */}
        <Section title="Shipping & notes">
          <Field label="Shipping charge (client)">
            <Input type="number" min="0" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="0.00" />
          </Field>
          <div className="col-span-full">
            <Label size="small" weight="plus">Notes (purchase order)</Label>
            <Textarea
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Standard Shipping. Please send tracking number when available."
              rows={2}
            />
          </div>
        </Section>

        {/* Footer / actions */}
        <div className="flex items-center justify-between border-t border-ui-border-base pt-5">
          <Text size="small" className="text-ui-fg-subtle">
            Invoice total (client): <span className="text-ui-fg-base font-medium">{usd(invoiceTotal)}</span>
          </Text>
          <Button variant="primary" size="base" onClick={handleGenerate} isLoading={pending} disabled={pending}>
            Generate documents
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-y-3 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
            <Text size="small" weight="plus">Ready</Text>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={() =>
                  downloadBase64Pdf(result.packingSlipPdfBase64, `packing-slip-${result.invoice ? orderNumber : "doc"}.pdf`)
                }
              >
                <ArrowDownTray /> Packing slip
              </Button>
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={() => downloadBase64Pdf(result.purchaseOrderPdfBase64, `${result.poNumber}.pdf`)}
              >
                <ArrowDownTray /> Purchase order ({result.poNumber})
              </Button>
              <Button variant="secondary" size="small" type="button" asChild>
                <a href={result.invoice.dashboardUrl} target="_blank" rel="noreferrer">
                  <CurrencyDollar /> Open draft invoice ({usd(result.invoice.total / 100)})
                </a>
              </Button>
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle">
              The Stripe invoice is a <strong>draft</strong> — review it in Stripe and hit “Send” there to email the customer.
            </Text>
          </div>
        )}
      </div>
    </Container>
  )
}

// ── Small layout helpers ─────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-y-3">
    <Text size="small" weight="plus">{title}</Text>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  </div>
)

const Field = ({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-y-1">
    <Label size="small" weight="plus">
      {label}
      {required && <span className="text-ui-fg-error"> *</span>}
    </Label>
    {children}
  </div>
)

export const config = defineRouteConfig({
  label: "Order Documents",
  icon: CurrencyDollar,
})

export default OrderDocumentsRoute
