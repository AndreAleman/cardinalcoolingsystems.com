import { Container, Heading, Table, Text, Toaster } from "@medusajs/ui"
import { useCompany } from "../../../hooks/companies"
import { CompanyStatusBadge } from "../components/company-status-badge"
import { DecideButtons } from "../components/decide-buttons"
import { TeamMemberRow } from "../components/team-member-row"
import { CompanyPriceList } from "../components/company-price-list"
import { CompanyInvoicePayment } from "../components/company-invoice-payment"
import { CompanyLocations } from "../components/company-locations"

/*
  /app/companies/:companyId — the id is the segment after "companies".
  Read from the path because react-router-dom is not resolvable from
  this package under pnpm's strict layout.
*/
const companyIdFromPath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean)
  return parts[parts.indexOf("companies") + 1] ?? ""
}

const CompanyDetailPage = () => {
  const companyId = companyIdFromPath()
  const { data, isPending } = useCompany(companyId)
  const company = data?.company

  if (isPending) {
    return <Container className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">Loading…</Text></Container>
  }
  if (!company) {
    return <Container className="px-6 py-4"><Text>Company not found</Text></Container>
  }

  const rows: [string, React.ReactNode][] = [
    ["Status", <CompanyStatusBadge status={company.status} />],
    ["Email", company.email],
    ["Phone", company.phone || "—"],
    ["Address", [company.address, company.city, company.state, company.zip].filter(Boolean).join(", ") || "—"],
    ["Currency", company.currency_code?.toUpperCase() || "—"],
    ["Welcome code", company.welcome_code || "—"],
    ["Pricing", <CompanyPriceList company={company} />],
    ["Invoice payment", <CompanyInvoicePayment company={company} />],
  ]

  return (
    <div className="flex flex-col gap-4">
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-ui-border-base">
          <Heading className="font-sans font-medium h1-core">{company.name}</Heading>
          <DecideButtons company={company} />
        </div>
        <Table>
          <Table.Body>
            {rows.map(([label, value]) => (
              <Table.Row key={label}>
                <Table.Cell className="font-medium font-sans txt-compact-small w-48">{label}</Table.Cell>
                <Table.Cell>{value}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Container>

      <Container className="flex flex-col p-0 overflow-hidden">
        <CompanyLocations company={company} />
      </Container>

      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-ui-border-base">
          <Text size="small" leading="compact" weight="plus">Team</Text>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Role</Table.HeaderCell>
              <Table.HeaderCell>Location</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(company.employees ?? []).map((member) => (
              <TeamMemberRow
                key={member.id}
                companyId={company.id}
                member={member}
                locations={company.locations ?? []}
              />
            ))}
          </Table.Body>
        </Table>
      </Container>
      <Toaster />
    </div>
  )
}

export default CompanyDetailPage
