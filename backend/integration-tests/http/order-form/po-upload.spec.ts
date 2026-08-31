import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import { TEST_JWT_SECRET } from "../../utils/customer-auth";
import { adminHeaders, createAdminUser } from "../../utils/admin";
import { seedOrderFormWorld } from "../../utils/order-form";

jest.setTimeout(180 * 1000);

/*
  PO Upload (spec slice 3): a Team Member drops their purchase-order
  PDF, the AI reads PO number + lines, and the route answers with a PO
  Read-Out — each line matched to a catalog part (with Cardinal's price
  and weight) or flagged unmatched, and a Price Alarm where the PO's
  price is lower than Cardinal's. The Claude call is stubbed here via
  PO_READER_STUB_JSON (the spec's testing decision).
*/
const STUB = {
  po_number: "PO0437232-2",
  lines: [
    {
      sku_or_description:
        "RDCR CONC 2.00X1.50 BW TUBE S&O'B CM-100 2.00 LG 304 SS .065 WALL",
      quantity: 4,
      unit_price: 10.28,
    },
    {
      sku_or_description: "MYSTERY BRACKET 9999-XYZ",
      quantity: 1,
      unit_price: 11.89,
    },
  ],
};

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    JWT_SECRET: TEST_JWT_SECRET,
    PO_READER_STUB_JSON: JSON.stringify(STUB),
  },
  testSuite: ({ api, getContainer }) => {
    let world: Awaited<ReturnType<typeof seedOrderFormWorld>>;

    beforeEach(async () => {
      const container = getContainer();
      await createAdminUser(adminHeaders, container);
      world = await seedOrderFormWorld({ api, container, adminHeaders });
    });

    const upload = (headers: any) =>
      api.post(
        "/store/order-form/po-upload",
        {
          filename: "po.pdf",
          mime_type: "application/pdf",
          file_base64: Buffer.from("%PDF-1.4 test").toString("base64"),
        },
        headers
      );

    it("answers with a PO Read-Out: matched line, price alarm, unmatched flag", async () => {
      const response = await upload(world.headersOf(world.ada));

      expect(response.status).toEqual(200);
      expect(response.data.po_number).toEqual("PO0437232-2");
      expect(response.data.lines).toHaveLength(2);

      const [matched, unmatched] = response.data.lines;
      expect(matched.quantity).toEqual(4);
      expect(matched.unit_price).toEqual(10.28);
      expect(matched.unmatched).toBe(false);
      expect(matched.variant).toEqual(
        expect.objectContaining({ sku: "CM-100", unit_price: 100 })
      );
      // PO price 10.28 < Cardinal's 100 -> alarm.
      expect(matched.price_alarm).toBe(true);

      expect(unmatched.unmatched).toBe(true);
      expect(unmatched.variant).toBeNull();
      expect(unmatched.quantity).toEqual(1);
    });

    it("rejects unsupported file types", async () => {
      const response = await api
        .post(
          "/store/order-form/po-upload",
          {
            filename: "po.exe",
            mime_type: "application/x-msdownload",
            file_base64: Buffer.from("nope").toString("base64"),
          },
          world.headersOf(world.ada)
        )
        .catch((err) => err.response);
      expect(response.status).toEqual(400);
    });

    it("rejects unauthenticated uploads", async () => {
      const response = await upload(world.storeHeaders).catch(
        (err) => err.response
      );
      expect(response.status).toEqual(401);
    });
  },
});
