// The resolve pipeline shared by POST /store/build/resolve and POST /store/build/quote-lines:
// forgiving decode → cache → catalog (priced for the buyer) → pure resolve.

import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getBuilder, type BuilderType } from "../../../../lib/cpq-shared"
import { BUILD_CONFIGURATION_MODULE } from "../../../../modules/build-configuration"
import type BuildConfigurationModuleService from "../../../../modules/build-configuration/service"
import { RESOLVE_CACHE_TTL_MS, resolveCacheKey, TtlCache } from "./cache"
import { cachingEnabled, loadCatalog, loadStoreContext } from "./catalog"
import type { Buyer } from "./price-basis"
import { configurationIdFor } from "./quote-line"
import { candidateSkus, isoDate, resolveConfiguration, type ResolveResult } from "./resolver"

export type ResolveResponse = ResolveResult & { configuration_id: string }

const cache = new TtlCache<ResolveResult>(RESOLVE_CACHE_TTL_MS)

/** Test seam. */
export function clearResolveCache() {
  cache.clear()
}

export async function resolveBuild(
  container: MedusaContainer,
  input: { builder_type: BuilderType; options: Record<string, unknown>; buyer: Buyer; extraIgnored?: string[] }
): Promise<ResolveResponse> {
  const b = getBuilder(input.builder_type)
  const decoded = b.decode(input.options as any)
  const ignored = [...decoded.ignored, ...(input.extraIgnored ?? [])]
  const configKey = b.configKey(decoded.options)
  const key = resolveCacheKey(configKey, input.buyer.price_basis, input.buyer.customer_group_id)

  let result = cachingEnabled() ? cache.get(key) : undefined
  if (!result || result.priced_at !== isoDate()) {
    const store = await loadStoreContext(container)
    const catalog = await loadCatalog(container, candidateSkus(input.builder_type, decoded.options), {
      ...store,
      customer_group_id: input.buyer.customer_group_id,
    })
    result = resolveConfiguration({
      builder_type: input.builder_type,
      options: decoded.options,
      ignored: [],
      catalog,
      price_basis: input.buyer.price_basis,
      priced_at: isoDate(),
    })
    cache.set(key, result)
  }
  return { ...result, ignored, configuration_id: configurationIdFor(configKey) }
}

/** B5: upsert the Configuration. Fire-and-forget: a failure is logged, never surfaced. */
export function recordConfiguration(container: MedusaContainer, r: ResolveResponse, buyer: Buyer): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  return Promise.resolve()
    .then(() => {
      const service = container.resolve<BuildConfigurationModuleService>(BUILD_CONFIGURATION_MODULE)
      return service.recordResolve({
        id: r.configuration_id,
        builder_type: r.builder_type,
        config_key: r.config_key,
        options: r.options,
        bom: r.bom,
        pricing_mode: r.pricing_mode,
        instant_price: r.price_total,
        weight_lb: r.weight_lb_per_unit,
        part_number: r.part_number,
        created_by_domain: buyer.email_domain,
        created_by_customer_id: buyer.customer_id,
      })
    })
    .then(() => undefined)
    .catch((err: any) => {
      logger.warn(`[build] could not record configuration ${r.config_key}: ${err?.message ?? err}`)
    })
}
