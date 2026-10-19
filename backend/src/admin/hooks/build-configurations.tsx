import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

export type BuilderTypeKey = "cdu-kit" | "row-manifold" | "transition" | "strainer" | "hose"

export type AdminBuildConfiguration = {
  id: string
  builder_type: BuilderTypeKey
  config_key: string
  options: Record<string, unknown>
  pricing_mode: "instant" | "quote"
  instant_price: number | null
  weight_lb: number
  part_number: string
  created_by_domain: string | null
  created_by_customer_id: string | null
  resolve_count: number
  last_resolved_at: string
  created_at: string
}

export type AdminBuildConfigurationsResponse = {
  build_configurations: AdminBuildConfiguration[]
  count: number
  limit: number
  offset: number
}

export type BuildConfigurationFilters = {
  builder_type?: BuilderTypeKey
  pricing_mode?: "instant" | "quote"
  sort: "resolve_count" | "recent"
}

export const useBuildConfigurations = (filters: BuildConfigurationFilters) =>
  useQuery({
    queryKey: ["build-configurations", filters],
    queryFn: () =>
      sdk.client.fetch<AdminBuildConfigurationsResponse>("/admin/build-configurations", {
        query: { ...filters, limit: 200 },
      }),
  })
