import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ICustomerModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../../src/modules/company";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";
import { customerHeaders, TEST_JWT_SECRET } from "../../utils/customer-auth";

jest.setTimeout(180 * 1000);

/*
  Ticket #4 — Roles + Team + Invites.

  A Team Member of an Approved Company sees the Team and invites a
  coworker by email. The coworker signs in (as a customer with that
  email) and accepts the token: they become an admin Team Member of the
  inviter's Company. Tokens are single-use, expire, and are bound to the
  invited email. Cardinal changes roles / removes people in Admin.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders;
    let ada, bo, mallory;
    let company;

    const headersOf = (customer) => customerHeaders(storeHeaders, customer.id);

    const inviteTokenFor = async (email: string) => {
      const companyService = getContainer().resolve(COMPANY_MODULE);
      const [invite] = await companyService.listCompanyInvites({ email });
      return invite.token as string;
    };

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      storeHeaders = generateStoreHeaders({ publishableKey });

      const customerService: ICustomerModuleService = container.resolve(Modules.CUSTOMER);
      const mk = (email: string, first: string) =>
        customerService.createCustomers({ email, first_name: first, last_name: "Test" });
      ada = await mk("ada@acme.test", "Ada");
      bo = await mk("bo@acme.test", "Bo");
      mallory = await mk("mallory@evil.test", "Mallory");

      // Instant access (2026-09-05): signup approves the Company on the
      // spot, so no admin approve step is needed (and approving an
      // already-approved Company is a 400).
      const signup = await api.post("/store/companies", { name: "Acme CDU", phone: "555-0100" }, headersOf(ada));
      company = signup.data.company;
    });

    describe("Team", () => {
      it("GET /store/dashboard/team lists Team Members with Role and open invites", async () => {
        await api.post("/store/dashboard/invites", { email: "bo@acme.test" }, headersOf(ada));
        const res = await api.get("/store/dashboard/team", headersOf(ada));
        expect(res.status).toBe(200);
        expect(res.data.team).toEqual([
          expect.objectContaining({
            role: "admin",
            customer: expect.objectContaining({ email: "ada@acme.test", first_name: "Ada" }),
          }),
        ]);
        expect(res.data.invites).toEqual([
          expect.objectContaining({ email: "bo@acme.test" }),
        ]);
        expect(JSON.stringify(res.data)).not.toContain("token");
      });
    });

    describe("Invites", () => {
      it("a coworker accepts an invite and lands in the inviter's Company as admin", async () => {
        const invited = await api.post("/store/dashboard/invites", { email: "bo@acme.test" }, headersOf(ada));
        expect(invited.status).toBe(201);
        const token = await inviteTokenFor("bo@acme.test");

        const peek = await api.get(`/store/companies/invites/${token}`, storeHeaders);
        expect(peek.data.invite).toEqual(
          expect.objectContaining({ email: "bo@acme.test", company_name: "Acme CDU" })
        );

        const accepted = await api.post(`/store/companies/invites/${token}/accept`, {}, headersOf(bo));
        expect(accepted.status).toBe(200);
        expect(accepted.data.company.id).toBe(company.id);
        expect(accepted.data.role).toBe("admin");

        const me = await api.get("/store/companies/me", headersOf(bo));
        expect(me.data.company.id).toBe(company.id);

        const team = await api.get("/store/dashboard/team", headersOf(ada));
        expect(team.data.team).toHaveLength(2);
        expect(team.data.invites).toHaveLength(0);
      });

      it("a token cannot be reused", async () => {
        await api.post("/store/dashboard/invites", { email: "bo@acme.test" }, headersOf(ada));
        const token = await inviteTokenFor("bo@acme.test");
        await api.post(`/store/companies/invites/${token}/accept`, {}, headersOf(bo));

        const again = await api
          .post(`/store/companies/invites/${token}/accept`, {}, headersOf(bo))
          .catch((e) => e.response);
        expect(again.status).toBe(400);
      });

      it("only the invited email can accept", async () => {
        await api.post("/store/dashboard/invites", { email: "bo@acme.test" }, headersOf(ada));
        const token = await inviteTokenFor("bo@acme.test");
        const res = await api
          .post(`/store/companies/invites/${token}/accept`, {}, headersOf(mallory))
          .catch((e) => e.response);
        expect(res.status).toBe(400);
        const me = await api.get("/store/companies/me", headersOf(mallory)).catch((e) => e.response);
        expect(me.status).toBe(404);
      });

      it("an unknown token is 404", async () => {
        const res = await api.get("/store/companies/invites/nope", storeHeaders).catch((e) => e.response);
        expect(res.status).toBe(404);
      });

      it("a Pending Company cannot invite yet", async () => {
        // Signups are approved instantly now; pending only arises when
        // Cardinal parks an account manually. Recreate that state directly.
        const created = await api.post("/store/companies", { name: "Not Yet Inc", phone: "555-0104" }, headersOf(mallory));
        const companyService = getContainer().resolve(COMPANY_MODULE) as any;
        await companyService.updateCompanies([
          { id: created.data.company.id, status: "pending" },
        ]);
        const res = await api
          .post("/store/dashboard/invites", { email: "x@y.test" }, headersOf(mallory))
          .catch((e) => e.response);
        expect(res.status).toBe(403);
        expect(res.data.code).toBe("company_pending");
      });

      it("someone with no Company cannot invite", async () => {
        const res = await api
          .post("/store/dashboard/invites", { email: "x@y.test" }, headersOf(mallory))
          .catch((e) => e.response);
        expect(res.status).toBe(404);
      });
    });

    describe("Admin manages the Team", () => {
      it("changes a Team Member's Role and Spending Limit, and removes them", async () => {
        const { data } = await api.get(`/admin/companies/${company.id}`, adminHeaders);
        const member = data.company.employees[0];

        const updated = await api.post(
          `/admin/companies/${company.id}/team-members/${member.id}`,
          { role: "member", spending_limit: 2500 },
          adminHeaders
        );
        expect(updated.data.team_member).toEqual(
          expect.objectContaining({ role: "member", spending_limit: 2500 })
        );
        const me = await api.get("/store/companies/me", headersOf(ada));
        expect(me.data.role).toBe("member");

        const removed = await api.delete(
          `/admin/companies/${company.id}/team-members/${member.id}`,
          adminHeaders
        );
        expect(removed.data.deleted).toBe(true);
        const gone = await api.get("/store/companies/me", headersOf(ada)).catch((e) => e.response);
        expect(gone.status).toBe(404);

        // Company prices and codes stop applying: out of the Customer Group too.
        const customerService: ICustomerModuleService = getContainer().resolve(Modules.CUSTOMER);
        const [fresh] = await customerService.listCustomers({ id: ada.id }, { relations: ["groups"] });
        expect(fresh.groups ?? []).toHaveLength(0);
      });

      it("cannot edit a Team Member through another Company's URL", async () => {
        const { data } = await api.get(`/admin/companies/${company.id}`, adminHeaders);
        const member = data.company.employees[0];
        const res = await api
          .post(`/admin/companies/comp_other/team-members/${member.id}`, { role: "member" }, adminHeaders)
          .catch((e) => e.response);
        expect(res.status).toBe(404);
      });
    });
  },
});
