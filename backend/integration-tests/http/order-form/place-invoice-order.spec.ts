import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";
import { COMPANY_MODULE } from "../../../src/modules/company";

jest.setTimeout(180 * 1000);

/*
  Invoice orders (decided 2026-08-31): a Company Cardinal has switched
  ON (invoice_payment_enabled) places orders with no card screen — any
  size, any weight. The order lands as a real pending Order that
  Cardinal bills offline. Companies without the switch are refused —
  their pay path is checkout, their over-limit path is a Quote Request.
  PO number is required: an invoice order is a commitment.
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

    const enableInvoice = async () => {
      const companyService = getContainer().resolve(COMPANY_MODULE) as any;
      await companyService.updateCompanies([
        { id: world.company.id, invoice_payment_enabled: true },
      ]);
    };

    it("places a real pending Order for an invoice-enabled Company", async () => {
      await enableInvoice();
      const cart = await world.makeCart(world.ada);

      const response = await api.post(
        "/store/order-form/place-invoice-order",
        { cart_id: cart.id, po_number: "PO-INV-1" },
        world.headersOf(world.ada)
      );

      expect(response.status).toEqual(200);
      expect(response.data.pending_approval).toBe(false);
      expect(response.data.order_id).toBeTruthy();
      expect(response.data.quote_id).toBeTruthy();

      const query = getContainer().resolve("query");
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "is_draft_order", "status", "metadata", "company.id"],
        filters: { id: response.data.order_id },
      });
      expect(orders[0].is_draft_order).toBe(false);
      expect(orders[0].status).toEqual("pending");
      expect((orders[0].metadata as any)?.po_number).toEqual("PO-INV-1");
      expect((orders[0] as any).company?.id).toEqual(world.company.id);
    });

    it("refuses a Company without the invoice switch", async () => {
      const cart = await world.makeCart(world.ada);

      const response = await api
        .post(
          "/store/order-form/place-invoice-order",
          { cart_id: cart.id, po_number: "PO-INV-2" },
          world.headersOf(world.ada)
        )
        .catch((err) => err.response);

      expect(response.status).toEqual(403);
      expect(response.data.code).toEqual("invoice_payment_disabled");
    });

    it("requires a PO number", async () => {
      await enableInvoice();
      const cart = await world.makeCart(world.ada);

      const response = await api
        .post(
          "/store/order-form/place-invoice-order",
          { cart_id: cart.id },
          world.headersOf(world.ada)
        )
        .catch((err) => err.response);

      expect(response.status).toEqual(400);
    });
  },
});
