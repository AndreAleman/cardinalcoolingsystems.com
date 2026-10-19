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

    const guestBody = (cartId: string, extra: Record<string, unknown> = {}) => ({
      cart_id: cartId,
      email: "eng@prospect.test",
      first_name: "Eli",
      last_name: "Eng",
      company_name: "Prospect Cooling",
      ...extra,
    });

    it("quotes a cart holding a Cardinal Builder Quote line (part number + configuration reach the quote)", async () => {
      // A row manifold is always Quote (fabricated): no catalog needed.
      const added = (
        await api.post(
          "/store/build/quote-lines",
          { builder_type: "row-manifold", options: { drops: 8 }, source_page: "/us/build/row-manifold" },
          world.storeHeaders
        )
      ).data;
      expect(added.pricing_mode).toBe("quote");
      // Mixed cart: the builder line next to a normal catalog line.
      await api.post(
        `/store/carts/${added.cart_id}/line-items`,
        { variant_id: world.variant.id, quantity: 1 },
        world.storeHeaders
      );

      const response = await api.post(
        "/store/order-form/guest-quote",
        // The storefront's bot-protection fields ride along (B4).
        guestBody(added.cart_id, { website: "", elapsed_ms: 8000, turnstile_token: "" }),
        world.storeHeaders
      );
      expect(response.status).toEqual(200);

      const container = getContainer();
      const quote = await (container.resolve(QUOTE_MODULE) as any).retrieveQuote(response.data.quote_id);
      const query = container.resolve("query");
      const {
        data: [order],
      } = await query.graph({
        entity: "order",
        fields: ["id", "items.title", "items.variant_sku", "items.unit_price", "items.metadata"],
        filters: { id: quote.draft_order_id },
      });
      const builderLine = (order as any).items.find((i: any) => i.metadata?.builder);
      expect(builderLine).toMatchObject({
        variant_sku: added.part_number,
        unit_price: 0,
        metadata: expect.objectContaining({
          pricing_mode: "quote",
          part_number: added.part_number,
          configuration_id: added.configuration_id,
        }),
      });
      expect(builderLine.metadata.configuration_display[0]).toEqual({
        label: "Part Number",
        value: added.part_number,
      });
      expect((order as any).items).toHaveLength(2);
    });

    it("honeypot: a filled `website` field gets a calm 200 and creates nothing", async () => {
      const container = getContainer();
      const quoteService = container.resolve(QUOTE_MODULE) as any;
      const cart = await makeGuestCart();

      const trapped = await api.post(
        "/store/order-form/guest-quote",
        guestBody(cart.id, { website: "https://spam.example" }),
        world.storeHeaders
      );
      expect(trapped.status).toEqual(200);
      expect(trapped.data).toEqual({ success: true });

      const tooFast = await api.post(
        "/store/order-form/guest-quote",
        guestBody(cart.id, { elapsed_ms: 300 }),
        world.storeHeaders
      );
      expect(tooFast.status).toEqual(200);
      expect(tooFast.data.quote_id).toBeUndefined();

      expect(await quoteService.listQuotes({})).toHaveLength(0);
    });

    it("Turnstile: with a secret key configured, a missing token is 403", async () => {
      const cart = await makeGuestCart();
      process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
      try {
        const res = await api
          .post("/store/order-form/guest-quote", guestBody(cart.id), world.storeHeaders)
          .catch((err) => err.response);
        expect(res.status).toEqual(403);
        expect(res.data.code).toEqual("challenge_failed");
      } finally {
        process.env.TURNSTILE_SECRET_KEY = "";
      }
    });

    it("rate limit: the 11th guest quote from one address in an hour is 429", async () => {
      const { __resetRateLimitMemory } = await import("../../../src/lib/rate-limit");
      __resetRateLimitMemory();
      process.env.RATE_LIMIT_DISABLED = "0";
      try {
        // Honeypot-trapped submits still count against the limit (it runs first) and are cheap.
        for (let i = 0; i < 10; i++) {
          const ok = await api.post(
            "/store/order-form/guest-quote",
            { website: "trap" },
            world.storeHeaders
          );
          expect(ok.status).toEqual(200);
        }
        const blocked = await api
          .post("/store/order-form/guest-quote", { website: "trap" }, world.storeHeaders)
          .catch((err) => err.response);
        expect(blocked.status).toEqual(429);
        expect(blocked.data.code).toEqual("rate_limited");
      } finally {
        process.env.RATE_LIMIT_DISABLED = "1";
        __resetRateLimitMemory();
      }
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
