import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import Anthropic from "@anthropic-ai/sdk";

/*
  Read a purchase-order document with Claude. The PO's part numbers are
  usually buried inside description text (e.g. "S&O'B 31W-2X15-7-304"),
  so the extraction keeps whole description lines; matching to the
  catalog happens in the next step, in our code.

  Structured output (output_config.format) guarantees the JSON shape.
  Tests stub the whole call via PO_READER_STUB_JSON (spec testing
  decision: "Claude call stubbed").
*/

export type ExtractedPoLine = {
  sku_or_description: string;
  quantity: number;
  unit_price: number | null;
};

export type ExtractedPo = {
  po_number: string | null;
  lines: ExtractedPoLine[];
};

type Input = {
  file_base64: string;
  mime_type: string;
};

const PO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["po_number", "lines"],
  properties: {
    po_number: {
      type: ["string", "null"],
      description: "The buyer's purchase order number, exactly as printed",
    },
    lines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sku_or_description", "quantity", "unit_price"],
        properties: {
          sku_or_description: {
            type: "string",
            description:
              "The line's FULL description text, verbatim and in the document's original language, including every part number in it. When the document has separate SIZE / MATERIAL / MODEL columns, append them to the description text (e.g. '… — 3\", 304').",
          },
          quantity: { type: "number" },
          unit_price: {
            type: ["number", "null"],
            description: "The line's unit price in dollars, null if absent",
          },
        },
      },
    },
  },
} as const;

export const extractPoDocumentStep = createStep(
  "extract-po-document",
  async ({ file_base64, mime_type }: Input, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

    if (process.env.PO_READER_STUB_JSON) {
      return new StepResponse(
        JSON.parse(process.env.PO_READER_STUB_JSON) as ExtractedPo
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "PO reading is not configured (ANTHROPIC_API_KEY is unset)."
      );
    }

    const client = new Anthropic();

    const documentBlock =
      mime_type === "application/pdf"
        ? {
            type: "document" as const,
            source: {
              type: "base64" as const,
              media_type: "application/pdf" as const,
              data: file_base64,
            },
          }
        : {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: mime_type as "image/png" | "image/jpeg" | "image/webp",
              data: file_base64,
            },
          };

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 16000,
      output_config: {
        format: {
          type: "json_schema",
          schema: PO_SCHEMA,
        },
      },
      messages: [
        {
          role: "user",
          content: [
            documentBlock,
            {
              type: "text",
              text: [
                "Read this purchasing document. It may be a formal purchase order, a quote request, or a spec/accessories table, in ANY language (keep descriptions in the original language — do not translate).",
                "Return the PO number (null if the document has none) and every line item.",
                "Keep each line's description VERBATIM and complete — part numbers often hide inside the description text and must not be dropped or normalized.",
                "When the table has separate SIZE, MATERIAL, or MODEL columns, append those values to that line's description text so nothing is lost (e.g. 'Ferrule-14AMP L=28.6MM — 3\", 304').",
                "Quantities come from the QTY/quantity column; unit_price is null when the document shows no prices.",
              ].join(" "),
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The document could not be read. Please try a clearer copy."
      );
    }

    const textBlock = response.content.find(
      (block) => block.type === "text"
    );
    if (!textBlock || textBlock.type !== "text") {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "PO reader returned no content."
      );
    }

    const extracted = JSON.parse(textBlock.text) as ExtractedPo;
    logger.info(
      `[order-form] extract-po-document: read PO ${extracted.po_number ?? "(none)"} with ${extracted.lines.length} lines.`
    );
    return new StepResponse(extracted);
  }
);
