import { Migration } from "@mikro-orm/migrations";

/*
  Hand-written (never `medusa db:generate company`). Adds the approval
  state and Welcome Code to Company. Companies that already exist were
  created by Cardinal by hand, so they are approved.
*/
export class Migration20260825120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "status" text CHECK ("status" IN ('pending', 'approved', 'declined')) NOT NULL DEFAULT 'pending';`
    );
    this.addSql(
      `ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "welcome_code" text NULL;`
    );
    this.addSql(`UPDATE "company" SET "status" = 'approved';`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "company" DROP COLUMN IF EXISTS "status";`);
    this.addSql(`ALTER TABLE "company" DROP COLUMN IF EXISTS "welcome_code";`);
  }
}
