import jwt from "jsonwebtoken";

export const TEST_JWT_SECRET = "supersecret";

/* Mint a customer bearer token the way Medusa's auth module would. */
export const customerToken = (customerId: string) =>
  jwt.sign(
    {
      actor_id: customerId,
      actor_type: "customer",
      auth_identity_id: `authid_${customerId}`,
    },
    TEST_JWT_SECRET,
    { expiresIn: "1d" }
  );

export const customerHeaders = (
  baseHeaders: { headers: Record<string, string> },
  customerId: string,
  extra: Record<string, string> = {}
) => ({
  headers: {
    ...baseHeaders.headers,
    authorization: `Bearer ${customerToken(customerId)}`,
    ...extra,
  },
});
