import { Migration } from "@mikro-orm/migrations";

/* Hand-written. Approval module: Approval, ApprovalStatus, ApprovalSettings.
   Ported from the reference implementation minus sales-manager approval;
   status columns carry an explicit 'pending' default. */
export class Migration20260831121000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE TABLE IF NOT EXISTS "approval" (
      "id" text NOT NULL,
      "cart_id" text NOT NULL,
      "type" text CHECK ("type" IN ('admin')) NOT NULL,
      "status" text CHECK ("status" IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
      "created_by" text NOT NULL,
      "handled_by" text NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "approval_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_approval_cart_id" ON "approval" ("cart_id") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_approval_deleted_at" ON "approval" ("deleted_at") WHERE deleted_at IS NULL;`
    );

    this.addSql(`CREATE TABLE IF NOT EXISTS "approval_status" (
      "id" text NOT NULL,
      "cart_id" text NOT NULL,
      "status" text CHECK ("status" IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "approval_status_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_approval_status_cart_id_unique" ON "approval_status" ("cart_id") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_approval_status_deleted_at" ON "approval_status" ("deleted_at") WHERE deleted_at IS NULL;`
    );

    this.addSql(`CREATE TABLE IF NOT EXISTS "approval_settings" (
      "id" text NOT NULL,
      "company_id" text NOT NULL,
      "requires_admin_approval" boolean NOT NULL DEFAULT false,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "approval_settings_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_approval_settings_company_id_unique" ON "approval_settings" ("company_id") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_approval_settings_deleted_at" ON "approval_settings" ("deleted_at") WHERE deleted_at IS NULL;`
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "approval" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "approval_status" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "approval_settings" CASCADE;`);
  }
}
