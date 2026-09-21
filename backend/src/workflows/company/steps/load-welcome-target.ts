import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/*
  What issuing a Welcome Code at approval time needs. A Company that
  signed up Pending has no code yet (ADR-0007: nothing is sent to an
  unvetted address) — `needs_welcome` says so.
*/
export const loadWelcomeTargetStep = createStep(
  "load-welcome-target",
  async (input: { company_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: [
        "id",
        "name",
        "welcome_code",
        "customer_group.id",
        "employees.customer.email",
        "employees.customer.first_name",
      ],
      filters: { id: input.company_id },
    });
    const c = company as any;
    const recipients = ((c?.employees ?? []) as any[])
      .map((e) => e?.customer)
      .filter((cu) => cu?.email)
      .map((cu) => ({ email: cu.email as string, first_name: (cu.first_name ?? "") as string }));
    const customer_group_id: string | null = c?.customer_group?.id ?? null;
    return new StepResponse({
      company_id: input.company_id,
      company_name: (c?.name ?? "") as string,
      customer_group_id,
      recipients,
      needs_welcome: !c?.welcome_code && !!customer_group_id,
    });
  }
);
