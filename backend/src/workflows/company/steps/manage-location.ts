import { MedusaError } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

/*
  Location CRUD steps. Locations are Cardinal-managed (Medusa Admin
  only): a Company's destination sites for the Ship-to picker and the
  manager visibility scope.
*/

export type LocationFields = {
  name: string;
  address_1: string;
  address_2?: string | null;
  city: string;
  state: string;
  zip: string;
  phone?: string | null;
};

/* The Location must belong to the Company named in the URL. */
export async function requireLocationInCompany(
  container: MedusaContainer,
  companyId: string,
  locationId: string
) {
  const companyService =
    container.resolve<CompanyModuleService>(COMPANY_MODULE);
  const [location] = await companyService.listLocations({
    id: locationId,
    company_id: companyId,
  });
  if (!location) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Location not found in this Company"
    );
  }
  return location;
}

export const createLocationStep = createStep(
  "create-location",
  async (
    input: { company_id: string } & LocationFields,
    { container }
  ) => {
    const companyService =
      container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const [company] = await companyService.listCompanies({
      id: input.company_id,
    });
    if (!company) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found");
    }
    const location = await companyService.createLocations(input);
    return new StepResponse(location, location.id);
  },
  async (locationId, { container }) => {
    if (!locationId) return;
    const companyService =
      container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.deleteLocations(locationId);
  }
);

export const updateLocationStep = createStep(
  "update-location",
  async (
    input: {
      company_id: string;
      location_id: string;
    } & Partial<LocationFields>,
    { container }
  ) => {
    const { company_id, location_id, ...changes } = input;
    const companyService =
      container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const before = await requireLocationInCompany(
      container,
      company_id,
      location_id
    );
    const updated = await companyService.updateLocations({
      id: location_id,
      ...changes,
    });
    const location = Array.isArray(updated) ? updated[0] : updated;
    return new StepResponse(location, {
      id: before.id,
      name: before.name,
      address_1: before.address_1,
      address_2: before.address_2,
      city: before.city,
      state: before.state,
      zip: before.zip,
      phone: before.phone,
    });
  },
  async (prev, { container }) => {
    if (!prev) return;
    const companyService =
      container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.updateLocations(prev);
  }
);

export const deleteLocationStep = createStep(
  "delete-location",
  async (
    input: { company_id: string; location_id: string },
    { container }
  ) => {
    await requireLocationInCompany(
      container,
      input.company_id,
      input.location_id
    );
    const companyService =
      container.resolve<CompanyModuleService>(COMPANY_MODULE);
    // Unassign every Team Member first so nobody points at a dead site
    // (their visibility falls back to the role rule company-wide).
    const employees = await companyService.listEmployees({
      location_id: input.location_id,
    });
    if (employees.length) {
      await companyService.updateEmployees(
        employees.map((employee) => ({ id: employee.id, location_id: null }))
      );
    }
    await companyService.softDeleteLocations(input.location_id);
    return new StepResponse(true, {
      location_id: input.location_id,
      employee_ids: employees.map((employee) => employee.id),
    });
  },
  async (prev, { container }) => {
    if (!prev) return;
    const companyService =
      container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.restoreLocations(prev.location_id);
    if (prev.employee_ids.length) {
      await companyService.updateEmployees(
        prev.employee_ids.map((id) => ({ id, location_id: prev.location_id }))
      );
    }
  }
);
