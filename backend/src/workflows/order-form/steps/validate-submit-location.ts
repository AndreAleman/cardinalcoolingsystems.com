import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../../modules/company";
import type CompanyModuleService from "../../../modules/company/service";

/*
  The Ship-to Location on a submission is picked by the buyer, but it
  must be one of THEIR Company's sites — a location_id from another
  Company (or a dead id) is rejected so nobody can tag orders into a
  foreign Company's visibility scope. No location_id is fine: the
  order simply goes untagged.
*/

type Input = {
  location_id?: string;
  company_id?: string;
};

export const validateSubmitLocationStep = createStep(
  "validate-submit-location",
  async ({ location_id, company_id }: Input, { container }) => {
    if (!location_id) {
      return new StepResponse({ location_id: null });
    }

    const companyService =
      container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const [location] = company_id
      ? await companyService.listLocations({ id: location_id, company_id })
      : [];

    if (!location) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The chosen Ship-to Location does not belong to your Company."
      );
    }

    return new StepResponse({ location_id });
  }
);
