import { MedusaService } from "@medusajs/framework/utils";
import { LinePricing, Message, Quote } from "./models";

class QuoteModuleService extends MedusaService({ Quote, Message, LinePricing }) {}

export default QuoteModuleService;
