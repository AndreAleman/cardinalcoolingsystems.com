import { CompanyMembership } from "@lib/data/companies"
import PendingCompany from "../pending-company"
import DeclinedCompany from "../declined-company"
import WelcomeCodeBanner from "../welcome-code-banner"

type DashboardShellProps = {
  membership: CompanyMembership | null
  children: React.ReactNode
}

/*
  The one-page Dashboard's frame: Company name, the Welcome Code while
  it is live, and the waiting screen for a Pending Company. Later
  tickets stack Quick Order, Quotes, Orders and Team inside it.
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
      {membership?.company.status === "pending" ? (
        <PendingCompany company={membership.company} />
      ) : membership?.company.status === "declined" ? (
        <DeclinedCompany company={membership.company} />
      ) : (
        <>
          {membership?.company.welcome_code && (
            <div className="mb-6">
              <WelcomeCodeBanner code={membership.company.welcome_code} />
            </div>
          )}
          {children}
        </>
      )}
    </div>
  )
}

export default DashboardShell
