import { Migration } from "@mikro-orm/migrations";

/*
  Hand-written (never `medusa db:generate company`). Employee.is_admin
  becomes Employee.role (member | manager | admin). Existing admins stay
  admins; everyone else becomes a member. New rows default to admin.
*/
export class Migration20260826090000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "employee" ADD COLUMN IF NOT EXISTS "role" text CHECK ("role" IN ('member', 'manager', 'admin')) NOT NULL DEFAULT 'admin';`
    );
    this.addSql(`UPDATE "employee" SET "role" = CASE WHEN "is_admin" THEN 'admin' ELSE 'member' END;`);
    this.addSql(`ALTER TABLE "employee" DROP COLUMN IF EXISTS "is_admin";`);
  }

  async down(): Promise<void> {
    this.addSql(`ALTER TABLE "employee" ADD COLUMN IF NOT EXISTS "is_admin" boolean NOT NULL DEFAULT false;`);
    this.addSql(`UPDATE "employee" SET "is_admin" = ("role" = 'admin');`);
    this.addSql(`ALTER TABLE "employee" DROP COLUMN IF EXISTS "role";`);
  }
}
