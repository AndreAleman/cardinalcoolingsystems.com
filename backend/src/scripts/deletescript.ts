import axios from "axios";

const MEDUSA_URL = process.env.MEDUSA_API_URL || "http://localhost:9000";
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;       // set in your .env or export before running
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD; // set in your .env or export before running

const PRODUCT_ID = "prod_01K2GCEK767B199V3H06CGGAEB";
const VARIANT_IDS = [
  "variant_01K2GCEKSYKPNZ759N015A02XQ",
  "variant_01K2GCEKSYRDR15MHT8VV6JVNH",
  "variant_01K2GCEKSYN98ZERF7MWDY9XDH",
  "variant_01K2GCEKSZSC9N8V9ZWTJ9DPTT",
  "variant_01K2GCEKSY1GFYM6VSXJTJPJR1",
  "variant_01K2GCEKSYF2X0EA110E5NBTHR"
];

async function main() {
  // Authenticate and get token
  const authRes = await axios.post(`${MEDUSA_URL}/admin/auth`, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  const token = authRes.data.access_token || authRes.data.token;

  for (const variantId of VARIANT_IDS) {
    try {
      const response = await axios.delete(
        `${MEDUSA_URL}/admin/products/${PRODUCT_ID}/variants/${variantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`✅ Deleted ${variantId}:`, response.status);
    } catch (err) {
      console.error(`❌ Failed to delete ${variantId}:`, err.response?.data || err.message);
    }
  }
}

main();
