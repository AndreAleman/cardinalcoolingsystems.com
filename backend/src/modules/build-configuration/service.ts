import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils";
import type { Context } from "@medusajs/framework/types";
import { BuildConfiguration } from "./models";
import type { RecordResolveInput } from "./types";

class BuildConfigurationModuleService extends MedusaService({
  BuildConfiguration,
}) {
  /*
    Upsert by config_key (plan B5). A new Configuration is created with
    the caller's id; an existing one keeps its first creator (a missing
    creator is filled in once known) and gets the latest BOM and pricing.
    The counter is bumped in SQL so concurrent resolves never lose a hit.
  */
  @InjectManager()
  async recordResolve(
    input: RecordResolveInput,
    @MedusaContext() sharedContext: Context = {}
  ): Promise<{ id: string; created: boolean }> {
    const existing = await this.findByKey(input.config_key, sharedContext);
    if (!existing) {
      try {
        await this.createBuildConfigurations(
          { ...input, resolve_count: 1, last_resolved_at: new Date() } as any,
          sharedContext
        );
        return { id: input.id, created: true };
      } catch (err) {
        // Lost a race with a concurrent first resolve: fall through and bump.
        const again = await this.findByKey(input.config_key, sharedContext);
        if (!again) throw err;
        return this.bump(again, input, sharedContext);
      }
    }
    return this.bump(existing, input, sharedContext);
  }

  private async findByKey(configKey: string, sharedContext: Context) {
    const [row] = await this.listBuildConfigurations(
      { config_key: configKey },
      { take: 1 },
      sharedContext
    );
    return row ?? null;
  }

  private async bump(
    row: { id: string; created_by_domain?: string | null; created_by_customer_id?: string | null },
    input: RecordResolveInput,
    sharedContext: Context
  ): Promise<{ id: string; created: boolean }> {
    await this.updateBuildConfigurations(
      {
        id: row.id,
        bom: input.bom as any,
        pricing_mode: input.pricing_mode,
        instant_price: input.instant_price,
        weight_lb: input.weight_lb,
        part_number: input.part_number,
        last_resolved_at: new Date(),
        ...(!row.created_by_domain && input.created_by_domain
          ? { created_by_domain: input.created_by_domain }
          : {}),
        ...(!row.created_by_customer_id && input.created_by_customer_id
          ? { created_by_customer_id: input.created_by_customer_id }
          : {}),
      } as any,
      sharedContext
    );
    const manager = (sharedContext as any).manager;
    await manager.execute(
      `UPDATE "build_configuration" SET "resolve_count" = "resolve_count" + 1 WHERE "id" = ?`,
      [row.id]
    );
    return { id: row.id, created: false };
  }
}

export default BuildConfigurationModuleService;
