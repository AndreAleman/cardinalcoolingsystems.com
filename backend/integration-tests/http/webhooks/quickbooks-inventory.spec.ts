import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { createStockLocationsWorkflow } from "@medusajs/medusa/core-flows";
import { adminHeaders, createAdminUser } from "../../utils/admin";

jest.setTimeout(120 * 1000);

/*
  QuickBooks sends one absolute count per SaniTube warehouse. Cardinal keeps
  both levels so its dashboard can show their combined availability later.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { QB_INVENTORY_SYNC_TOKEN: "test-qb-token" },
  testSuite: ({ api, getContainer }) => {
    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      await createStockLocationsWorkflow(container).run({
        input: {
          locations: [
            {
              name: "Kansas City",
              address: { address_1: "", city: "Kansas City", country_code: "us" },
            },
            {
              name: "Paramount",
              address: { address_1: "", city: "Paramount", country_code: "us" },
            },
          ],
        },
      });
      await api.post(
        "/admin/products",
        {
          title: "SaniTube test part",
          handle: "sanitube-test-part",
          status: "published",
          options: [{ title: "Size", values: ["One"] }],
          variants: [
            {
              title: "One",
              sku: "SANITUBE-TEST-1",
              manage_inventory: false,
              prices: [{ currency_code: "usd", amount: 100 }],
              options: { Size: "One" },
            },
          ],
        },
        adminHeaders
      );
    });

    it("retains both SaniTube warehouse levels from a QuickBooks sync", async () => {
      const synced = await api.post(
        "/webhooks/quickbooks-inventory",
        { updates: [{ sku: "SANITUBE-TEST-1", kc: 7, la: 11 }] },
        { headers: { authorization: "Bearer test-qb-token" } }
      );
      expect(synced.data).toEqual({ updated: 1, unknown_skus: [], errors: [] });

      const items = await api.get(
        "/admin/inventory-items",
        { ...adminHeaders, params: { sku: "SANITUBE-TEST-1", fields: "id,*location_levels" } }
      );
      const levels = items.data.inventory_items[0].location_levels as Array<{
        stocked_quantity: number;
        location_id: string;
      }>;
      expect(levels.map((level) => level.stocked_quantity).sort((a, b) => a - b)).toEqual([7, 11]);
      expect(levels.reduce((total, level) => total + level.stocked_quantity, 0)).toBe(18);
    });
  },
});
