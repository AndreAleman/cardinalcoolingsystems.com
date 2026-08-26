import { Migration } from "@mikro-orm/migrations";

/* Hand-written. Invites: one email, one Company, one single-use token. */
export class Migration20260826100000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE TABLE IF NOT EXISTS "company_invite" (
      "id" text NOT NULL,
      "email" text NOT NULL,
      "token" text NOT NULL,
      "role" text CHECK ("role" IN ('member', 'manager', 'admin')) NOT NULL DEFAULT 'admin',
      "invited_by" text NULL,
      "expires_at" timestamptz NOT NULL,
      "accepted_at" timestamptz NULL,
      "company_id" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "company_invite_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_company_invite_token_unique" ON "company_invite" ("token") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_company_invite_company_id" ON "company_invite" ("company_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_company_invite_deleted_at" ON "company_invite" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`ALTER TABLE "company_invite" ADD CONSTRAINT "company_invite_company_id_foreign" FOREIGN KEY ("company_id") REFERENCES "company" ("id") ON UPDATE CASCADE ON DELETE CASCADE;`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "company_invite" CASCADE;`);
  }
}
