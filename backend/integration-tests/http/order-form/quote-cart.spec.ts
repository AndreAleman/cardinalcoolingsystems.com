import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";

jest.setTimeout(180 * 1000);

/*
  Quote carts hold exactly the lines the standard cart refuses: parts
  with no price on file, and quantities over stock. Medusa's core
  createCartWorkflow validates prices and inventory, so Quote-Only
  Lines get their own cart-build route. A quote cart never completes —
  it only feeds POST /store/order-form/request-quote.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;
    let unpricedVariant: any;
    let managedVariant: any;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });

      const product = (
        await api.post(
          "/admin/products",
          {
            title: "Custom Bracket",
            handle: "custom-bracket",
            status: "published",
            options: [{ title: "Kind", values: ["Unpriced", "Managed"] }],
            variants: [
              {
                title: "Unpriced",
                sku: "CB-UNPRICED",
                manage_inventory: false,
                prices: [],
                options: { Kind: "Unpriced" },
              },
              {
                title: "Managed",
                sku: "CB-MANAGED",
                manage_inventory: true,
                prices: [{ currency_code: "usd", amount: 75 }],
                options: { Kind: "Managed" },
              },
            ],
          },
          adminHeaders
        )
      ).data.product;
      unpricedVariant = product.variants.find((v) => v.sku === "CB-UNPRICED");
      managedVariant = product.variants.find((v) => v.sku === "CB-MANAGED");
    });

    it("builds a cart from unpriced and over-stock lines, then quotes it", async () => {
      // Managed variant has zero inventory seeded -> any qty is over stock.
      const built = await api
        .post(
          "/store/order-form/quote-cart",
          {
            region_id: world.region.id,
            items: [
              { variant_id: unpricedVariant.id, quantity: 4 },
              { variant_id: managedVariant.id, quantity: 99 },
            ],
          },
          world.headersOf(world.ada)
        )
        .catch((err) => {
          console.error("quote-cart failed:", JSON.stringify(err.response?.data));
          throw err;
        });

      expect(built.status).toEqual(200);
      const cartId = built.data.cart_id;
      expect(cartId).toBeTruthy();

      const query = getContainer().resolve("query");
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: [
          "id",
          "items.variant_id",
          "items.quantity",
          "items.unit_price",
          "items.metadata",
        ],
        filters: { id: cartId },
      });
      expect(carts[0].items).toHaveLength(2);
      // Quote-cart lines are custom lines: no variant link (the core
      // order workflow would price-validate and reserve stock), the
      // real variant id rides in metadata.
      const unpricedLine = carts[0].items.find(
        (item) =>
          (item.metadata as any)?.quote_variant_id === unpricedVariant.id
      );
      expect(unpricedLine.variant_id).toBeNull();
      expect(unpricedLine.quantity).toEqual(4);
      expect(Number(unpricedLine.unit_price)).toEqual(0);
      const overStockLine = carts[0].items.find(
        (item) =>
          (item.metadata as any)?.quote_variant_id === managedVariant.id
      );
      expect(overStockLine.quantity).toEqual(99);
      expect(Number(overStockLine.unit_price)).toEqual(75);

      const quoted = await api
        .post(
          "/store/order-form/request-quote",
          { cart_id: cartId, notes: "Quote-only lines" },
          world.headersOf(world.ada)
        )
        .catch((err) => {
          console.error("request-quote failed:", JSON.stringify(err.response?.data));
          throw err;
        });
      expect(quoted.status).toEqual(200);
      expect(quoted.data.quote_id).toBeTruthy();
    });

    it("rejects an unknown variant", async () => {
      const response = await api
        .post(
          "/store/order-form/quote-cart",
          {
            region_id: world.region.id,
            items: [{ variant_id: "variant_nope", quantity: 1 }],
          },
          world.headersOf(world.ada)
        )
        .catch((err) => err.response);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  },
});
