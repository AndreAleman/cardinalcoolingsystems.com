import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";
import { COMPANY_MODULE } from "../../../src/modules/company";
import { APPROVAL_MODULE } from "../../../src/modules/approval";
import { Modules } from "@medusajs/framework/utils";

jest.setTimeout(180 * 1000);

/*
  Approvals (CONTEXT.md: Approval, Approval Setting):

  With a Company's Approval Setting ON, a `member` Team Member's
  submission is HELD: a pending Approval freezes the cart, and no quote
  exists until a Company admin approves it on the Dashboard. Approving
  resumes the held cart into the quote pipeline; rejecting releases
  nothing to Cardinal. The Setting is per Company, editable only by an
  admin Team Member. Built now, inert until roles are used (spec
  stories 65-68).
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;
    let mel: any; // member Team Member of Ada's company

    const demoteToMember = async (customerId: string) => {
      const container = getContainer();
      const query = container.resolve("query");
      const { data } = await query.graph({
        entity: "customer",
        fields: ["id", "employee.id"],
        filters: { id: customerId },
      });
      const companyService = container.resolve(COMPANY_MODULE) as any;
      await companyService.updateEmployees([
        { id: (data[0] as any).employee.id, role: "member" },
      ]);
    };

    const enableApprovalSetting = async () => {
      const container = getContainer();
      const approvalService = container.resolve(APPROVAL_MODULE) as any;
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

    const addMemberToCompany = async (email: string) => {
      const container = getContainer();
      const customerService = container.resolve(Modules.CUSTOMER) as any;
      const customer = await customerService.createCustomers({
        email,
        first_name: "Mel",
        last_name: "Member",
      });
      const companyService = container.resolve(COMPANY_MODULE) as any;
      const employee = await companyService.createEmployees({
        role: "member",
        company_id: world.company.id,
      });
      const remoteLink = container.resolve("remoteLink") as any;
      await remoteLink.create([
        {
          [COMPANY_MODULE]: { employee_id: employee.id },
          [Modules.CUSTOMER]: { customer_id: customer.id },
        },
      ]);
      return customer;
    };

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });
      mel = await addMemberToCompany("mel@alpha.test");
    });

    it("holds a member's Quote Request and freezes the cart until an admin approves", async () => {
      await enableApprovalSetting();

      const held = await world.submitQuoteRequest(mel, { po_number: "PO-M1" });
      expect(held.pending_approval).toBe(true);
      expect(held.approval_id).toBeTruthy();
      expect(held.quote_id).toBeNull();

      // Frozen: mutating the held cart fails.
      const mutate = await api
        .post(
          `/store/carts/${held.cart.id}/line-items`,
          { variant_id: world.variant.id, quantity: 1 },
          world.headersOf(mel)
        )
        .catch((err) => err.response);
      expect(mutate.status).toBeGreaterThanOrEqual(400);

      // The company admin approves from the Dashboard.
      const approved = await api.post(
        `/store/approvals/${held.approval_id}`,
        { status: "approved" },
        world.headersOf(world.ada)
      );
      expect(approved.status).toEqual(200);

      // Resume created the Quote for Cardinal.
      const query = getContainer().resolve("query");
      const { data: quotes } = await query.graph({
        entity: "quote",
        fields: ["id", "status", "cart_id"],
        filters: { cart_id: held.cart.id },
      });
      expect(quotes).toHaveLength(1);
      expect(quotes[0].status).toEqual("pending_merchant");
    });

    it("lets the admin reject, and nothing reaches Cardinal", async () => {
      await enableApprovalSetting();
      const held = await world.submitQuoteRequest(mel);

      const rejected = await api.post(
        `/store/approvals/${held.approval_id}`,
        { status: "rejected" },
        world.headersOf(world.ada)
      );
      expect(rejected.status).toEqual(200);

      const query = getContainer().resolve("query");
      const { data: quotes } = await query.graph({
        entity: "quote",
        fields: ["id"],
        filters: { cart_id: held.cart.id },
      });
      expect(quotes).toHaveLength(0);
    });

    it("forbids a member from deciding approvals", async () => {
      await enableApprovalSetting();
      const held = await world.submitQuoteRequest(mel);

      const denied = await api
        .post(
          `/store/approvals/${held.approval_id}`,
          { status: "approved" },
          world.headersOf(mel)
        )
        .catch((err) => err.response);
      expect(denied.status).toEqual(403);
    });

    it("scopes GET /store/approvals by Role", async () => {
      await enableApprovalSetting();
      const held = await world.submitQuoteRequest(mel);

      const adminQueue = await api.get(
        "/store/approvals",
        world.headersOf(world.ada)
      );
      expect(
        adminQueue.data.approvals.map((approval) => approval.id)
      ).toContain(held.approval_id);

      const memberQueue = await api.get(
        "/store/approvals",
        world.headersOf(mel)
      );
      expect(
        memberQueue.data.approvals.map((approval) => approval.id)
      ).toContain(held.approval_id);

      // A different Company sees nothing.
      const { customer: outsider } = await world.addTeamMember(
        "bo@bravo.test",
        "Bo"
      );
      const outsiderQueue = await api.get(
        "/store/approvals",
        world.headersOf(outsider)
      );
      expect(outsiderQueue.data.approvals).toHaveLength(0);
    });

    it("submits straight through when the Setting is off (default)", async () => {
      const result = await world.submitQuoteRequest(mel);
      expect(result.pending_approval).toBe(false);
      expect(result.quote_id).toBeTruthy();
    });

    it("exposes the Approval Setting on the dashboard, admin-editable only", async () => {
      const read = await api.get(
        "/store/dashboard/approval-settings",
        world.headersOf(world.ada)
      );
      expect(read.status).toEqual(200);
      expect(read.data.approval_settings.requires_admin_approval).toBe(false);

      const updated = await api.post(
        "/store/dashboard/approval-settings",
        { requires_admin_approval: true },
        world.headersOf(world.ada)
      );
      expect(updated.status).toEqual(200);
      expect(updated.data.approval_settings.requires_admin_approval).toBe(true);

      const denied = await api
        .post(
          "/store/dashboard/approval-settings",
          { requires_admin_approval: false },
          world.headersOf(mel)
        )
        .catch((err) => err.response);
      expect(denied.status).toEqual(403);
    });
  },
});
