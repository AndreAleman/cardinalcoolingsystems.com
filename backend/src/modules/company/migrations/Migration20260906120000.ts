import { Migration } from "@mikro-orm/migrations";

/*
  Hand-written (never `medusa db:generate company`). Locations: a
  Company's destination sites, managed by Cardinal in Medusa Admin.
  Creates the "location" table and gives Employee an optional home site
  (employee.location_id, nullable — no site means the role rule applies
  company-wide).
*/
export class Migration20260906120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "location" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "address_1" text NOT NULL,
        "address_2" text NULL,
        "city" text NOT NULL,
        "state" text NOT NULL,
        "zip" text NOT NULL,
        "phone" text NULL,
        "company_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "location_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "location_company_id_foreign" FOREIGN KEY ("company_id")
          REFERENCES "company" ("id") ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_location_company_id" ON "location" ("company_id") WHERE "deleted_at" IS NULL;`
    );

    this.addSql(
      `ALTER TABLE "employee" ADD COLUMN IF NOT EXISTS "location_id" text NULL;`
    );
    this.addSql(`
      DO $$ BEGIN
        ALTER TABLE "employee"
          ADD CONSTRAINT "employee_location_id_foreign"
          FOREIGN KEY ("location_id") REFERENCES "location" ("id")
          ON UPDATE CASCADE ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_employee_location_id" ON "employee" ("location_id") WHERE "deleted_at" IS NULL;`
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_employee_location_id";`);
    this.addSql(
      `ALTER TABLE "employee" DROP CONSTRAINT IF EXISTS "employee_location_id_foreign";`
    );
    this.addSql(`ALTER TABLE "employee" DROP COLUMN IF EXISTS "location_id";`);
    this.addSql(`DROP INDEX IF EXISTS "IDX_location_company_id";`);
    this.addSql(`DROP TABLE IF EXISTS "location";`);
  }
}
