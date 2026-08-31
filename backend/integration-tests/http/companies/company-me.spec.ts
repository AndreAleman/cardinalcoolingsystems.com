import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ICustomerModuleService } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../../src/modules/company";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";
import { customerHeaders, TEST_JWT_SECRET } from "../../utils/customer-auth";

jest.setTimeout(120 * 1000);

/*
  Ticket #12 — "who is my Company?"

  GET /store/companies/me answers, for the signed-in customer, which
  Company they are a Team Member of. The Company is resolved by walking
  customer → employee → company (ADR-0004): no header, cookie or
  hostname is consulted, so a Team Member of Company A can never be
  handed Company B.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let baseHeaders;
    let companyA, companyB;
    let aCustomer, bCustomer, outsiderCustomer;

    const headersFor = (customerId: string, extra: Record<string, string> = {}) =>
      customerHeaders(baseHeaders, customerId, extra);

    beforeEach(async () => {
      const container = getContainer();
      const publishableKey = await generatePublishableKey(container);
      baseHeaders = generateStoreHeaders({ publishableKey });

      const companyService = container.resolve(COMPANY_MODULE);
      const customerService: ICustomerModuleService = container.resolve(
        Modules.CUSTOMER
      );
      const remoteLink = container.resolve(
        ContainerRegistrationKeys.REMOTE_LINK
      );

      [companyA, companyB] = await companyService.createCompanies([
        { name: "Acme CDU", email: "buyer@acme.test" },
        { name: "Bolt Immersion", email: "buyer@bolt.test" },
      ]);

      aCustomer = await customerService.createCustomers({
        email: "a@acme.test",
        first_name: "Ada",
        last_name: "Acme",
      });
      bCustomer = await customerService.createCustomers({
        email: "b@bolt.test",
        first_name: "Bo",
        last_name: "Bolt",
      });
      outsiderCustomer = await customerService.createCustomers({
        email: "nobody@retail.test",
        first_name: "No",
        last_name: "Company",
      });

      const [aEmployee, bEmployee] = await companyService.createEmployees([
        { company_id: companyA.id, role: "admin" },
        { company_id: companyB.id, role: "manager" },
      ]);
      await remoteLink.create({
        [COMPANY_MODULE]: { employee_id: aEmployee.id },
        [Modules.CUSTOMER]: { customer_id: aCustomer.id },
      });
      await remoteLink.create({
        [COMPANY_MODULE]: { employee_id: bEmployee.id },
        [Modules.CUSTOMER]: { customer_id: bCustomer.id },
      });
    });

    describe("GET /store/companies/me", () => {
      it("requires a signed-in customer", async () => {
        const res = await api
          .get("/store/companies/me", baseHeaders)
          .catch((e) => e.response);
        expect(res.status).toBe(401);
      });

      it("returns the caller's own Company", async () => {
        const res = await api.get(
          "/store/companies/me",
          headersFor(aCustomer.id)
        );
        expect(res.status).toBe(200);
        expect(res.data.company).toEqual(
          expect.objectContaining({ id: companyA.id, name: "Acme CDU" })
        );
        expect(res.data.role).toBe("admin");
        expect(res.data.company.id).not.toBe(companyB.id);
        expect(JSON.stringify(res.data)).not.toContain(companyB.id);
      });

      it("is 404 for a customer who is not a Team Member of any Company", async () => {
        const res = await api
          .get("/store/companies/me", headersFor(outsiderCustomer.id))
          .catch((e) => e.response);
        expect(res.status).toBe(404);
      });

      it("ignores any x-company-id header — Company comes only from the signed-in Team Member", async () => {
        const res = await api.get(
          "/store/companies/me",
          headersFor(aCustomer.id, { "x-company-id": companyB.id })
        );
        expect(res.status).toBe(200);
        expect(res.data.company.id).toBe(companyA.id);
      });
    });
  },
});
