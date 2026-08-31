import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { Modules } from "@medusajs/framework/utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";
import { QUOTE_MODULE } from "../../../src/modules/quote";

jest.setTimeout(180 * 1000);

/*
  Guest quote (decided 2026-08-31): a visitor with no account fills the
  normal cart, clicks "Request a Quote", and gives name + email +
  company. A real Quote lands in the same admin queue as portal quotes —
  through a proper public route, not the legacy flow that signed in with
  admin credentials. Submitting twice with the same email reuses the
  same guest customer.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });
    });

    const makeGuestCart = async () => {
      const cart = (
        await api.post(
          "/store/carts",
          { currency_code: "usd", region_id: world.region.id },
          world.storeHeaders
        )
      ).data.cart;
      await api.post(
        `/store/carts/${cart.id}/line-items`,
        { variant_id: world.variant.id, quantity: 2 },
        world.storeHeaders
      );
      return cart;
    };

    it("creates a pending_merchant Quote from a guest cart", async () => {
      const cart = await makeGuestCart();

      const response = await api.post(
        "/store/order-form/guest-quote",
        {
          cart_id: cart.id,
          email: "guest@prospect.test",
          first_name: "Grace",
          last_name: "Guest",
          company_name: "Prospect Metals",
          notes: "Please quote freight to 66101",
        },
        world.storeHeaders
      );

      expect(response.status).toEqual(200);
      const quoteId = response.data.quote_id;
      expect(quoteId).toEqual(expect.stringContaining("quo_"));

      const container = getContainer();
      const quoteService = container.resolve(QUOTE_MODULE) as any;
      const quote = await quoteService.retrieveQuote(quoteId);
      expect(quote.status).toEqual("pending_merchant");

      const customerService = container.resolve(Modules.CUSTOMER) as any;
      const customer = await customerService.retrieveCustomer(
        quote.customer_id
      );
      expect(customer.email).toEqual("guest@prospect.test");
      expect(customer.has_account).toBe(false);

      const query = container.resolve("query");
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: ["id", "metadata"],
        filters: { id: cart.id },
      });
      expect(carts[0].metadata).toEqual(
        expect.objectContaining({
          request_type: "quote",
          guest_company_name: "Prospect Metals",
          notes: "Please quote freight to 66101",
        })
      );
    });

    it("reuses the same guest customer for a repeat email", async () => {
      const first = await api.post(
        "/store/order-form/guest-quote",
        {
          cart_id: (await makeGuestCart()).id,
          email: "repeat@prospect.test",
          first_name: "Rae",
          last_name: "Repeat",
          company_name: "Repeat Corp",
        },
        world.storeHeaders
      );
      const second = await api.post(
        "/store/order-form/guest-quote",
        {
          cart_id: (await makeGuestCart()).id,
          email: "Repeat@Prospect.test",
          first_name: "Rae",
          last_name: "Repeat",
          company_name: "Repeat Corp",
        },
        world.storeHeaders
      );

      const container = getContainer();
      const quoteService = container.resolve(QUOTE_MODULE) as any;
      const quoteA = await quoteService.retrieveQuote(first.data.quote_id);
      const quoteB = await quoteService.retrieveQuote(second.data.quote_id);
      expect(quoteA.customer_id).toEqual(quoteB.customer_id);
    });

    it("requires email and company name", async () => {
      const cart = await makeGuestCart();
      const response = await api
        .post(
          "/store/order-form/guest-quote",
          { cart_id: cart.id, first_name: "No", last_name: "Email" },
          world.storeHeaders
        )
        .catch((err) => err.response);
      expect(response.status).toEqual(400);
    });
  },
});
