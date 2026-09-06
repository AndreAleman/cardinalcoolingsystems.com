import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import {
  ICustomerModuleService,
  IPromotionModuleService,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";
import { customerHeaders, TEST_JWT_SECRET } from "../../utils/customer-auth";

jest.setTimeout(120 * 1000);

/*
  Ticket #2 — Sign up → Pending Company + Welcome Code.

  A signed-in customer with no Company posts a company name. One
  workflow creates the Pending Company, makes them its admin Team
  Member, and issues a Company-scoped Welcome Code (10%, once, 30 days).
  The code comes back in the response so the storefront can show it at
  once, and stays readable on GET /store/companies/me until approval.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let baseHeaders;
    let customer;

    const headersFor = (customerId: string) =>
      customerHeaders(baseHeaders, customerId);

    beforeEach(async () => {
      const container = getContainer();
      const publishableKey = await generatePublishableKey(container);
      baseHeaders = generateStoreHeaders({ publishableKey });

      const customerService: ICustomerModuleService = container.resolve(
        Modules.CUSTOMER
      );
      customer = await customerService.createCustomers({
        email: "ada@acme.test",
        first_name: "Ada",
        last_name: "Acme",
      });
    });

    describe("POST /store/companies", () => {
      it("requires a signed-in customer", async () => {
        const res = await api
          .post("/store/companies", { name: "Acme CDU", phone: "555-0100" }, baseHeaders)
          .catch((e) => e.response);
        expect(res.status).toBe(401);
      });

      it("creates an APPROVED Company with instant portal access, makes the customer its admin, and issues a Welcome Code", async () => {
        // Instant access (2026-09-05): cold-email traffic converts in one
        // sitting — the account works the moment it's created. Cardinal
        // still gets the signup email and can Decline junk in admin.
        const res = await api.post(
          "/store/companies",
          { name: "Acme CDU", phone: "555-0100" },
          headersFor(customer.id)
        );

        expect(res.status).toBe(201);
        expect(res.data.company).toEqual(
          expect.objectContaining({
            name: "Acme CDU",
            email: "ada@acme.test",
            status: "approved",
          })
        );
        expect(res.data.role).toBe("admin");
        expect(res.data.welcome_code).toMatch(/^WELCOME-[A-Z0-9]{6}$/);

        const me = await api.get("/store/companies/me", headersFor(customer.id));
        expect(me.data.company.status).toBe("approved");
        expect(me.data.company.welcome_code).toBe(res.data.welcome_code);
      });

      it("the Welcome Code is a 10% promotion, usable once, expiring in 30 days, scoped to the Company", async () => {
        const before = Date.now();
        const res = await api.post(
          "/store/companies",
          { name: "Acme CDU", phone: "555-0100" },
          headersFor(customer.id)
        );

        const promotionService: IPromotionModuleService = getContainer().resolve(
          Modules.PROMOTION
        );
        const [promotion] = await promotionService.listPromotions(
          { code: res.data.welcome_code },
          { relations: ["application_method", "rules", "rules.values", "campaign", "campaign.budget"] }
        );

        expect(promotion.application_method).toEqual(
          expect.objectContaining({ type: "percentage", target_type: "order", value: 10 })
        );
        expect(promotion.campaign!.budget).toEqual(
          expect.objectContaining({ type: "usage", limit: 1 })
        );

        const endsAt = new Date(promotion.campaign!.ends_at!).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        expect(endsAt - before).toBeGreaterThan(thirtyDays - 60_000);
        expect(endsAt - before).toBeLessThan(thirtyDays + 60_000);

        // Scoped to the Company's own customer group — not usable by anyone else.
        const groupRule = promotion.rules!.find(
          (r) => r.attribute === "customer.groups.id"
        );
        expect(groupRule).toBeDefined();
        const customerService: ICustomerModuleService = getContainer().resolve(
          Modules.CUSTOMER
        );
        const [fresh] = await customerService.listCustomers(
          { id: customer.id },
          { relations: ["groups"] }
        );
        const groupIds = (fresh.groups ?? []).map((g) => g.id);
        expect(groupIds).toEqual(groupRule!.values!.map((v) => v.value));
      });

      it("stops reporting the Welcome Code once its campaign has ended", async () => {
        const res = await api.post("/store/companies", { name: "Acme CDU", phone: "555-0100" }, headersFor(customer.id));
        const promotionService: IPromotionModuleService = getContainer().resolve(Modules.PROMOTION);
        const [promotion] = await promotionService.listPromotions(
          { code: res.data.welcome_code },
          { relations: ["campaign"] }
        );
        await promotionService.updateCampaigns({
          id: promotion.campaign!.id,
          ends_at: new Date(Date.now() - 1000),
        });

        const me = await api.get("/store/companies/me", headersFor(customer.id));
        expect(me.data.company.welcome_code).toBeNull();
      });

      it("refuses a second Company for someone who is already a Team Member", async () => {
        await api.post("/store/companies", { name: "Acme CDU", phone: "555-0100" }, headersFor(customer.id));
        const res = await api
          .post("/store/companies", { name: "Acme Again", phone: "555-0100" }, headersFor(customer.id))
          .catch((e) => e.response);
        expect(res.status).toBe(400);
      });

      it("requires a phone number", async () => {
        const res = await api
          .post("/store/companies", { name: "Acme CDU" }, headersFor(customer.id))
          .catch((err) => err.response);
        expect(res.status).toBe(400);
      });

      it("stores the phone on the Company and the customer", async () => {
        await api.post(
          "/store/companies",
          { name: "Acme CDU", phone: "555-0100" },
          headersFor(customer.id)
        );

        const container = getContainer();
        const query = container.resolve("query");
        const { data: companies } = await query.graph({
          entity: "company",
          fields: ["id", "phone"],
          filters: {},
        });
        expect(companies[0].phone).toEqual("555-0100");

        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["id", "phone"],
          filters: { id: customer.id },
        });
        expect(customers[0].phone).toEqual("555-0100");
      });

      it("rejects an empty company name", async () => {
        const res = await api
          .post("/store/companies", { name: "" }, headersFor(customer.id))
          .catch((e) => e.response);
        expect(res.status).toBe(400);
      });
    });
  },
});
