import { Migration } from "@mikro-orm/migrations";

/* Hand-written. Quote module: Quote, Message (quote messages),
   LinePricing (admin-only cost/markup rows). */
export class Migration20260831122000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE TABLE IF NOT EXISTS "quote" (
      "id" text NOT NULL,
      "status" text CHECK ("status" IN ('pending_merchant', 'pending_customer', 'accepted', 'customer_rejected', 'merchant_rejected')) NOT NULL DEFAULT 'pending_merchant',
      "customer_id" text NOT NULL,
      "draft_order_id" text NOT NULL,
      "order_change_id" text NOT NULL,
      "cart_id" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_customer_id" ON "quote" ("customer_id") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_deleted_at" ON "quote" ("deleted_at") WHERE deleted_at IS NULL;`
    );

    this.addSql(`CREATE TABLE IF NOT EXISTS "message" (
      "id" text NOT NULL,
      "text" text NOT NULL,
      "item_id" text NULL,
      "admin_id" text NULL,
      "customer_id" text NULL,
      "quote_id" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "message_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_message_quote_id" ON "message" ("quote_id") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_message_deleted_at" ON "message" ("deleted_at") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `ALTER TABLE "message" ADD CONSTRAINT "message_quote_id_foreign" FOREIGN KEY ("quote_id") REFERENCES "quote" ("id") ON UPDATE CASCADE;`
    );

    this.addSql(`CREATE TABLE IF NOT EXISTS "quote_line_pricing" (
      "id" text NOT NULL,
      "item_id" text NOT NULL,
      "cost" real NOT NULL,
      "markup_pct" real NOT NULL,
      "quote_id" text NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "quote_line_pricing_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_line_pricing_quote_id" ON "quote_line_pricing" ("quote_id") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_quote_line_pricing_deleted_at" ON "quote_line_pricing" ("deleted_at") WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `ALTER TABLE "quote_line_pricing" ADD CONSTRAINT "quote_line_pricing_quote_id_foreign" FOREIGN KEY ("quote_id") REFERENCES "quote" ("id") ON UPDATE CASCADE;`
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "quote_line_pricing" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "message" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "quote" CASCADE;`);
  }
}
