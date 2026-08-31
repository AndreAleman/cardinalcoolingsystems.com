import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  extractPoDocumentStep,
  ExtractedPo,
} from "../steps/extract-po-document";
import { matchPoLinesStep, PoReadOutLine } from "../steps/match-po-lines";
import { storePoFileStep } from "../steps/store-po-file";
import { sendPoUploadedEmailStep } from "../steps/send-po-uploaded-email";

/*
  PO Upload -> PO Read-Out: store the original document, read it with
  Claude, match every line to the catalog, and email Cardinal the
  read-out with the original attached-by-link (a bad read must never
  slip past quietly — spec story 60). Nothing is ordered or quoted
  here: the buyer checks the read-out on the Dashboard first.
*/

export type ReadPoUploadWorkflowInput = {
  filename: string;
  mime_type: string;
  file_base64: string;
  customer_id: string;
  company_id: string;
};

export type ReadPoUploadWorkflowOutput = {
  po_number: string | null;
  file_url: string | null;
  lines: PoReadOutLine[];
};

export const readPoUploadWorkflow = createWorkflow<
  ReadPoUploadWorkflowInput,
  ReadPoUploadWorkflowOutput,
  []
>("read-po-upload", function (input: ReadPoUploadWorkflowInput) {
  const stored = storePoFileStep({
    filename: input.filename,
    mime_type: input.mime_type,
    file_base64: input.file_base64,
  });

  const extracted = extractPoDocumentStep({
    file_base64: input.file_base64,
    mime_type: input.mime_type,
  });

  const readOut = matchPoLinesStep({
    extracted: extracted as unknown as ExtractedPo,
  });

  sendPoUploadedEmailStep({
    customer_id: input.customer_id,
    company_id: input.company_id,
    po_number: transform(
      { extracted },
      ({ extracted }) => (extracted as ExtractedPo).po_number
    ),
    file_url: stored.file_url,
    lines: readOut.lines,
  });

  return new WorkflowResponse(
    transform({ extracted, stored, readOut }, ({ extracted, stored, readOut }) => ({
      po_number: (extracted as ExtractedPo).po_number,
      file_url: stored.file_url,
      lines: readOut.lines,
    }))
  );
});
