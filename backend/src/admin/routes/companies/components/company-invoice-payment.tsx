import { Switch, Text } from "@medusajs/ui"
import { AdminCompany, useSetInvoicePayment } from "../../../hooks/companies"

/* Toggle whether this Company may pay by invoice. ON: every order,
   any size or weight, is placed unpaid and billed offline. OFF: the
   weight/total payment rules apply. */
export const CompanyInvoicePayment = ({ company }: { company: AdminCompany }) => {
  const setInvoicePayment = useSetInvoicePayment(company.id)
  const enabled = !!company.invoice_payment_enabled

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={enabled}
        disabled={setInvoicePayment.isPending}
        onCheckedChange={(next) => setInvoicePayment.mutate(next)}
      />
      <Text size="small" className="text-ui-fg-subtle">
        {enabled
          ? "Orders are placed unpaid and billed offline — any size or weight."
          : "Standard payment rules apply (pay in full, quote, or 50% deposit)."}
      </Text>
    </div>
  )
}
