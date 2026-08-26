import { CompanyMembership } from "@lib/data/companies"

type DashboardShellProps = {
  membership: CompanyMembership | null
  children: React.ReactNode
}

/*
  The one-page Dashboard's frame. Ticket #12 only names the Company;
  later tickets stack Quick Order, Quotes, Orders and Team inside it.
*/
const DashboardShell = ({ membership, children }: DashboardShellProps) => {
  return (
    <div data-testid="dashboard-shell">
      {membership && (
        <div
          className="flex items-baseline justify-between mb-6 pb-4 border-b border-gray-200"
          data-testid="company-header"
          data-value={membership.company.id}
        >
          <h1 className="text-2xl-semi" data-testid="company-name">
            {membership.company.name}
          </h1>
          <span className="text-small-regular text-ui-fg-subtle uppercase">
            {membership.role}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

export default DashboardShell
