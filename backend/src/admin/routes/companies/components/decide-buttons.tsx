import { Button, usePrompt } from "@medusajs/ui"
import { AdminCompany, useDecideCompany } from "../../../hooks/companies"

/*
  Approve / Decline. Pending: both. Declined: Approve (reinstate).
  Approved: Decline — the ban hammer. Approved Domains get in without
  Cardinal looking first (ADR-0007), so an Approved Company must be
  declinable from here. Declining also takes the Company's email
  domain off the Approved Domain list; approving puts it on.
*/
export const DecideButtons = ({ company }: { company: AdminCompany }) => {
  const decide = useDecideCompany(company.id)
  const prompt = usePrompt()

  const decline = async () => {
    if (company.status === "approved") {
      const ok = await prompt({
        title: `Decline ${company.name}?`,
        description:
          "They lose the company dashboard right away, and new signups from their email domain will need your approval. You can approve them again later.",
        confirmText: "Decline",
        cancelText: "Cancel",
      })
      if (!ok) return
    }
    decide.mutate("decline")
  }

  return (
    <div className="flex gap-2">
      {company.status !== "approved" && (
        <Button
          size="small"
          variant="primary"
          isLoading={decide.isPending && decide.variables === "approve"}
          disabled={decide.isPending}
          onClick={() => decide.mutate("approve")}
        >
          Approve
        </Button>
      )}
      {company.status !== "declined" && (
        <Button
          size="small"
          variant={company.status === "approved" ? "danger" : "secondary"}
          isLoading={decide.isPending && decide.variables === "decline"}
          disabled={decide.isPending}
          onClick={decline}
        >
          Decline
        </Button>
      )}
    </div>
  )
}
