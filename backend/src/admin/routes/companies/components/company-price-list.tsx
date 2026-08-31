import { Button, Select, Text } from "@medusajs/ui"
import {
  AdminCompany,
  useAssignCompanyPriceList,
  useCompanyPriceLists,
} from "../../../hooks/companies"

const STANDARD = "standard-catalog"

/* Pick an active Custom Price List; the backend scopes it to this Company only. */
export const CompanyPriceList = ({ company }: { company: AdminCompany }) => {
  const { data: priceLists, isPending } = useCompanyPriceLists()
  const assign = useAssignCompanyPriceList(company.id)
  const value = company.price_list_id ?? STANDARD

  return (
    <div className="flex items-center gap-2">
      <Select
        size="small"
        value={value}
        disabled={isPending || assign.isPending}
        onValueChange={(next) => assign.mutate(next === STANDARD ? null : next)}
      >
        <Select.Trigger className="w-72">
          <Select.Value placeholder="Choose a price list" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value={STANDARD}>Standard catalog prices</Select.Item>
          {(priceLists ?? []).map((priceList) => (
            <Select.Item key={priceList.id} value={priceList.id}>
              {priceList.title || priceList.id}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      {assign.isPending && <Button size="small" variant="secondary" isLoading>Saving</Button>}
      <Text size="small" className="text-ui-fg-subtle">
        Custom lists are scoped to this Company.
      </Text>
    </div>
  )
}
