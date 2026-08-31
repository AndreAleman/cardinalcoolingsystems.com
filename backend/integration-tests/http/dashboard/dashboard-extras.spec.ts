import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";
import { COMPANY_MODULE } from "../../../src/modules/company";

jest.setTimeout(180 * 1000);

/*
  Dashboard extras: Favorites (a part a Team Member has starred —
  belongs to the person, CONTEXT.md) and the Company's recent Orders
  (feeds the Orders section and Order Again). Cross-Company isolation
  throughout.
*/
medusaIntegrationTestRunner({
  inApp: true,
  env: { JWT_SECRET: TEST_JWT_SECRET },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });
    });

    it("stars, lists, and unstars a Favorite for the signed-in person", async () => {
      const created = await api.post(
        "/store/dashboard/favorites",
        { variant_id: world.variant.id },
        world.headersOf(world.ada)
      );
      expect(created.status).toEqual(200);

      const listed = await api.get(
        "/store/dashboard/favorites",
        world.headersOf(world.ada)
      );
      expect(
        listed.data.favorites.map((favorite) => favorite.variant_id)
      ).toContain(world.variant.id);

      // Starring twice stays one row.
      await api.post(
        "/store/dashboard/favorites",
        { variant_id: world.variant.id },
        world.headersOf(world.ada)
      );
      const relisted = await api.get(
        "/store/dashboard/favorites",
        world.headersOf(world.ada)
      );
      expect(relisted.data.favorites).toHaveLength(1);

      const removed = await api.delete(
        `/store/dashboard/favorites/${world.variant.id}`,
        world.headersOf(world.ada)
      );
      expect(removed.status).toEqual(200);

      const empty = await api.get(
        "/store/dashboard/favorites",
        world.headersOf(world.ada)
      );
      expect(empty.data.favorites).toHaveLength(0);
    });

    it("keeps Favorites per person", async () => {
      await api.post(
        "/store/dashboard/favorites",
        { variant_id: world.variant.id },
        world.headersOf(world.ada)
      );

      const { customer: outsider } = await world.addTeamMember(
        "bo@bravo.test",
        "Bo"
      );
      const theirs = await api.get(
        "/store/dashboard/favorites",
        world.headersOf(outsider)
      );
      expect(theirs.data.favorites).toHaveLength(0);
    });

    it("lists the Company's Orders on the dashboard, isolated per Company", async () => {
      const companyService = getContainer().resolve(COMPANY_MODULE) as any;
      await companyService.updateCompanies([
        { id: world.company.id, invoice_payment_enabled: true },
      ]);
      const cart = await world.makeCart(world.ada);
      const placed = await api.post(
        "/store/order-form/place-invoice-order",
        { cart_id: cart.id, po_number: "PO-DASH-1" },
        world.headersOf(world.ada)
      );

      const mine = await api.get(
        "/store/dashboard/orders",
        world.headersOf(world.ada)
      );
      expect(mine.status).toEqual(200);
      expect(mine.data.orders.map((order) => order.id)).toContain(
        placed.data.order_id
      );

      const { customer: outsider } = await world.addTeamMember(
        "bo@bravo.test",
        "Bo"
      );
      const theirs = await api.get(
        "/store/dashboard/orders",
        world.headersOf(outsider)
      );
      expect(theirs.data.orders).toHaveLength(0);
    });
  },
});
