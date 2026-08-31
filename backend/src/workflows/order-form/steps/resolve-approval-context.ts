import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { TeamMemberRole } from "../../../modules/company/types/role";

/*
  Decide whether this submission is held for admin approval. Two gates,
  both must be true (CONTEXT.md "Approval"):
    1. Team Member's Role === "member" (managers + admins are trusted)
    2. the Company's Approval Setting requires_admin_approval === true

  Two queries on purpose: the customer→employee→company→approval_settings
  chain silently drops the settings relation in the remote-query layer.
  No settings row = approval off (Companies opt IN).
*/

type Input = {
  customer_id: string;
};

type Output = {
  requires_approval: boolean;
  role: TeamMemberRole | null;
  company_id: string | null;
};

export const resolveApprovalContextStep = createStep(
  "resolve-approval-context",
  async ({ customer_id }: Input, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "employee.role", "employee.company.id"],
      filters: { id: customer_id },
    });

    const employee = (customers?.[0] as any)?.employee;
    const role = (employee?.role ?? null) as Output["role"];
    const company_id = (employee?.company?.id ?? null) as string | null;

    let requires_admin_approval = false;
    if (company_id) {
      const { data: settings } = await query.graph({
        entity: "approval_settings",
        fields: ["id", "requires_admin_approval"],
        filters: { company_id } as any,
      });
      requires_admin_approval = Boolean(
        (settings?.[0] as any)?.requires_admin_approval
      );
    }

    const requires_approval =
      role === "member" && requires_admin_approval === true;

    return new StepResponse<Output>({
      requires_approval,
      role,
      company_id,
    });
  }
);
