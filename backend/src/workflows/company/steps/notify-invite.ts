import { INotificationModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { STOREFRONT_URL } from "../../../lib/constants";
import { EmailTemplates } from "../../../modules/email-notifications/templates";

type Input = {
  email: string;
  token: string;
  company_name: string;
  inviter_name: string;
  expires_at: string;
};

/* Best-effort: the invite email. A mail outage never fails the invite. */
export const notifyInviteStep = createStep(
  "notify-invite",
  async (input: Input, { container }) => {
    const logger = container.resolve("logger");
    let notification: INotificationModuleService;
    try {
      notification = container.resolve<INotificationModuleService>(Modules.NOTIFICATION);
    } catch {
      logger.info("Notification module not configured; skipping invite email");
      return new StepResponse(null);
    }
    try {
      await notification.createNotifications({
        to: input.email,
        channel: "email",
        template: EmailTemplates.COMPANY_INVITE,
        data: {
          company_name: input.company_name,
          inviter_name: input.inviter_name,
          accept_url: `${STOREFRONT_URL}/invite/${input.token}`,
          expires_at: input.expires_at,
        },
      });
    } catch (e: any) {
      logger.warn(`Invite email failed: ${e?.message ?? e}`);
    }
    return new StepResponse(null);
  }
);
