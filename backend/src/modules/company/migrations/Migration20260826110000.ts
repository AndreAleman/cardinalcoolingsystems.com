import { Migration } from "@mikro-orm/migrations";

/* Hand-written. A Company can own one company-exclusive Custom Price List. */
export class Migration20260826110000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`ALTER TABLE "company" ADD COLUMN IF NOT EXISTS "price_list_id" text NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_company_price_list_id_unique" ON "company" ("price_list_id") WHERE "price_list_id" IS NOT NULL AND deleted_at IS NULL;`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_company_price_list_id_unique";`);
    this.addSql(`ALTER TABLE "company" DROP COLUMN IF EXISTS "price_list_id";`);
  }
}
