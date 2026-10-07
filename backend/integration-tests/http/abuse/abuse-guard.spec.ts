import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ICustomerModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { generatePublishableKey, generateStoreHeaders } from "../../utils/store";
import { customerHeaders, TEST_JWT_SECRET } from "../../utils/customer-auth";
import { __resetRateLimitMemory } from "../../../src/lib/rate-limit";
import jwt from "jsonwebtoken";

jest.setTimeout(120 * 1000);

/*
  Bot protection on the public write endpoints: storefront-only signup,
  per-IP rate limits, the honeypot, and the Turnstile challenge — and
  that each one stays OUT of the way when it is not configured.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: { headers: Record<string, string> };
    const SECRET = "test-storefront-secret";
    const contact = {
      name: "Ada",
      lastName: "Acme",
      email: "ada@acme.test",
      message: "Need 40 cold plates",
    };
    const withHeaders = (extra: Record<string, string>) => ({
      headers: { ...storeHeaders.headers, ...extra },
    });
    const post = (path: string, body: any, headers = storeHeaders) =>
      api.post(path, body, headers).catch((e) => e.response);

    // The test app has no email provider; stand in for it so a contact
    // submit that clears the guards answers 200 as it does in production.
    let sent: jest.SpyInstance;

    beforeEach(async () => {
      const container = getContainer();
      sent = jest
        .spyOn(container.resolve(Modules.NOTIFICATION), "createNotifications")
        .mockResolvedValue({} as any);
      storeHeaders = generateStoreHeaders({
        publishableKey: await generatePublishableKey(container),
      });
      __resetRateLimitMemory();
    });

    afterEach(() => {
      sent.mockRestore();
      process.env.RATE_LIMIT_DISABLED = "1";
      process.env.STOREFRONT_SHARED_SECRET = "";
      process.env.TURNSTILE_SECRET_KEY = "";
    });

    describe("rate limits", () => {
      beforeEach(() => {
        process.env.RATE_LIMIT_DISABLED = "0";
      });

      it("contact: the 10th submit in an hour goes through, the 11th is 429", async () => {
        for (let i = 0; i < 10; i++) {
          expect((await post("/store/contact", contact)).status).toBe(200);
        }
        const blocked = await post("/store/contact", contact);
        expect(blocked.status).toBe(429);
        expect(blocked.data.code).toBe("rate_limited");
        expect(blocked.headers["retry-after"]).toBe("3600");
      });

      it("register: 5 an hour per address", async () => {
        for (let i = 0; i < 5; i++) {
          const ok = await post("/auth/customer/emailpass/register", {
            email: `bot${i}@spam.test`,
            password: "hunter2hunter2",
          });
          expect(ok.status).toBe(200);
        }
        const blocked = await post("/auth/customer/emailpass/register", {
          email: "bot6@spam.test",
          password: "hunter2hunter2",
        });
        expect(blocked.status).toBe(429);
      });

      it("login is limited separately and does not swallow the register route", async () => {
        for (let i = 0; i < 20; i++) {
          await post("/auth/customer/emailpass", { email: "x@y.test", password: "nope" });
        }
        expect((await post("/auth/customer/emailpass", { email: "x@y.test", password: "nope" })).status).toBe(429);
        // A different bucket: register still works for this address.
        const reg = await post("/auth/customer/emailpass/register", {
          email: "fresh@acme.test",
          password: "hunter2hunter2",
        });
        expect(reg.status).toBe(200);
      });

      it("limits are per buyer: a trusted forwarded address gets its own bucket, an untrusted one does not", async () => {
        process.env.STOREFRONT_SHARED_SECRET = SECRET;
        const from = (ip: string, secret?: string) =>
          withHeaders({ "x-client-ip": ip, ...(secret ? { "x-storefront-secret": secret } : {}) });

        // Untrusted: rotating x-client-ip buys a bot nothing.
        for (let i = 0; i < 10; i++) {
          await post("/store/contact", contact, from(`203.0.113.${i}`));
        }
        expect((await post("/store/contact", contact, from("203.0.113.99"))).status).toBe(429);

        // Trusted (the storefront server): each buyer has their own bucket.
        expect((await post("/store/contact", contact, from("198.51.100.1", SECRET))).status).toBe(200);
        expect((await post("/store/contact", contact, from("198.51.100.2", SECRET))).status).toBe(200);
      });
    });

    describe("storefront-only signup", () => {
      it("is off (open) when no secret is configured", async () => {
        const res = await post("/auth/customer/emailpass/register", {
          email: "open@acme.test",
          password: "hunter2hunter2",
        });
        expect(res.status).toBe(200);
      });

      it("with a secret: direct calls to register, create-customer and create-company are 403", async () => {
        process.env.STOREFRONT_SHARED_SECRET = SECRET;
        const body = { email: "direct@spam.test", password: "hunter2hunter2" };

        const direct = await post("/auth/customer/emailpass/register", body);
        expect(direct.status).toBe(403);
        expect(direct.data.code).toBe("storefront_only");

        const wrong = await post("/auth/customer/emailpass/register", body, withHeaders({ "x-storefront-secret": "guess" }));
        expect(wrong.status).toBe(403);

        // Step two of signup, holding a real registration token.
        const registrationToken = jwt.sign(
          { actor_id: "", actor_type: "customer", auth_identity_id: "authid_direct", app_metadata: {} },
          TEST_JWT_SECRET,
          { expiresIn: "1h" }
        );
        const createCustomer = await post(
          "/store/customers",
          { email: body.email },
          withHeaders({ authorization: `Bearer ${registrationToken}` })
        );
        expect(createCustomer.status).toBe(403);
        expect(createCustomer.data.code).toBe("storefront_only");

        const customerService: ICustomerModuleService = getContainer().resolve(Modules.CUSTOMER);
        const customer = await customerService.createCustomers({ email: "ada@acme.test" });
        const company = await post(
          "/store/companies",
          { name: "Acme CDU", phone: "555-0100" },
          customerHeaders(storeHeaders, customer.id)
        );
        expect(company.status).toBe(403);
      });

      it("with a secret: the storefront gets through", async () => {
        process.env.STOREFRONT_SHARED_SECRET = SECRET;
        const res = await post(
          "/auth/customer/emailpass/register",
          { email: "real@acme.test", password: "hunter2hunter2" },
          withHeaders({ "x-storefront-secret": SECRET })
        );
        expect(res.status).toBe(200);
        expect(typeof res.data.token).toBe("string");
      });

      it("login is NOT storefront-only (only rate limited)", async () => {
        process.env.STOREFRONT_SHARED_SECRET = SECRET;
        const res = await post("/auth/customer/emailpass", { email: "x@y.test", password: "nope" });
        expect(res.status).toBe(401);
      });
    });

    describe("honeypot", () => {
      it("a filled trap field gets a calm 200 and no email is attempted", async () => {
        const res = await post("/store/contact", { ...contact, website: "http://spam.example" });
        expect(res.status).toBe(200);
        expect(res.data).toEqual({ success: true });
        expect(sent).not.toHaveBeenCalled();
      });

      it("an inhumanly fast submit is treated the same", async () => {
        const res = await post("/store/contact", { ...contact, elapsed_ms: 120 });
        expect(res.status).toBe(200);
        expect(sent).not.toHaveBeenCalled();
      });

      it("a human submit carrying the guard fields validates and is sent", async () => {
        const res = await post("/store/contact", {
          ...contact,
          projectType: "CDU",
          website: "",
          elapsed_ms: 8400,
          turnstile_token: "anything",
        });
        expect(res.status).toBe(200);
        expect(sent).toHaveBeenCalledTimes(1);
      });
    });

    describe("Turnstile", () => {
      it("is off when no secret key is configured (the form must never go down)", async () => {
        expect((await post("/store/contact", contact)).status).toBe(200);
      });

      it("with a key: a missing token is 403 challenge_failed on contact and register", async () => {
        process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
        const c = await post("/store/contact", contact);
        expect(c.status).toBe(403);
        expect(c.data.code).toBe("challenge_failed");
        const r = await post("/auth/customer/emailpass/register", {
          email: "bot@spam.test",
          password: "hunter2hunter2",
        });
        expect(r.status).toBe(403);
      });
    });
  },
});
