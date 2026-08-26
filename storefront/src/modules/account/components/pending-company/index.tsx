import { Company } from "@lib/data/companies"
import WelcomeCodeBanner from "../welcome-code-banner"

type Props = { company: Company }

/* The waiting screen a Team Member sees while Cardinal reviews the Company. */
const PendingCompany = ({ company }: Props) => {
  return (
    <div className="flex flex-col gap-6" data-testid="pending-company">
      <div>
        <h2 className="text-xl-semi mb-2">We&apos;re reviewing {company.name}</h2>
        <p className="text-base-regular text-ui-fg-base m-0">
          Your company account is set up. Cardinal is checking it now — usually
          within one business day. You&apos;ll get an email the moment your
          Dashboard is unlocked. Until then you can keep shopping the site as usual.
        </p>
      </div>
      {company.welcome_code && <WelcomeCodeBanner code={company.welcome_code} />}
    </div>
  )
}

export default PendingCompany
