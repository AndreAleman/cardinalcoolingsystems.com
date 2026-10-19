import { Migration } from '@mikro-orm/migrations';

export class Migration20261019015851 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "build_configuration" ("id" text not null, "builder_type" text not null, "config_key" text not null, "options" jsonb not null, "bom" jsonb not null, "pricing_mode" text check ("pricing_mode" in ('instant', 'quote')) not null, "instant_price" numeric null, "weight_lb" real not null, "part_number" text not null, "created_by_domain" text null, "created_by_customer_id" text null, "resolve_count" integer not null default 1, "last_resolved_at" timestamptz not null, "raw_instant_price" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "build_configuration_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_build_configuration_builder_type" ON "build_configuration" (builder_type) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_build_configuration_config_key_unique" ON "build_configuration" (config_key) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_build_configuration_deleted_at" ON "build_configuration" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_build_configuration_pricing_mode" ON "build_configuration" (pricing_mode) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "build_configuration" cascade;`);
  }

}
