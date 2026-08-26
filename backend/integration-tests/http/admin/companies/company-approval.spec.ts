import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ICustomerModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { adminHeaders, createAdminUser } from "../../../utils/admin";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../utils/store";
import { customerHeaders, TEST_JWT_SECRET } from "../../../utils/customer-auth";

jest.setTimeout(120 * 1000);

/*
  Ticket #3 — Cardinal approves a Company in Medusa Admin.

  A Pending Company's Team Members can sign in but Dashboard data
  routes answer 403 company_pending. Cardinal approves (or declines)
  over the admin API; approval unlocks those routes on the next call.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders;
    let customer;
    let company;

    const buyer = () => customerHeaders(storeHeaders, customer.id);

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      const publishableKey = await generatePublishableKey(container);
      storeHeaders = generateStoreHeaders({ publishableKey });

      const customerService: ICustomerModuleService = container.resolve(
        Modules.CUSTOMER
      );
      customer = await customerService.createCustomers({
        email: "ada@acme.test",
        first_name: "Ada",
        last_name: "Acme",
      });
      const signup = await api.post(
        "/store/companies",
        { name: "Acme CDU" },
        buyer()
      );
      company = signup.data.company;
    });

    describe("Pending lock", () => {
      it("GET /store/dashboard is 403 company_pending until approved", async () => {
        const res = await api.get("/store/dashboard", buyer()).catch((e) => e.response);
        expect(res.status).toBe(403);
        expect(res.data.code).toBe("company_pending");
      });
    });

    describe("Admin companies", () => {
      it("lists Pending Companies with their Team Members", async () => {
        const res = await api.get("/admin/companies?status=pending", adminHeaders);
        expect(res.status).toBe(200);
        expect(res.data.companies).toHaveLength(1);
        expect(res.data.companies[0]).toEqual(
          expect.objectContaining({ id: company.id, status: "pending" })
        );
        expect(res.data.companies[0].employees[0].customer.email).toBe("ada@acme.test");
      });

      it("retrieves one Company", async () => {
        const res = await api.get(`/admin/companies/${company.id}`, adminHeaders);
        expect(res.data.company.name).toBe("Acme CDU");
      });

      it("approve → Company is approved and the Dashboard unlocks", async () => {
        const res = await api.post(
          `/admin/companies/${company.id}/approve`,
          {},
          adminHeaders
        );
        expect(res.status).toBe(200);
        expect(res.data.company.status).toBe("approved");

        const me = await api.get("/store/companies/me", buyer());
        expect(me.data.company.status).toBe("approved");

        const dashboard = await api.get("/store/dashboard", buyer());
        expect(dashboard.status).toBe(200);
        expect(dashboard.data.company.id).toBe(company.id);
        expect(dashboard.data.role).toBe("admin");
      });

      it("decline → Company is declined and the Dashboard stays locked", async () => {
        const res = await api.post(
          `/admin/companies/${company.id}/decline`,
          {},
          adminHeaders
        );
        expect(res.data.company.status).toBe("declined");

        const dashboard = await api
          .get("/store/dashboard", buyer())
          .catch((e) => e.response);
        expect(dashboard.status).toBe(403);
        expect(dashboard.data.code).toBe("company_declined");
      });

      it("a Declined Company can be reinstated; an Approved one cannot be declined", async () => {
        await api.post(`/admin/companies/${company.id}/decline`, {}, adminHeaders);
        const reinstated = await api.post(`/admin/companies/${company.id}/approve`, {}, adminHeaders);
        expect(reinstated.data.company.status).toBe("approved");

        const res = await api
          .post(`/admin/companies/${company.id}/decline`, {}, adminHeaders)
          .catch((e) => e.response);
        expect(res.status).toBe(400);
        const still = await api.get(`/admin/companies/${company.id}`, adminHeaders);
        expect(still.data.company.status).toBe("approved");
      });

      it("admin routes need an admin session", async () => {
        const res = await api
          .post(`/admin/companies/${company.id}/approve`, {}, buyer())
          .catch((e) => e.response);
        expect(res.status).toBe(401);
      });
    });
  },
});
