import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/*
  Resolve what the resume workflow needs from a held cart:
  - request_type ("quote" vs "order") and po_number, stamped on
    cart.metadata by the order-form submit
  - already_resumed: a Quote already exists for this cart. Guards
    against double-resume if an approve fires twice (idempotency).
*/

type Input = {
  cart_id: string;
};

type Output = {
  request_type: "quote" | "order" | null;
  po_number: string | null;
  already_resumed: boolean;
};

export const lookupCartForResumeStep = createStep(
  "lookup-cart-for-resume",
  async ({ cart_id }: Input, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "metadata"],
      filters: { id: cart_id },
    });
    const metadata = ((carts?.[0] as any)?.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const request_type =
      (metadata.request_type as "quote" | "order" | undefined) ?? null;
    const po_number = (metadata.po_number as string | undefined) ?? null;

    const { data: existingQuotes } = await query.graph({
      entity: "quote",
      fields: ["id"],
      filters: { cart_id },
    });
    const already_resumed = (existingQuotes?.length ?? 0) > 0;

    return new StepResponse<Output>({
      request_type,
      po_number,
      already_resumed,
    });
  }
);
