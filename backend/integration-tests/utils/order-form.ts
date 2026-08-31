import { Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../src/modules/company";
import { generatePublishableKey, generateStoreHeaders } from "./store";
import { customerHeaders } from "./customer-auth";

/*
  Shared world for order-form / quote specs: store headers, region,
  sales channel (re-seeded — truncation removes the boot-seeded store
  between tests), one published product, and an approved Company whose
  first Team Member is `ada`.
*/
export async function seedOrderFormWorld({
  api,
  container,
  adminHeaders,
}: {
  api: any;
  container: any;
  adminHeaders: any;
}) {
  const storeHeaders = generateStoreHeaders({
    publishableKey: await generatePublishableKey(container),
  });
  const headersOf = (customer: { id: string }, extra = {}) =>
    customerHeaders(storeHeaders, customer.id, extra);

  const region = (
    await api.post(
      "/admin/regions",
      { name: "US", currency_code: "usd", countries: ["us"] },
      adminHeaders
    )
  ).data.region;

  const salesChannel = (
    await api.post("/admin/sales-channels", { name: "Web" }, adminHeaders)
  ).data.sales_channel;
  const storeModule = container.resolve(Modules.STORE);
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

  const customerService = container.resolve(Modules.CUSTOMER);
  const ada = await customerService.createCustomers({
    email: "ada@alpha.test",
    first_name: "Ada",
    last_name: "Alpha",
  });

  const company = (
    await api.post("/store/companies", { name: "Alpha Cooling", phone: "555-0101" }, headersOf(ada))
  ).data.company;
  const companyService = container.resolve(COMPANY_MODULE);
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
  const variant = product.variants[0];

  const makeCart = async (customer: { id: string }, quantity = 3) => {
    const cart = (
      await api.post(
        "/store/carts",
        { currency_code: "usd", region_id: region.id },
        headersOf(customer)
      )
    ).data.cart;
    await api.post(
      `/store/carts/${cart.id}/line-items`,
      { variant_id: variant.id, quantity },
      headersOf(customer)
    );
    return cart;
  };

  const submitQuoteRequest = async (
    customer: { id: string },
    body: Record<string, unknown> = {}
  ) => {
    const cart = await makeCart(customer);
    const response = await api.post(
      "/store/order-form/request-quote",
      { cart_id: cart.id, ...body },
      headersOf(customer)
    );
    return { cart, ...response.data };
  };

  const addTeamMember = async (email: string, name: string) => {
    const customer = await customerService.createCustomers({
      email,
      first_name: name,
      last_name: "Test",
    });
    const other = (
      await api.post(
        "/store/companies",
        { name: `${name} Co`, phone: "555-0103" },
        headersOf(customer)
      )
    ).data.company;
    await companyService.updateCompanies([
      { id: other.id, status: "approved" },
    ]);
    return { customer, company: other };
  };

  return {
    storeHeaders,
    headersOf,
    region,
    salesChannel,
    variant,
    ada,
    company,
    makeCart,
    submitQuoteRequest,
    addTeamMember,
  };
}
