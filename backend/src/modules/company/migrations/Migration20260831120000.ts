import { Migration } from "@mikro-orm/migrations";

/* Hand-written. Per-Company invoice switch: Cardinal decides at approval
   time whether a Company may pay by invoice (all order sizes). */
export class Migration20260831120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "invoice_payment_enabled" boolean NOT NULL DEFAULT false;`
    );
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "company" DROP COLUMN IF EXISTS "invoice_payment_enabled";`);
  }
}
