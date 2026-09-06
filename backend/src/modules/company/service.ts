import { MedusaService } from "@medusajs/framework/utils";
import { Company, CompanyInvite, Employee, Location } from "./models";

class CompanyModuleService extends MedusaService({
  Company,
  Employee,
  CompanyInvite,
  Location,
}) {}

export default CompanyModuleService;
