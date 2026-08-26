import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { resolveCompanyContext } from "../../../utils/company-context";

export const validateNotTeamMemberStep = createStep(
  "validate-not-team-member",
  async (input: { customer_id: string }, { container }) => {
    const existing = await resolveCompanyContext(container, input.customer_id);
    if (existing) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "You are already a Team Member of a Company"
      );
    }
    return new StepResponse(true);
  }
);
