import { INotificationModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { EmailTemplates } from "../../../modules/email-notifications/templates";
import type { DecideCompanyInput } from "../decide-company";

/*
  Best-effort: tell every Team Member the decision. A mail outage must
  never roll back an approval.
*/
export const notifyCompanyDecidedStep = createStep(
  "notify-company-decided",
  async (input: DecideCompanyInput, { container }) => {
    const logger = container.resolve("logger");
    let notification: INotificationModuleService;
    try {
      notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION);
    } catch {
      logger.info("Notification module not configured; skipping decision emails");
      return new StepResponse(null);
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const {
      data: [company],
    } = await query.graph({
      entity: "company",
      fields: ["id", "name", "employees.customer.email", "employees.customer.first_name"],
      filters: { id: input.company_id },
    });

    const recipients = ((company?.employees ?? []) as any[])
      .map((e) => e?.customer)
      .filter((c) => c?.email);

    const results = await Promise.allSettled(
      recipients.map((c) =>
        notification.createNotifications({
          to: c.email,
          channel: "email",
          template: EmailTemplates.COMPANY_DECIDED,
          data: {
            first_name: c.first_name ?? "",
            company_name: company.name,
            status: input.status,
          },
        })
      )
    );
    for (const r of results) {
      if (r.status === "rejected") {
        logger.warn(`Company decision email failed: ${r.reason?.message ?? r.reason}`);
      }
    }
    return new StepResponse(null);
  }
);
