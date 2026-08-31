import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ICustomerModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../../src/modules/company";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { customerHeaders, TEST_JWT_SECRET } from "../../utils/customer-auth";

jest.setTimeout(120 * 1000);

/*
  Ticket #5 — Company prices.

  The external seam is GET /store/dashboard/variants/:id/price. It must
  calculate the price with the caller's Company Customer Group, so the
  browser cannot pick a different Company's pricing context.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders: { headers: Record<string, string> };
    let ada: any;
    let bo: any;
    let companyA: any;
    let companyB: any;
    let groupA: any;
    let variant: any;

    const headersOf = (customer: { id: string }) => customerHeaders(storeHeaders, customer.id);

    beforeEach(async () => {
      const container = getContainer();
      storeHeaders = generateStoreHeaders({ publishableKey: await generatePublishableKey(container) });
      await createAdminUser(adminHeaders, container);

      const customerService: ICustomerModuleService = container.resolve(Modules.CUSTOMER);
      [ada, bo] = await customerService.createCustomers([
        { email: "ada@alpha.test", first_name: "Ada", last_name: "Alpha" },
        { email: "bo@bravo.test", first_name: "Bo", last_name: "Bravo" },
      ]);

      companyA = (await api.post("/store/companies", { name: "Alpha Cooling", phone: "555-0101" }, headersOf(ada))).data.company;
      companyB = (await api.post("/store/companies", { name: "Bravo Cooling", phone: "555-0102" }, headersOf(bo))).data.company;

      const companyService = container.resolve(COMPANY_MODULE) as any;
      await companyService.updateCompanies([
        { id: companyA.id, status: "approved" },
        { id: companyB.id, status: "approved" },
      ]);

      const query = container.resolve(ContainerRegistrationKeys.QUERY);
      const { data } = await query.graph({
        entity: "company",
        fields: ["id", "customer_group.id"],
        filters: { id: [companyA.id, companyB.id] },
      });
      groupA = data.find((company: any) => company.id === companyA.id).customer_group;

      const product = (
        await api.post(
          "/admin/products",
          {
            title: "Dashboard Test Part",
            handle: "dashboard-test-part",
            status: "published",
            options: [{ title: "Size", values: ["One"] }],
            variants: [
              {
                title: "One",
                sku: "DASH-PRICE-1",
                manage_inventory: false,
                prices: [{ currency_code: "usd", amount: 100 }],
                options: { Size: "One" },
              },
            ],
          },
          adminHeaders
        )
      ).data.product;
      variant = product.variants[0];
    });

    it("returns the Company-specific price for the signed-in Team Member", async () => {
      await api.post(
        "/admin/price-lists",
        {
          title: "Alpha Custom Price List",
          description: "Alpha negotiated price",
          status: "active",
          type: "override",
          rules: { "customer.groups.id": [groupA.id] },
          prices: [{ variant_id: variant.id, currency_code: "usd", amount: 80 }],
        },
        adminHeaders
      );

      const alpha = await api.get(`/store/dashboard/variants/${variant.id}/price`, headersOf(ada));
      const bravo = await api.get(`/store/dashboard/variants/${variant.id}/price`, headersOf(bo));

      expect(alpha.data).toEqual(
        expect.objectContaining({ variant_id: variant.id, amount: 80, currency_code: "usd" })
      );
      expect(bravo.data).toEqual(
        expect.objectContaining({ variant_id: variant.id, amount: 100, currency_code: "usd" })
      );
    });

    it("lets Cardinal attach one Custom Price List to a Company in Admin", async () => {
      const priceList = (
        await api.post(
          "/admin/price-lists",
          {
            title: "Alpha negotiated prices",
            description: "Approved price list for Alpha Cooling",
            status: "active",
            type: "override",
            prices: [{ variant_id: variant.id, currency_code: "usd", amount: 75 }],
          },
          adminHeaders
        )
      ).data.price_list;

      const attached = await api.post(
        `/admin/companies/${companyA.id}/price-list`,
        { price_list_id: priceList.id },
        adminHeaders
      );

      expect(attached.data.company).toEqual(
        expect.objectContaining({ id: companyA.id, price_list_id: priceList.id })
      );

      const alpha = await api.get(`/store/dashboard/variants/${variant.id}/price`, headersOf(ada));
      const bravo = await api.get(`/store/dashboard/variants/${variant.id}/price`, headersOf(bo));
      expect(alpha.data.amount).toBe(75);
      expect(bravo.data.amount).toBe(100);
    });
  },
});
