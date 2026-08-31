import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { ICustomerModuleService } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../../src/modules/company";
import { QUOTE_MODULE } from "../../../src/modules/quote";
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../utils/store";
import { customerHeaders, TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";

jest.setTimeout(120 * 1000);

/*
  Quote Request submission (CONTEXT.md: "Quote Request").

  A Team Member of an approved Company submits their cart as a Quote
  Request: POST /store/order-form/request-quote creates a Quote in
  pending_merchant status wrapping a draft Order, stamps the cart with
  request_type/po_number, and links the draft order to the Company.
  Pending Companies are locked out; strangers get 401.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let storeHeaders;
    let ada;
    let company;
    let region;
    let variant;
    let salesChannel;

    const headersOf = (customer: { id: string }) =>
      customerHeaders(storeHeaders, customer.id);

    const makeCart = async (customer: { id: string; email?: string }) => {
      const cart = (
        await api
          .post(
            "/store/carts",
            { currency_code: "usd", region_id: region.id },
            headersOf(customer)
          )
          .catch((err) => {
            console.error("cart create failed:", JSON.stringify(err.response?.data));
            throw err;
          })
      ).data.cart;
      await api
        .post(
          `/store/carts/${cart.id}/line-items`,
          { variant_id: variant.id, quantity: 3 },
          headersOf(customer)
        )
        .catch((err) => {
          console.error("add line-item failed:", JSON.stringify(err.response?.data));
          throw err;
        });
      return cart;
    };

    beforeEach(async () => {
      const container = getContainer();
      storeHeaders = generateStoreHeaders({
        publishableKey: await generatePublishableKey(container),
      });
      await createAdminUser(adminHeaders, container);

      region = (
        await api.post(
          "/admin/regions",
          { name: "US", currency_code: "usd", countries: ["us"] },
          adminHeaders
        )
      ).data.region;

      // The boot-seeded store and default sales channel are truncated
      // between tests; carts need both, so re-seed them each time.
      salesChannel = (
        await api.post("/admin/sales-channels", { name: "Web" }, adminHeaders)
      ).data.sales_channel;
      const storeModule = container.resolve(Modules.STORE) as any;
      const [existingStore] = await storeModule.listStores();
      if (existingStore) {
        await storeModule.updateStores(existingStore.id, {
          default_sales_channel_id: salesChannel.id,
        });
      } else {
        await storeModule.createStores({
          name: "Cardinal Test Store",
          supported_currencies: [{ currency_code: "usd", is_default: true }],
          default_sales_channel_id: salesChannel.id,
        });
      }

      const customerService: ICustomerModuleService = container.resolve(
        Modules.CUSTOMER
      );
      ada = await customerService.createCustomers({
        email: "ada@alpha.test",
        first_name: "Ada",
        last_name: "Alpha",
      });

      company = (
        await api.post("/store/companies", { name: "Alpha Cooling", phone: "555-0101" }, headersOf(ada))
      ).data.company;
      const companyService = container.resolve(COMPANY_MODULE) as any;
      await companyService.updateCompanies([
        { id: company.id, status: "approved" },
      ]);

      const product = (
        await api.post(
          "/admin/products",
          {
            title: "Cooling Manifold",
            handle: "cooling-manifold",
            status: "published",
            options: [{ title: "Size", values: ["One"] }],
            variants: [
              {
                title: "One",
                sku: "CM-100",
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

    it("creates a pending_merchant Quote from the Team Member's cart", async () => {
      const cart = await makeCart(ada);

      const response = await api.post(
        "/store/order-form/request-quote",
        { cart_id: cart.id, po_number: "PO-777", notes: "Need by Friday" },
        headersOf(ada)
      );

      expect(response.status).toEqual(200);
      expect(response.data.pending_approval).toBe(false);
      expect(response.data.approval_id).toBeNull();
      const quoteId = response.data.quote_id;
      expect(quoteId).toEqual(expect.stringContaining("quo_"));

      const container = getContainer();
      const quoteService = container.resolve(QUOTE_MODULE) as any;
      const quote = await quoteService.retrieveQuote(quoteId);
      expect(quote.status).toEqual("pending_merchant");
      expect(quote.cart_id).toEqual(cart.id);
      expect(quote.customer_id).toEqual(ada.id);

      const query = container.resolve(ContainerRegistrationKeys.QUERY);

      // The draft Order carries the Company link and the cart's lines.
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "is_draft_order", "items.*", "company.id"],
        filters: { id: quote.draft_order_id },
      });
      expect(orders[0].is_draft_order).toBe(true);
      expect(orders[0].items).toHaveLength(1);
      expect(orders[0].items[0].quantity).toEqual(3);
      expect((orders[0] as any).company?.id).toEqual(company.id);

      // Submit-time metadata is stamped on the cart.
      const { data: carts } = await query.graph({
        entity: "cart",
        fields: ["id", "metadata"],
        filters: { id: cart.id },
      });
      expect(carts[0].metadata).toEqual(
        expect.objectContaining({
          request_type: "quote",
          po_number: "PO-777",
          notes: "Need by Friday",
          company_id: company.id,
        })
      );
    });

    it("locks out a Team Member of a Pending Company", async () => {
      const container = getContainer();
      const companyService = container.resolve(COMPANY_MODULE) as any;
      await companyService.updateCompanies([
        { id: company.id, status: "pending" },
      ]);

      const cart = await makeCart(ada);
      const response = await api
        .post(
          "/store/order-form/request-quote",
          { cart_id: cart.id },
          headersOf(ada)
        )
        .catch((err) => err.response);

      expect(response.status).toEqual(403);
      expect(response.data.code).toEqual("company_pending");
    });

    it("rejects unauthenticated submissions", async () => {
      const response = await api
        .post(
          "/store/order-form/request-quote",
          { cart_id: "cart_nope" },
          storeHeaders
        )
        .catch((err) => err.response);

      expect(response.status).toEqual(401);
    });
  },
});
