import { Migration } from "@mikro-orm/migrations";

/* Cardinal Builder plan B6: competitor benchmark and approved selling
   price on the admin-only quote line pricing. Generated with
   `medusa db:generate quote`; the quote module had no snapshot, so the
   generator re-emitted the whole schema and this file keeps only the
   new columns. */
export class Migration20261019015900 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "quote_line_pricing" add column if not exists "benchmark_price" real null, add column if not exists "benchmark_source" text null, add column if not exists "approved_price" real null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "quote_line_pricing" drop column if exists "benchmark_price", drop column if exists "benchmark_source", drop column if exists "approved_price";`
    );
  }
}
