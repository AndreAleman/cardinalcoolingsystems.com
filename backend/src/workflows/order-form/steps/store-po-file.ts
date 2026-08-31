import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

/*
  Keep the original PO document in the file provider so Cardinal can
  always check the read-out against the source (spec story 60).
  Best-effort: a storage failure must not lose the read-out.
*/

type Input = {
  filename: string;
  mime_type: string;
  file_base64: string;
};

type Output = {
  file_id: string | null;
  file_url: string | null;
};

export const storePoFileStep = createStep(
  "store-po-file",
  async ({ filename, mime_type, file_base64 }: Input, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    try {
      const fileModule = container.resolve(Modules.FILE);
      const file = await fileModule.createFiles({
        filename: `po-uploads/${Date.now()}-${filename}`,
        mimeType: mime_type,
        content: Buffer.from(file_base64, "base64").toString("binary"),
      });
      return new StepResponse<Output>({ file_id: file.id, file_url: file.url });
    } catch (err: any) {
      logger.warn(
        `[order-form] store-po-file: could not store ${filename}: ${err?.message ?? err}`
      );
      return new StepResponse<Output>({ file_id: null, file_url: null });
    }
  }
);
