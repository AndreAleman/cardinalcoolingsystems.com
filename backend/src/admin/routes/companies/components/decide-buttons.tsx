import { Button } from "@medusajs/ui"
import { AdminCompany, useDecideCompany } from "../../../hooks/companies"

/*
  Approve / Decline for a Pending Company. A Declined Company can be
  reinstated (Approve only). An Approved Company shows nothing.
*/
export const DecideButtons = ({ company }: { company: AdminCompany }) => {
  const decide = useDecideCompany(company.id)
  if (company.status === "approved") return null
  return (
    <div className="flex gap-2">
      <Button
        size="small"
        variant="primary"
        isLoading={decide.isPending && decide.variables === "approve"}
        disabled={decide.isPending}
        onClick={() => decide.mutate("approve")}
      >
        Approve
      </Button>
      {company.status === "pending" && (
        <Button
          size="small"
          variant="secondary"
          isLoading={decide.isPending && decide.variables === "decline"}
          disabled={decide.isPending}
          onClick={() => decide.mutate("decline")}
        >
          Decline
        </Button>
      )}
    </div>
  )
}
