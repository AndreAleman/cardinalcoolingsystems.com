import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createLocationStep,
  deleteLocationStep,
  updateLocationStep,
  type LocationFields,
} from "./steps/manage-location";

/* Cardinal manages a Company's Locations in Medusa Admin only. */

export type CreateLocationInput = { company_id: string } & LocationFields;
export type UpdateLocationInput = {
  company_id: string;
  location_id: string;
} & Partial<LocationFields>;

export const createLocationWorkflow = createWorkflow<
  CreateLocationInput,
  { id: string },
  []
>("create-location", function (input) {
  const location = createLocationStep(input);
  return new WorkflowResponse(location);
});

export const updateLocationWorkflow = createWorkflow<
  UpdateLocationInput,
  { id: string },
  []
>("update-location", function (input) {
  const location = updateLocationStep(input);
  return new WorkflowResponse(location);
});

export const deleteLocationWorkflow = createWorkflow<
  { company_id: string; location_id: string },
  boolean,
  []
>("delete-location", function (input) {
  const done = deleteLocationStep(input);
  return new WorkflowResponse(done);
});
