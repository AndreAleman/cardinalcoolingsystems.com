import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";

jest.setTimeout(180 * 1000);

/*
  Quote lifecycle (CONTEXT.md: Quote, Quote Message):

  pending_merchant --admin send--> pending_customer
    --customer accept (PO required)--> accepted, draft order promoted to
      a real pending Order carrying the po_number
    --customer reject--> customer_rejected
  Quote Messages flow both ways. LinePricing is admin-only and never
  appears on a /store response. Team Members never see another
  Company's quotes.
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

    it("walks send -> accept: the draft order becomes a real pending Order", async () => {
      const { quote_id } = await world.submitQuoteRequest(world.ada, {
        po_number: "PO-1",
      });

      const sent = await api.post(
        `/admin/quotes/${quote_id}/send`,
        {},
        adminHeaders
      );
      expect(sent.status).toEqual(200);
      expect(sent.data.quote.status).toEqual("pending_customer");

      const accepted = await api.post(
        `/store/quotes/${quote_id}/accept`,
        { po_number: "PO-FINAL" },
        world.headersOf(world.ada)
      );
      expect(accepted.status).toEqual(200);
      expect(accepted.data.quote.status).toEqual("accepted");

      const container = getContainer();
      const query = container.resolve("query");
      const { data: quotes } = await query.graph({
        entity: "quote",
        fields: ["id", "draft_order_id"],
        filters: { id: quote_id },
      });
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "is_draft_order", "status", "metadata"],
        filters: { id: quotes[0].draft_order_id },
      });
      expect(orders[0].is_draft_order).toBe(false);
      expect(orders[0].status).toEqual("pending");
      expect((orders[0].metadata as any)?.po_number).toEqual("PO-FINAL");
    });

    it("refuses acceptance while the quote is still pending_merchant", async () => {
      const { quote_id } = await world.submitQuoteRequest(world.ada);

      const response = await api
        .post(
          `/store/quotes/${quote_id}/accept`,
          { po_number: "PO-X" },
          world.headersOf(world.ada)
        )
        .catch((err) => err.response);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("lets the customer reject a sent quote", async () => {
      const { quote_id } = await world.submitQuoteRequest(world.ada);
      await api.post(`/admin/quotes/${quote_id}/send`, {}, adminHeaders);

      const rejected = await api.post(
        `/store/quotes/${quote_id}/reject`,
        {},
        world.headersOf(world.ada)
      );
      expect(rejected.data.quote.status).toEqual("customer_rejected");
    });

    it("scopes /store/quotes to the Team Member's own Company", async () => {
      const { quote_id } = await world.submitQuoteRequest(world.ada);
      const { customer: outsider } = await world.addTeamMember(
        "bo@bravo.test",
        "Bo"
      );

      const mine = await api.get("/store/quotes", world.headersOf(world.ada));
      expect(mine.data.quotes.map((quote) => quote.id)).toContain(quote_id);

      const theirs = await api.get(
        "/store/quotes",
        world.headersOf(outsider)
      );
      expect(theirs.data.quotes).toHaveLength(0);

      const denied = await api
        .get(`/store/quotes/${quote_id}`, world.headersOf(outsider))
        .catch((err) => err.response);
      expect(denied.status).toEqual(404);
    });

    it("carries Quote Messages both ways", async () => {
      const { quote_id } = await world.submitQuoteRequest(world.ada);
      await api.post(`/admin/quotes/${quote_id}/send`, {}, adminHeaders);

      const customerMessage = await api.post(
        `/store/quotes/${quote_id}/messages`,
        { text: "Can you do 5% less?" },
        world.headersOf(world.ada)
      );
      expect(customerMessage.status).toEqual(200);

      const adminMessage = await api.post(
        `/admin/quotes/${quote_id}/messages`,
        { text: "Best we can do is 3%." },
        adminHeaders
      );
      expect(adminMessage.status).toEqual(200);

      const detail = await api.get(
        `/store/quotes/${quote_id}`,
        world.headersOf(world.ada)
      );
      const texts = detail.data.quote.messages.map((message) => message.text);
      expect(texts).toEqual(
        expect.arrayContaining(["Can you do 5% less?", "Best we can do is 3%."])
      );
    });

    it("keeps LinePricing admin-only — never serialized on /store", async () => {
      const { quote_id } = await world.submitQuoteRequest(world.ada);

      const container = getContainer();
      const query = container.resolve("query");
      const { data: orders } = await query.graph({
        entity: "quote",
        fields: ["id", "draft_order.items.id"],
        filters: { id: quote_id },
      });
      const itemId = (orders[0] as any).draft_order.items[0].id;

      const saved = await api.post(
        `/admin/quotes/${quote_id}/line-pricing`,
        { prices: [{ item_id: itemId, cost: 40, markup_pct: 25 }] },
        adminHeaders
      );
      expect(saved.status).toEqual(200);

      const adminView = await api.get(
        `/admin/quotes/${quote_id}/line-pricing`,
        adminHeaders
      );
      expect(adminView.data.line_pricings).toHaveLength(1);
      expect(adminView.data.line_pricings[0]).toEqual(
        expect.objectContaining({ item_id: itemId, cost: 40, markup_pct: 25 })
      );

      const storeDetail = await api.get(
        `/store/quotes/${quote_id}`,
        world.headersOf(world.ada)
      );
      expect(JSON.stringify(storeDetail.data)).not.toContain("line_pricing");
      expect(JSON.stringify(storeDetail.data)).not.toContain("markup");

      const storeList = await api.get(
        "/store/quotes",
        world.headersOf(world.ada)
      );
      expect(JSON.stringify(storeList.data)).not.toContain("line_pricing");
    });
  },
});
