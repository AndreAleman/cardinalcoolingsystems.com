import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";
import { seedBuilderCatalog } from "../../../src/scripts/seed-builder-catalog";
import { BUILD_CONFIGURATION_MODULE } from "../../../src/modules/build-configuration";

jest.setTimeout(180 * 1000);

// The specs reseed between tests; the in-memory resolve caches would serve stale variant ids.
process.env.BUILD_RESOLVE_CACHE = "off";

/* Real variants from the live store (src/scripts/data/builder-seed-catalog.json). */
const SKUS = [
  "14AM76-150",
  "14WMP6-150",
  "13MHHM-100-150",
  "GTCE-150",
  "TCBVS-150",
  "FLGTC6-200",
];

/*
  Cardinal Builder commerce (docs/specs/cardinal-builder-plan.md, B1–B5):
  POST /store/build/resolve prices a Configuration from posted SKUs only,
  POST /store/build/quote-lines puts it in the cart, and a cart holding a
  builder Quote line can never check out.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;
    let variantIdBySku: Record<string, string>;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });
      ({ variantIdBySku } = await seedBuilderCatalog(container, { skus: SKUS }));
    });

    const resolve = (body: Record<string, unknown>, headers = world.storeHeaders) =>
      api.post("/store/build/resolve", body, headers).catch((err) => err.response);
    const quoteLines = (body: Record<string, unknown>, headers = world.storeHeaders) =>
      api.post("/store/build/quote-lines", body, headers).catch((err) => err.response);

    const waitForConfiguration = async (configKey: string) => {
      const service = getContainer().resolve(BUILD_CONFIGURATION_MODULE) as any;
      for (let i = 0; i < 50; i++) {
        const [row] = await service.listBuildConfigurations({ config_key: configKey });
        if (row) return row;
        await new Promise((r) => setTimeout(r, 100));
      }
      return null;
    };

    it("Boyd 10U hard-pipe kit: Quote (welded spool), stocked lines resolved at list price, Configuration saved", async () => {
      const res = await resolve({ builder_type: "cdu-kit", options: { cdu: "boyd-10u", run: "hard" } });
      expect(res.status).toBe(200);
      const r = res.data;
      expect(r).toMatchObject({
        builder_type: "cdu-kit",
        pricing_mode: "quote",
        price_basis: "list",
        price_per_unit: null,
        price_total: null,
        currency_code: "usd",
        units: 1,
        lead_time: { kind: "custom" },
        stocked_alternative: null,
      });
      expect(r.part_number).toMatch(/^kit-cdu-[0-9a-f]{8}$/);
      expect(r.priced_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.quote_reasons).toEqual([expect.stringMatching(/^Made to order: Spool/)]);
      const ferrule = r.bom.find((l: any) => l.role === "ferrule");
      expect(ferrule).toMatchObject({
        sku: "14AM76-150",
        variant_id: variantIdBySku["14AM76-150"],
        unit_price: 5.38,
        qty_total: 6,
        stock_qty: 425,
        resolved: true,
      });
      expect(r.configuration_id).toMatch(/^bcfg_/);

      const row = await waitForConfiguration(r.config_key);
      expect(row).toMatchObject({ id: r.configuration_id, pricing_mode: "quote", resolve_count: 1, part_number: r.part_number });

      await resolve({ builder_type: "cdu-kit", options: { cdu: "boyd-10u", run: "hard" } });
      const service = getContainer().resolve(BUILD_CONFIGURATION_MODULE) as any;
      for (let i = 0; i < 50; i++) {
        const [again] = await service.listBuildConfigurations({ config_key: r.config_key });
        if (again.resolve_count === 2) break;
        await new Promise((res) => setTimeout(res, 100));
      }
      const rows = await service.listBuildConfigurations({ config_key: r.config_key });
      expect(rows).toHaveLength(1);
      expect(rows[0].resolve_count).toBe(2);
    });

    it("304L: the Spec Block, the BOM and the Part Number follow the alloy (the resolve and the page agree)", async () => {
      const r316 = (await resolve({ builder_type: "cdu-kit", options: { cdu: "boyd-10u", run: "hard", strainer: "short" } })).data;
      const r304 = (await resolve({ builder_type: "cdu-kit", options: { cdu: "boyd-10u", run: "hard", strainer: "short", alloy: "t304l" } })).data;
      expect(r304.options.alloy).toBe("t304l");
      expect(r304.ignored).toEqual([]);
      expect(r304.spec_block).toContain("welded T304L spools");
      expect(r304.spec_block).toContain("T304L ferrules, heavy-duty T304 single-pin clamps");
      expect(r304.spec_block).toContain("T316L inline tri-clamp strainer"); // strainers are 316L only
      expect(r304.spec_block).not.toBe(r316.spec_block);
      expect(r304.part_number).not.toBe(r316.part_number);
      const label = (r: any, role: string) => r.bom.find((l: any) => l.role === role).label;
      expect(label(r304, "spool")).toContain("T304L");
      expect(label(r304, "ferrule")).toContain("T304L");
      expect(label(r304, "clamp")).toContain("T304");
      // The decoded options the backend prices are exactly what the storefront sends.
      expect(r304.config_key).toContain("alloy=t304l");
    });

    it("the default kit is a hose kit; a v=1 link without run still means hard pipe", async () => {
      const r = (await resolve({ builder_type: "cdu-kit", options: { cdu: "boyd-10u" } })).data;
      expect(r.options.run).toBe("hose");
      expect(r.quote_reasons).toEqual([expect.stringMatching(/^Not stocked: Stainless braided hose assembly/)]);
      const old = (await resolve({ builder_type: "cdu-kit", options: { v: "1", cdu: "boyd-10u" } })).data;
      expect(old.options.run).toBe("hard");
    });

    it("Boyd 10U with ball valves: the stock-0 TCBVS-150 is reported, not priced", async () => {
      const r = (await resolve({ builder_type: "cdu-kit", options: { cdu: "boyd-10u", iso: "bv" } })).data;
      expect(r.quote_reasons).toContain("TCBVS-150: 0 in stock, 2 needed");
    });

    it("reads stock from the store: more adapters than on hand → custom transition (Quote)", async () => {
      // The 14AM76-600 → 14WMP6-600 fallthrough is in the unit spec (no 6" kit port is offered).
      const t = (await resolve({ builder_type: "transition", options: { a: "tc", b: "fl150", od: 200, qty: 13 } })).data;
      expect(t.pricing_mode).toBe("quote");
      expect(t.stocked_alternative).toBeNull();
    });

    it("transition with a stocked adapter: Instant, × qty, with stocked_alternative", async () => {
      const r = (await resolve({ builder_type: "transition", options: { a: "tc", b: "fl150", od: 200, len: 12, qty: 3 } })).data;
      expect(r).toMatchObject({
        pricing_mode: "instant",
        part_number: "clmp-fl150-tspool-l12-6-200",
        price_per_unit: 319.39,
        price_total: 958.17,
        stocked_alternative: { sku: "FLGTC6-200", variant_id: variantIdBySku["FLGTC6-200"], unit_price: 319.39 },
      });
    });

    it("company basis: an Approved Company's Team Member gets the Company price list", async () => {
      const query = getContainer().resolve("query");
      const {
        data: [company],
      } = await query.graph({ entity: "company", fields: ["id", "customer_group.id"], filters: { id: world.company.id } });
      const groupId = (company as any).customer_group.id;
      await api.post(
        "/admin/price-lists",
        {
          title: "Alpha Cooling",
          description: "Company price list",
          type: "override",
          status: "active",
          rules: { "customer.groups.id": [groupId] },
          prices: [{ variant_id: variantIdBySku["FLGTC6-200"], amount: 250, currency_code: "usd" }],
        },
        adminHeaders
      );
      const opts = { builder_type: "transition", options: { a: "tc", b: "fl150", od: 200 } };
      const asCompany = (await resolve(opts, world.headersOf(world.ada))).data;
      expect(asCompany).toMatchObject({ price_basis: "company", price_total: 250 });
      const anonymous = (await resolve(opts)).data;
      expect(anonymous).toMatchObject({ price_basis: "list", price_total: 319.39 });
    });

    it("400 with a clear reason for an unknown builder_type; invalid options are ignored, not fatal", async () => {
      const bad = await resolve({ builder_type: "spaceship", options: {} });
      expect(bad.status).toBe(400);
      expect(bad.data.message).toContain('Unknown builder_type "spaceship"');
      const ok = await resolve({ builder_type: "transition", options: { od: 999, len: "abc" } });
      expect(ok.status).toBe(200);
      expect(ok.data.ignored).toEqual(expect.arrayContaining(["od", "len"]));
    });

    it("quote-lines, Instant: adds the real variant at its posted price (new cart)", async () => {
      const res = await quoteLines({ builder_type: "transition", options: { a: "tc", b: "fl150", od: 200 }, units: 2 });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({
        pricing_mode: "instant",
        added: [{ kind: "variant", sku: "FLGTC6-200", quantity: 2 }],
      });
      const cart = (
        await api.get(`/store/carts/${res.data.cart_id}?fields=*items`, world.storeHeaders)
      ).data.cart;
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toMatchObject({
        variant_id: variantIdBySku["FLGTC6-200"],
        quantity: 2,
        unit_price: 319.39,
        metadata: expect.objectContaining({ builder: true, pricing_mode: "instant" }),
      });
    });

    it("quote-lines, Quote: one $0 custom line with server-built metadata; checkout is refused", async () => {
      const res = await quoteLines({
        builder_type: "cdu-kit",
        // A client-sent part number is not an option: it never reaches the line.
        options: { cdu: "boyd-10u", part_number: "FAKE" },
        units: 4,
        source_page: "/us/build/cdu-kit/boyd-10u",
      });
      expect(res.status).toBe(200);
      expect(res.data.part_number).toMatch(/^kit-cdu-/);
      expect(res.data.pricing_mode).toBe("quote");
      const cartId = res.data.cart_id;
      const cart = (await api.get(`/store/carts/${cartId}?fields=*items`, world.storeHeaders)).data.cart;
      expect(cart.items).toHaveLength(1);
      const item = cart.items[0];
      expect(item.variant_id).toBeNull();
      expect(item).toMatchObject({ quantity: 4, unit_price: 0, variant_sku: res.data.part_number });
      expect(item.title).toContain("CDU HOOKUP KIT, BOYD 10U CDU");
      expect(item.metadata).toMatchObject({
        builder: true,
        builder_type: "cdu-kit",
        pricing_mode: "quote",
        part_number: res.data.part_number,
        configuration_id: res.data.configuration_id,
        lead_time: { kind: "custom" },
        source_page: "/us/build/cdu-kit/boyd-10u",
      });
      expect(item.metadata.configuration_display[0]).toEqual({ label: "Part Number", value: res.data.part_number });

      // Same cart: add an Instant line too, then try to check out.
      await quoteLines({ cart_id: cartId, builder_type: "transition", options: { a: "tc", b: "fl150", od: 200 } });
      await api.post(
        `/store/carts/${cartId}`,
        { email: "buyer@prospect.test" },
        world.storeHeaders
      );
      const collection = (
        await api.post("/store/payment-collections", { cart_id: cartId }, world.storeHeaders)
      ).data.payment_collection;
      await api.post(
        `/store/payment-collections/${collection.id}/payment-sessions`,
        { provider_id: "pp_system_default" },
        world.storeHeaders
      );
      const complete = await api
        .post(`/store/carts/${cartId}/complete`, {}, world.storeHeaders)
        .catch((err) => err.response);
      expect(JSON.stringify(complete.data)).toContain("custom-built part that Cardinal must quote");
    });

    it("quote-lines: a line over stock once the cart is counted goes in as quote-only", async () => {
      const first = await quoteLines({ builder_type: "transition", options: { a: "tc", b: "fl150", od: 200, qty: 10 } });
      const second = await quoteLines({
        cart_id: first.data.cart_id,
        builder_type: "transition",
        options: { a: "tc", b: "fl150", od: 200, qty: 5 },
      });
      expect(second.data.added).toEqual([expect.objectContaining({ kind: "quote_only", quantity: 5 })]);
      const cart = (await api.get(`/store/carts/${first.data.cart_id}?fields=*items`, world.storeHeaders)).data.cart;
      const overStock = cart.items.find((i: any) => i.metadata?.over_stock);
      expect(overStock).toMatchObject({ variant_id: null, unit_price: 0, quantity: 5 });
    });
  },
});
