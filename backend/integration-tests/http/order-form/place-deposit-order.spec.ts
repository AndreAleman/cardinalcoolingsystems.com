import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";

jest.setTimeout(180 * 1000);

/*
  Deposit orders (decided 2026-08-31): over 120 lbs at $7,500+ freight
  is free, so no quote is needed — the order is taken WITHOUT payment
  and marked "50% deposit due". Cardinal sends the Stripe deposit
  invoice from admin, then the balance invoice (net 30) after arrival.
  The route verifies the cart actually qualifies — a light or sub-$7,500
  cart is refused (its path is checkout or a quote).
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;
    let heavyVariant: any;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });

      const product = (
        await api.post(
          "/admin/products",
          {
            title: "CDU Frame",
            handle: "cdu-frame",
            status: "published",
            options: [{ title: "Size", values: ["One"] }],
            variants: [
              {
                title: "One",
                sku: "CDU-FRAME-1",
                manage_inventory: false,
                weight: 130,
                prices: [{ currency_code: "usd", amount: 4000 }],
                options: { Size: "One" },
              },
            ],
          },
          adminHeaders
        )
      ).data.product;
      heavyVariant = product.variants[0];
    });

    const cartWith = async (quantity: number) => {
      const cart = (
        await api.post(
          "/store/carts",
          { currency_code: "usd", region_id: world.region.id },
          world.headersOf(world.ada)
        )
      ).data.cart;
      await api.post(
        `/store/carts/${cart.id}/line-items`,
        { variant_id: heavyVariant.id, quantity },
        world.headersOf(world.ada)
      );
      return cart;
    };

    it("places an unpaid pending Order marked deposit-due for a qualifying cart", async () => {
      const cart = await cartWith(2); // 260 lbs, $8,000

      const response = await api.post(
        "/store/order-form/place-deposit-order",
        { cart_id: cart.id, po_number: "PO-DEP-1" },
        world.headersOf(world.ada)
      );

      expect(response.status).toEqual(200);
      expect(response.data.order_id).toBeTruthy();

      const query = getContainer().resolve("query");
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "is_draft_order", "status", "metadata", "company.id"],
        filters: { id: response.data.order_id },
      });
      expect(orders[0].is_draft_order).toBe(false);
      expect(orders[0].status).toEqual("pending");
      expect(orders[0].metadata).toEqual(
        expect.objectContaining({
          po_number: "PO-DEP-1",
          payment_rule: "deposit_50",
          deposit_status: "due",
        })
      );
      expect((orders[0] as any).company?.id).toEqual(world.company.id);
    });

    it("refuses a cart that does not qualify for the deposit path", async () => {
      const cart = await cartWith(1); // 130 lbs but only $4,000 -> quote path

      const response = await api
        .post(
          "/store/order-form/place-deposit-order",
          { cart_id: cart.id, po_number: "PO-DEP-2" },
          world.headersOf(world.ada)
        )
        .catch((err) => err.response);

      expect(response.status).toEqual(400);
      expect(JSON.stringify(response.data)).toContain("quote");
    });

    it("requires a PO number", async () => {
      const cart = await cartWith(2);
      const response = await api
        .post(
          "/store/order-form/place-deposit-order",
          { cart_id: cart.id },
          world.headersOf(world.ada)
        )
        .catch((err) => err.response);
      expect(response.status).toEqual(400);
    });
  },
});
