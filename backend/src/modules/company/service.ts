import { MedusaService } from "@medusajs/framework/utils";
import { Company, CompanyInvite, Employee } from "./models";

class CompanyModuleService extends MedusaService({
  Company,
  Employee,
  CompanyInvite,
}) {}

export default CompanyModuleService;
