import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ICustomerModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../../../src/modules/company";
import { adminHeaders, createAdminUser } from "../../../utils/admin";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../utils/store";
import { customerHeaders, TEST_JWT_SECRET } from "../../../utils/customer-auth";

jest.setTimeout(120 * 1000);

/*
  Ticket #3 — Cardinal approves or declines a Company in Medusa Admin.

  ADR-0007: acme.test is not an Approved Domain in this suite, so the
  signup is born Pending, with no Welcome Code.
  A Pending Company's Team Members can sign in but Dashboard data
  routes answer 403 company_pending. Cardinal approves (or declines)
  over the admin API; approval unlocks those routes on the next call,
  and decline stays the ban hammer for junk signups.
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
        { name: "Acme CDU", phone: "555-0100" },
        buyer()
      );
      company = signup.data.company;
      expect(company.status).toBe("pending");
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

      it("a Declined Company can be reinstated; an Approved one CAN be declined (ban hammer)", async () => {
        await api.post(`/admin/companies/${company.id}/decline`, {}, adminHeaders);
        const reinstated = await api.post(`/admin/companies/${company.id}/approve`, {}, adminHeaders);
        expect(reinstated.data.company.status).toBe("approved");

        // Instant access (2026-09-05): signups are born approved, so the
        // ban hammer must land on an Approved Company too.
        const banned = await api.post(`/admin/companies/${company.id}/decline`, {}, adminHeaders);
        expect(banned.status).toBe(200);
        expect(banned.data.company.status).toBe("declined");

        const dashboard = await api
          .get("/store/dashboard", buyer())
          .catch((e) => e.response);
        expect(dashboard.status).toBe(403);
        expect(dashboard.data.code).toBe("company_declined");
      });

      describe("a decision keeps the Approved Domain list in step (ADR-0007)", () => {
        const listedDomains = async () => {
          const companyService = getContainer().resolve(COMPANY_MODULE) as any;
          const rows = await companyService.listApprovedDomains({});
          return rows.map((r: any) => r.domain).sort();
        };
        const signupColleague = async (email: string) => {
          const customerService: ICustomerModuleService = getContainer().resolve(
            Modules.CUSTOMER
          );
          const colleague = await customerService.createCustomers({
            email,
            first_name: "Cy",
            last_name: "Colleague",
          });
          return api.post(
            "/store/companies",
            { name: `Acme ${email.split("@")[0]}`, phone: "555-0177" },
            customerHeaders(storeHeaders, colleague.id)
          );
        };

        it("approve → issues the Welcome Code the Pending signup never got", async () => {
          const before = await api.get("/store/companies/me", buyer());
          expect(before.data.company.welcome_code).toBeNull();

          await api.post(`/admin/companies/${company.id}/approve`, {}, adminHeaders);

          const me = await api.get("/store/companies/me", buyer());
          expect(me.data.company.welcome_code).toMatch(/^WELCOME-[A-Z0-9]{6}$/);
        });

        it("approve → lists the domain, so a colleague is approved instantly", async () => {
          expect(await listedDomains()).toEqual([]);
          const early = await signupColleague("early@acme.test");
          expect(early.data.company.status).toBe("pending");

          await api.post(`/admin/companies/${company.id}/approve`, {}, adminHeaders);
          expect(await listedDomains()).toEqual(["acme.test"]);

          const late = await signupColleague("late@acme.test");
          expect(late.data.company.status).toBe("approved");
          expect(late.data.welcome_code).toMatch(/^WELCOME-/);
        });

        it("decline → removes the domain, so a colleague waits again; re-approve puts it back", async () => {
          await api.post(`/admin/companies/${company.id}/approve`, {}, adminHeaders);
          await api.post(`/admin/companies/${company.id}/decline`, {}, adminHeaders);
          expect(await listedDomains()).toEqual([]);

          const colleague = await signupColleague("cy@acme.test");
          expect(colleague.data.company.status).toBe("pending");

          await api.post(`/admin/companies/${company.id}/approve`, {}, adminHeaders);
          expect(await listedDomains()).toEqual(["acme.test"]);
        });

        it("re-approval does not mint a second Welcome Code", async () => {
          await api.post(`/admin/companies/${company.id}/approve`, {}, adminHeaders);
          const first = (await api.get("/store/companies/me", buyer())).data.company.welcome_code;
          await api.post(`/admin/companies/${company.id}/decline`, {}, adminHeaders);
          await api.post(`/admin/companies/${company.id}/approve`, {}, adminHeaders);
          const second = (await api.get("/store/companies/me", buyer())).data.company.welcome_code;
          expect(second).toBe(first);
        });

        it("approving a free-mail signup never lists the free-mail domain", async () => {
          const customerService: ICustomerModuleService = getContainer().resolve(
            Modules.CUSTOMER
          );
          const gm = await customerService.createCustomers({
            email: "smallshop@gmail.com",
            first_name: "Gil",
            last_name: "Shop",
          });
          const signup = await api.post(
            "/store/companies",
            { name: "Gil's Fab", phone: "555-0155" },
            customerHeaders(storeHeaders, gm.id)
          );
          expect(signup.data.company.status).toBe("pending");
          await api.post(`/admin/companies/${signup.data.company.id}/approve`, {}, adminHeaders);
          expect(await listedDomains()).toEqual([]);
        });
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
