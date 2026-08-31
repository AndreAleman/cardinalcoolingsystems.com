import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";

jest.setTimeout(180 * 1000);

/*
  The freight gate at checkout (decided 2026-08-31): an order over 120
  lbs cannot be paid at checkout — UPS won't take the box — no matter
  who ordered it. The buyer is told to request a freight quote instead.
  Parts with no weight on file count as unquotable and block too.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;
    let heavyVariant: any;
    let unweighedVariant: any;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });

      const product = (
        await api.post(
          "/admin/products",
          {
            title: "Cold Plate",
            handle: "cold-plate",
            status: "published",
            options: [{ title: "Kind", values: ["Heavy", "Unweighed"] }],
            variants: [
              {
                title: "Heavy",
                sku: "CP-HEAVY",
                manage_inventory: false,
                weight: 61,
                prices: [{ currency_code: "usd", amount: 500 }],
                options: { Kind: "Heavy" },
              },
              {
                title: "Unweighed",
                sku: "CP-NOWEIGHT",
                manage_inventory: false,
                prices: [{ currency_code: "usd", amount: 50 }],
                options: { Kind: "Unweighed" },
              },
            ],
          },
          adminHeaders
        )
      ).data.product;
      heavyVariant = product.variants.find((v) => v.sku === "CP-HEAVY");
      unweighedVariant = product.variants.find((v) => v.sku === "CP-NOWEIGHT");
    });

    const guestCartWith = async (variantId: string, quantity: number) => {
      const cart = (
        await api.post(
          "/store/carts",
          {
            currency_code: "usd",
            region_id: world.region.id,
            email: "guest@heavy.test",
          },
          world.storeHeaders
        )
      ).data.cart;
      await api.post(
        `/store/carts/${cart.id}/line-items`,
        { variant_id: variantId, quantity },
        world.storeHeaders
      );
      return cart;
    };

    const tryComplete = async (cartId: string) => {
      // Completion validates payment before the freight hook runs, so
      // give the cart a system payment session first.
      const collection = (
        await api.post(
          "/store/payment-collections",
          { cart_id: cartId },
          world.storeHeaders
        )
      ).data.payment_collection;
      await api.post(
        `/store/payment-collections/${collection.id}/payment-sessions`,
        { provider_id: "pp_system_default" },
        world.storeHeaders
      );
      return api
        .post(`/store/carts/${cartId}/complete`, {}, world.storeHeaders)
        .catch((err) => err.response);
    };

    it("blocks completion of a cart over 120 lbs with a freight message", async () => {
      const cart = await guestCartWith(heavyVariant.id, 2); // 122 lbs

      const response = await tryComplete(cart.id);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(response.data)).toContain("freight");
    });

    it("blocks completion when a line has no weight on file", async () => {
      const cart = await guestCartWith(unweighedVariant.id, 1);

      const response = await tryComplete(cart.id);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(JSON.stringify(response.data)).toContain("quote");
    });

    it("does not freight-block a cart at or under 120 lbs", async () => {
      const cart = await guestCartWith(heavyVariant.id, 1); // 61 lbs

      const response = await tryComplete(cart.id);
      // Completion may still fail on payment/shipping setup in this
      // harness — but never because of freight.
      expect(JSON.stringify(response.data)).not.toContain("freight");
    });
  },
});
