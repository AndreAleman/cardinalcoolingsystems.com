import { MedusaService } from "@medusajs/framework/utils";
import { ApprovedDomain, Company, CompanyInvite, Employee, Location } from "./models";

class CompanyModuleService extends MedusaService({
  Company,
  Employee,
  CompanyInvite,
  Location,
  ApprovedDomain,
}) {}

export default CompanyModuleService;
