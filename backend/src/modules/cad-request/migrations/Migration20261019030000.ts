import { Migration } from "@mikro-orm/migrations"

/* Hand-written. CAD Request module (Cardinal Builder plan B7), the schema of Sanitube's four
   cad_request migrations in one: `builder_type` (the five builders) replaces `fitting_type`, status
   includes `review`, `approved_at`/`approved_by`, `reject_reason`, and
   `cad_setting.require_review` default true (review is on from the start). No Lead module on
   Cardinal, so no `lead_id`. */
export class Migration20261019030000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "cad_package" (
      "id" text not null,
      "part_number" text not null,
      "cache_key" text not null,
      "builder_type" text check ("builder_type" in ('cdu-kit', 'row-manifold', 'transition', 'strainer', 'hose')) not null,
      "configuration" jsonb not null,
      "tables_hash" text not null,
      "generator_version" text not null,
      "drawing_version" integer not null,
      "status" text check ("status" in ('generating', 'ready', 'failed')) not null default 'generating',
      "step_key" text null,
      "pdf_key" text null,
      "step_bytes" integer null,
      "pdf_bytes" integer null,
      "step_sha256" text null,
      "pdf_sha256" text null,
      "counted_against_cap" boolean not null default false,
      "cap_day" text null,
      "generated_at" timestamptz null,
      "error" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "cad_package_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_package_part_number" ON "cad_package" ("part_number") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cad_package_cache_key_unique" ON "cad_package" ("cache_key") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_package_cap_day" ON "cad_package" ("cap_day") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_package_deleted_at" ON "cad_package" ("deleted_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "cad_request" (
      "id" text not null,
      "display_id" serial,
      "status" text check ("status" in ('pending', 'queued', 'review', 'emailed', 'ready', 'failed', 'rejected', 'blocked')) not null default 'pending',
      "builder_type" text check ("builder_type" in ('cdu-kit', 'row-manifold', 'transition', 'strainer', 'hose')) not null,
      "configuration" jsonb not null,
      "config_key" text not null,
      "part_number" text not null,
      "description" text not null,
      "is_customer" boolean not null default false,
      "customer_id" text null,
      "contact_name" text null,
      "company_name" text null,
      "email" text null,
      "client_ip" text null,
      "ip_source" text check ("ip_source" in ('forwarded', 'cf', 'xff', 'socket')) null,
      "source_page" text null,
      "counted" boolean not null default false,
      "block_reason" text check ("block_reason" in ('email_allowance', 'ip_daily')) null,
      "reject_reason" text check ("reject_reason" in ('spam', 'other')) null,
      "package_id" text null,
      "token_hash" text null,
      "token_expires_at" timestamptz null,
      "download_count" integer not null default 0,
      "last_downloaded_at" timestamptz null,
      "emailed_at" timestamptz null,
      "queued_at" timestamptz null,
      "released_at" timestamptz null,
      "released_by" text null,
      "approved_at" timestamptz null,
      "approved_by" text null,
      "attempts" integer not null default 0,
      "error" text null,
      "staff_notes" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "cad_request_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_request_part_number" ON "cad_request" ("part_number") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_request_email" ON "cad_request" ("email") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_request_client_ip" ON "cad_request" ("client_ip") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_cad_request_token_hash_unique" ON "cad_request" ("token_hash") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_request_deleted_at" ON "cad_request" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_request_email_created_at" ON "cad_request" ("email", "created_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_request_client_ip_created_at" ON "cad_request" ("client_ip", "created_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_request_status_queued_at" ON "cad_request" ("status", "queued_at") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "cad_setting" (
      "id" text not null,
      "daily_generation_cap" integer not null default 10,
      "require_review" boolean not null default true,
      "updated_by" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "cad_setting_pkey" primary key ("id")
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cad_setting_deleted_at" ON "cad_setting" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "cad_package" cascade;`)
    this.addSql(`drop table if exists "cad_request" cascade;`)
    this.addSql(`drop table if exists "cad_setting" cascade;`)
  }
}
