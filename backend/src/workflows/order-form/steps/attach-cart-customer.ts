import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

/*
  Attach a customer + email to a guest cart so the quote's draft order
  carries a recipient. Compensation restores the previous values.
*/

type Input = {
  cart_id: string;
  customer_id: string;
  email: string;
};

type CompensationData = {
  cart_id: string;
  previous: { customer_id: string | null; email: string | null };
};

export const attachCartCustomerStep = createStep(
  "attach-cart-customer",
  async ({ cart_id, customer_id, email }: Input, { container }) => {
    const cartModule = container.resolve(Modules.CART);
    const [existing] = await cartModule.listCarts({ id: cart_id });

    await cartModule.updateCarts(cart_id, { customer_id, email });

    return new StepResponse<{ cart_id: string }, CompensationData>(
      { cart_id },
      {
        cart_id,
        previous: {
          customer_id: existing?.customer_id ?? null,
          email: existing?.email ?? null,
        },
      }
    );
  },
  async (compensationData, { container }) => {
    if (!compensationData) return;
    const cartModule = container.resolve(Modules.CART);
    await cartModule.updateCarts(compensationData.cart_id, {
      customer_id: compensationData.previous.customer_id,
      email: compensationData.previous.email,
    });
  }
);
