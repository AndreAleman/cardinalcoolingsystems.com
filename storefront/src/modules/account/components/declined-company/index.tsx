import { Company } from "@lib/data/companies"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = { company: Company }

/* What a Team Member of a Declined Company sees instead of the Dashboard. */
const DeclinedCompany = ({ company }: Props) => (
  <div className="flex flex-col gap-4" data-testid="declined-company">
    <h2 className="text-xl-semi m-0">We couldn&apos;t set up a dashboard for {company.name}</h2>
    <p className="text-base-regular text-ui-fg-base m-0">
      You can still order from the site as usual. If you think this is a
      mistake,{" "}
      <LocalizedClientLink href="/contact" className="underline">
        contact us
      </LocalizedClientLink>{" "}
      and we&apos;ll take another look.
    </p>
  </div>
)

export default DeclinedCompany
