import { Migration } from "@mikro-orm/migrations";

/*
  Hand-written (never `medusa db:generate company`). Approved Domains:
  the email domains whose signups get instant access (ADR-0007).
  Existing Companies are untouched — they keep whatever status they
  have. Until the outreach CSV is imported the table is empty, which
  means every new signup is Pending (safe default).
*/
export class Migration20260920120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "approved_domain" (
        "id" text NOT NULL,
        "domain" text NOT NULL,
        "source" text CHECK ("source" IN ('import', 'approval')) NOT NULL DEFAULT 'import',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "approved_domain_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_approved_domain_domain_unique" ON "approved_domain" ("domain") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_approved_domain_deleted_at" ON "approved_domain" ("deleted_at") WHERE deleted_at IS NULL;`
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "approved_domain";`);
  }
}
