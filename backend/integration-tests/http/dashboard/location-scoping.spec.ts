import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { Modules } from "@medusajs/framework/utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";
import { COMPANY_MODULE } from "../../../src/modules/company";
import { APPROVAL_MODULE } from "../../../src/modules/approval";

jest.setTimeout(240 * 1000);

/*
  Locations + scoped visibility (owner decisions, 2026-09):

  A Location is a Company's destination site, managed by Cardinal in
  Medusa Admin only. The buyer picks the order's Location at submit
  time. Visibility for the Orders section and the approvals queue:

    member                    -> only what they submitted
    manager with a Location   -> everything tagged with that Location
    manager with no Location  -> the whole Company (role fallback)
    admin                     -> everything

  Quotes stay company-wide for every role (explicit decision).
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;

    const createLocation = async (
      companyId: string,
      name: string,
      overrides: Record<string, unknown> = {}
    ) => {
      const response = await api.post(
        `/admin/companies/${companyId}/locations`,
        {
          name,
          address_1: "100 Cooling Way",
          city: "Atlanta",
          state: "GA",
          zip: "30301",
          ...overrides,
        },
        adminHeaders
      );
      expect(response.status).toEqual(200);
      return response.data.location;
    };

    /* A coworker in Ada's Company with a given Role (and optional home site). */
    const addTeamMate = async (
      email: string,
      role: "member" | "manager" | "admin",
      locationId?: string
    ) => {
      const container = getContainer();
      const customerService = container.resolve(Modules.CUSTOMER) as any;
      const customer = await customerService.createCustomers({
        email,
        first_name: email.split("@")[0],
        last_name: "Alpha",
      });
      const companyService = container.resolve(COMPANY_MODULE) as any;
      const employee = await companyService.createEmployees({
        role,
        company_id: world.company.id,
        ...(locationId ? { location_id: locationId } : {}),
      });
      const remoteLink = container.resolve("remoteLink") as any;
      await remoteLink.create([
        {
          [COMPANY_MODULE]: { employee_id: employee.id },
          [Modules.CUSTOMER]: { customer_id: customer.id },
        },
      ]);
      return { customer, employee };
    };

    const enableInvoicePayment = async () => {
      const companyService = getContainer().resolve(COMPANY_MODULE) as any;
      await companyService.updateCompanies([
        { id: world.company.id, invoice_payment_enabled: true },
      ]);
    };

    const placeInvoiceOrder = async (
      customer: { id: string },
      body: Record<string, unknown> = {}
    ) => {
      const cart = await world.makeCart(customer);
      const response = await api.post(
        "/store/order-form/place-invoice-order",
        { cart_id: cart.id, po_number: "PO-LOC", ...body },
        world.headersOf(customer)
      );
      expect(response.status).toEqual(200);
      expect(response.data.order_id).toBeTruthy();
      return response.data;
    };

    const enableApprovalSetting = async () => {
      const approvalService = getContainer().resolve(APPROVAL_MODULE) as any;
      const [settings] = await approvalService.listApprovalSettings({
        company_id: world.company.id,
      });
      if (settings) {
        await approvalService.updateApprovalSettings([
          { id: settings.id, requires_admin_approval: true },
        ]);
      } else {
        await approvalService.createApprovalSettings({
          company_id: world.company.id,
          requires_admin_approval: true,
        });
      }
    };

    const listedOrderIds = async (customer: { id: string }) => {
      const response = await api.get(
        "/store/dashboard/orders",
        world.headersOf(customer)
      );
      expect(response.status).toEqual(200);
      return response.data.orders.map((order: any) => order.id);
    };

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });
    });

    it("returns only the Company's own Locations for the ship-to picker", async () => {
      const mine = await createLocation(world.company.id, "Atlanta Plant");
      const { company: otherCompany } = await world.addTeamMember(
        "bo@bravo.test",
        "Bo"
      );
      await createLocation(otherCompany.id, "Bravo Yard", {
        address_1: "9 Bravo Blvd",
        city: "Dallas",
        state: "TX",
        zip: "75201",
      });

      const response = await api.get(
        "/store/dashboard/locations",
        world.headersOf(world.ada)
      );
      expect(response.status).toEqual(200);
      expect(response.data.locations).toHaveLength(1);
      expect(response.data.locations[0]).toEqual(
        expect.objectContaining({
          id: mine.id,
          name: "Atlanta Plant",
          address_1: "100 Cooling Way",
          city: "Atlanta",
          state: "GA",
          zip: "30301",
        })
      );
    });

    it("rejects a location_id that belongs to another Company on submit", async () => {
      const { company: otherCompany } = await world.addTeamMember(
        "bo@bravo.test",
        "Bo"
      );
      const foreign = await createLocation(otherCompany.id, "Bravo Yard");

      const cart = await world.makeCart(world.ada);
      const response = await api
        .post(
          "/store/order-form/request-quote",
          { cart_id: cart.id, location_id: foreign.id },
          world.headersOf(world.ada)
        )
        .catch((err: any) => err.response);
      expect(response.status).toEqual(400);
    });

    it("shows a member only the orders they submitted", async () => {
      await enableInvoicePayment();
      const { customer: mel } = await addTeamMate("mel@alpha.test", "member");

      const adaOrder = await placeInvoiceOrder(world.ada);
      const melOrder = await placeInvoiceOrder(mel);

      const melSees = await listedOrderIds(mel);
      expect(melSees).toEqual([melOrder.order_id]);

      // The admin sees everything.
      const adaSees = await listedOrderIds(world.ada);
      expect(adaSees).toHaveLength(2);
      expect(adaSees).toEqual(
        expect.arrayContaining([adaOrder.order_id, melOrder.order_id])
      );
    });

    it("shows a manager with a Location only that Location's orders", async () => {
      await enableInvoicePayment();
      const atlanta = await createLocation(world.company.id, "Atlanta Plant");
      const dallas = await createLocation(world.company.id, "Dallas Plant", {
        address_1: "9 Longhorn Rd",
        city: "Dallas",
        state: "TX",
        zip: "75201",
      });
      const { customer: mia } = await addTeamMate(
        "mia@alpha.test",
        "manager",
        atlanta.id
      );

      const atlantaOrder = await placeInvoiceOrder(world.ada, {
        location_id: atlanta.id,
      });
      await placeInvoiceOrder(world.ada, { location_id: dallas.id });
      await placeInvoiceOrder(world.ada); // untagged

      const miaSees = await listedOrderIds(mia);
      expect(miaSees).toEqual([atlantaOrder.order_id]);

      // The admin still sees all three.
      expect(await listedOrderIds(world.ada)).toHaveLength(3);
    });

    it("falls back to the whole Company for a manager with no Location", async () => {
      await enableInvoicePayment();
      const atlanta = await createLocation(world.company.id, "Atlanta Plant");
      const { customer: max } = await addTeamMate("max@alpha.test", "manager");

      await placeInvoiceOrder(world.ada, { location_id: atlanta.id });
      await placeInvoiceOrder(world.ada);

      expect(await listedOrderIds(max)).toHaveLength(2);
    });

    it("scopes the approvals queue to a manager's Location the same way", async () => {
      await enableApprovalSetting();
      const atlanta = await createLocation(world.company.id, "Atlanta Plant");
      const dallas = await createLocation(world.company.id, "Dallas Plant");
      const { customer: mia } = await addTeamMate(
        "mia@alpha.test",
        "manager",
        atlanta.id
      );
      const { customer: mel } = await addTeamMate("mel@alpha.test", "member");

      const heldAtlanta = await world.submitQuoteRequest(mel, {
        location_id: atlanta.id,
      });
      const heldDallas = await world.submitQuoteRequest(mel, {
        location_id: dallas.id,
      });
      expect(heldAtlanta.approval_id).toBeTruthy();
      expect(heldDallas.approval_id).toBeTruthy();

      const miaQueue = await api.get(
        "/store/approvals",
        world.headersOf(mia)
      );
      expect(miaQueue.status).toEqual(200);
      expect(
        miaQueue.data.approvals.map((approval: any) => approval.id)
      ).toEqual([heldAtlanta.approval_id]);

      // The admin sees both.
      const adaQueue = await api.get(
        "/store/approvals",
        world.headersOf(world.ada)
      );
      expect(adaQueue.data.approvals).toHaveLength(2);
    });
  },
});
