import { INotificationModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CARDINAL_NOTIFY_EMAIL } from "../../../lib/constants";
import { EmailTemplates } from "../../../modules/email-notifications/templates";

type Input = {
  company: { id: string; name: string };
  customer: { email: string; first_name?: string | null };
  welcome_code: string;
  ends_at: string;
};

/*
  Best-effort: a mail outage must never fail a signup. Two emails —
  the Welcome Code to the buyer, "new Company, go approve it" to Cardinal.
*/
export const notifyCompanySignedUpStep = createStep(
  "notify-company-signed-up",
  async (input: Input, { container }) => {
    const logger = container.resolve("logger");
    let notification: INotificationModuleService;
    try {
      notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION);
    } catch {
      logger.info("Notification module not configured; skipping signup emails");
      return new StepResponse(null);
    }
    const sends = [
      notification.createNotifications({
        to: input.customer.email,
        channel: "email",
        template: EmailTemplates.COMPANY_WELCOME,
        data: {
          first_name: input.customer.first_name ?? "",
          company_name: input.company.name,
          welcome_code: input.welcome_code,
          ends_at: input.ends_at,
        },
      }),
      notification.createNotifications({
        to: CARDINAL_NOTIFY_EMAIL,
        channel: "email",
        template: EmailTemplates.COMPANY_SIGNUP_ADMIN,
        data: {
          company_id: input.company.id,
          company_name: input.company.name,
          email: input.customer.email,
          first_name: input.customer.first_name ?? "",
        },
      }),
    ];
    const results = await Promise.allSettled(sends);
    for (const r of results) {
      if (r.status === "rejected") {
        logger.warn(`Signup email failed: ${r.reason?.message ?? r.reason}`);
      }
    }
    return new StepResponse(null);
  }
);
