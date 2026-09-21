import { INotificationModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { EmailTemplates } from "../../../modules/email-notifications/templates";

type Input = {
  company_name: string;
  recipients: { email: string; first_name: string }[];
  welcome_code: string;
  ends_at: string;
};

/* Best-effort: the Welcome Code email for a Company approved by hand. */
export const notifyWelcomeCodeStep = createStep(
  "notify-welcome-code",
  async (input: Input, { container }) => {
    const logger = container.resolve("logger");
    let notification: INotificationModuleService;
    try {
      notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION);
    } catch {
      logger.info("Notification module not configured; skipping welcome email");
      return new StepResponse(null);
    }
    const results = await Promise.allSettled(
      input.recipients.map((r) =>
        notification.createNotifications({
          to: r.email,
          channel: "email",
          template: EmailTemplates.COMPANY_WELCOME,
          data: {
            first_name: r.first_name,
            company_name: input.company_name,
            welcome_code: input.welcome_code,
            ends_at: input.ends_at,
          },
        })
      )
    );
    for (const r of results) {
      if (r.status === "rejected") {
        logger.warn(`Welcome email failed: ${r.reason?.message ?? r.reason}`);
      }
    }
    return new StepResponse(null);
  }
);
