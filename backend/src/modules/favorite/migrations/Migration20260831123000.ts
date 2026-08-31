import { Migration } from "@mikro-orm/migrations";

/* Hand-written. Favorites: a person's starred parts. */
export class Migration20260831123000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE TABLE IF NOT EXISTS "favorite" (
      "id" text NOT NULL,
      "customer_id" text NOT NULL,
      "variant_id" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "favorite_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_favorite_customer_id_variant_id_unique" ON "favorite" ("customer_id", "variant_id") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_favorite_deleted_at" ON "favorite" ("deleted_at") WHERE deleted_at IS NULL;`
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "favorite" CASCADE;`);
  }
}
