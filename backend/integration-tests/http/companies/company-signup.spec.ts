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
import { approveDomains } from "../../utils/approved-domains";
import { COMPANY_MODULE } from "../../../src/modules/company";

jest.setTimeout(120 * 1000);

/*
  Ticket #2 — Sign up → Company + Welcome Code.

  ADR-0007: only an Approved Domain (acme.test here) is born Approved
  with a Welcome Code. Any other domain is born Pending with no code.

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
      await approveDomains(container);

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

      it("an Approved Domain gets an APPROVED Company with instant portal access, admin role, and a Welcome Code", async () => {
        // Instant access (2026-09-05, narrowed by ADR-0007): outreach
        // traffic converts in one sitting. Cardinal still gets the
        // signup email and can Decline in admin.
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

      describe("a domain that is not on the Approved Domain list (ADR-0007)", () => {
        const signupAs = async (email: string) => {
          const customerService: ICustomerModuleService = getContainer().resolve(
            Modules.CUSTOMER
          );
          const stranger = await customerService.createCustomers({
            email,
            first_name: "Sam",
            last_name: "Stranger",
          });
          const res = await api.post(
            "/store/companies",
            { name: "Stranger Co", phone: "555-0199" },
            headersFor(stranger.id)
          );
          return { stranger, res };
        };

        it("is born PENDING with no Welcome Code, and the Dashboard stays locked", async () => {
          const { stranger, res } = await signupAs("sam@prospect.test");
          expect(res.status).toBe(201);
          expect(res.data.company.status).toBe("pending");
          expect(res.data.welcome_code).toBeNull();
          expect(res.data.role).toBe("admin");

          const me = await api.get("/store/companies/me", headersFor(stranger.id));
          expect(me.data.company.status).toBe("pending");
          expect(me.data.company.welcome_code).toBeNull();

          const dash = await api
            .get("/store/dashboard", headersFor(stranger.id))
            .catch((e) => e.response);
          expect(dash.status).toBe(403);
          expect(dash.data.code).toBe("company_pending");

          // No promotion was minted for an unvetted signup.
          const promotionService: IPromotionModuleService = getContainer().resolve(
            Modules.PROMOTION
          );
          expect(await promotionService.listPromotions({})).toHaveLength(0);
        });

        it("matches the domain case-insensitively", async () => {
          const { res } = await signupAs("Sam@ACME.test");
          expect(res.data.company.status).toBe("approved");
        });

        it("does not treat a subdomain or a lookalike as listed", async () => {
          const a = await signupAs("sam@mail.acme.test");
          expect(a.res.data.company.status).toBe("pending");
        });

        it("a free-mail address is PENDING even if its domain got listed", async () => {
          const companyService = getContainer().resolve(COMPANY_MODULE) as any;
          await companyService.createApprovedDomains({ domain: "gmail.com", source: "import" });
          const { res } = await signupAs("sam@gmail.com");
          expect(res.data.company.status).toBe("pending");
        });

        it("an empty list means everyone is PENDING", async () => {
          const companyService = getContainer().resolve(COMPANY_MODULE) as any;
          const all = await companyService.listApprovedDomains({});
          await companyService.deleteApprovedDomains(all.map((d: any) => d.id));
          const { res } = await signupAs("sam@acme.test");
          expect(res.data.company.status).toBe("pending");
        });
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
