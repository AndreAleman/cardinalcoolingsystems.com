import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingStorefront } from "@medusajs/icons"
import { Button, Container, Heading, Table, Text, Toaster } from "@medusajs/ui"
import { useState } from "react"
import { CompanyStatus, useCompanies } from "../../hooks/companies"
import { CompanyStatusBadge } from "./components/company-status-badge"
import { DecideButtons } from "./components/decide-buttons"

const FILTERS: { label: string; status?: CompanyStatus }[] = [
  { label: "Pending", status: "pending" },
  { label: "Approved", status: "approved" },
  { label: "Declined", status: "declined" },
  { label: "All" },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const CompaniesPage = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(FILTERS[0])
  const { data, isPending } = useCompanies(filter.status)
  const companies = data?.companies ?? []

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-ui-border-base">
          <div>
            <Heading className="font-sans font-medium h1-core">Companies</Heading>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Pending companies are waiting for you. Approving one unlocks their dashboard.
            </Text>
          </div>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <Button
                key={f.label}
                size="small"
                variant={f.label === filter.label ? "secondary" : "transparent"}
                onClick={() => setFilter(f)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
        {isPending ? (
          <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">Loading…</Text></div>
        ) : companies.length === 0 ? (
          <div className="px-6 py-4"><Text size="small" className="text-ui-fg-subtle">Nothing here.</Text></div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Company</Table.HeaderCell>
                <Table.HeaderCell>Contact</Table.HeaderCell>
                <Table.HeaderCell>Team</Table.HeaderCell>
                <Table.HeaderCell>Signed up</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {companies.map((company) => (
                <Table.Row
                  key={company.id}
                  className="cursor-pointer"
                  onClick={() => (window.location.href = `/app/companies/${company.id}`)}
                >
                  <Table.Cell>{company.name}</Table.Cell>
                  <Table.Cell>{company.email}</Table.Cell>
                  <Table.Cell>{company.employees?.length ?? 0}</Table.Cell>
                  <Table.Cell>{formatDate(company.created_at)}</Table.Cell>
                  <Table.Cell><CompanyStatusBadge status={company.status} /></Table.Cell>
                  <Table.Cell onClick={(e) => e.stopPropagation()}>
                    <DecideButtons company={company} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
      <Toaster />
    </>
  )
}

export const config = defineRouteConfig({
  label: "Companies",
  icon: BuildingStorefront,
})

export default CompaniesPage
