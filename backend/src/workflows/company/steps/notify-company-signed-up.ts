import { INotificationModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CARDINAL_NOTIFY_EMAIL } from "../../../lib/constants";
import { EmailTemplates } from "../../../modules/email-notifications/templates";
import { hit } from "../../../lib/rate-limit";
import { CARDINAL_SIGNUP_MAIL_CAP, mailCapVerdict } from "../../../utils/abuse-policy";

type Input = {
  company: { id: string; name: string };
  customer: { email: string; first_name?: string | null };
  status: "approved" | "pending";
  welcome_code: string | null;
  ends_at: string | null;
};

/*
  Best-effort: a mail outage must never fail a signup. Cardinal is
  always told. The buyer is only emailed when the signup was instantly
  approved — a Pending signup's address is unvetted, and mailing a
  discount code to whatever address a bot typed would burn the sending
  reputation our outreach depends on (ADR-0007).
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
    const sends: Promise<unknown>[] = [];
    if (input.status === "approved" && input.welcome_code && input.ends_at) {
      sends.push(
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
      })
      );
    }
    // A flood must cost Cardinal one notice, not hundreds of emails.
    // Every Company is still listed in Medusa Admin. Limiter down → send.
    const count = await hit("mail:cardinal-signup", CARDINAL_SIGNUP_MAIL_CAP, logger);
    const verdict = count === null ? "send" : mailCapVerdict(count);
    if (verdict === "drop") {
      logger.warn(`Signup email cap reached; Cardinal not emailed about ${input.company.id}`);
    }
    if (verdict !== "drop") sends.push(
      notification.createNotifications({
        to: CARDINAL_NOTIFY_EMAIL,
        channel: "email",
        template: EmailTemplates.COMPANY_SIGNUP_ADMIN,
        data: {
          company_id: input.company.id,
          company_name: input.company.name,
          email: input.customer.email,
          first_name: input.customer.first_name ?? "",
          status: input.status,
          flood: verdict === "send_flood_notice",
        },
      })
    );
    const results = await Promise.allSettled(sends);
    for (const r of results) {
      if (r.status === "rejected") {
        logger.warn(`Signup email failed: ${r.reason?.message ?? r.reason}`);
      }
    }
    return new StepResponse(null);
  }
);
