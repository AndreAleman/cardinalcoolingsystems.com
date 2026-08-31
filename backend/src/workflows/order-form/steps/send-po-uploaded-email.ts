import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import type { PoReadOutLine } from "./match-po-lines";

/*
  Tell Cardinal a PO landed, with the read-out and a link to the
  original (spec story 60). Best-effort like every email step.
*/

type Input = {
  customer_id: string;
  company_id: string;
  po_number: string | null;
  file_url: string | null;
  lines: PoReadOutLine[];
};

type Output = {
  sent: boolean;
};

export const sendPoUploadedEmailStep = createStep(
  "send-po-uploaded-email",
  async (
    { customer_id, company_id, po_number, file_url, lines }: Input,
    { container }
  ) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

    const operatorEmail =
      process.env.OPERATOR_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL;
    if (!operatorEmail) {
      logger.info(
        "[order-form] send-po-uploaded-email: no operator email configured; skipping."
      );
      return new StepResponse<Output>({ sent: false });
    }

    let notificationModule: any;
    try {
      notificationModule = container.resolve(Modules.NOTIFICATION);
    } catch {
      logger.warn(
        "[order-form] send-po-uploaded-email: Modules.NOTIFICATION not registered; skipping."
      );
      return new StepResponse<Output>({ sent: false });
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const [{ data: customers }, { data: companies }] = await Promise.all([
      query.graph({
        entity: "customer",
        fields: ["id", "email", "first_name", "last_name"],
        filters: { id: customer_id },
      }),
      query.graph({
        entity: "company",
        fields: ["id", "name"],
        filters: { id: company_id },
      }),
    ]);
    const customer = customers?.[0] as any;
    const submitterName =
      [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
      customer?.email ||
      "A team member";
    const companyName = (companies?.[0] as any)?.name ?? "their company";

    try {
      await notificationModule.createNotifications({
        to: operatorEmail,
        channel: "email",
        template: "po-uploaded",
        data: {
          submitterName,
          companyName,
          poNumber: po_number,
          fileUrl: file_url,
          lines: lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            matched_sku: line.variant?.sku ?? null,
            price_alarm: line.price_alarm,
          })),
        },
      });
      return new StepResponse<Output>({ sent: true });
    } catch (err: any) {
      logger.error(
        `[order-form] send-po-uploaded-email: send failed: ${err?.message ?? err}`
      );
      return new StepResponse<Output>({ sent: false });
    }
  }
);
