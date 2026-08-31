import { MedusaService } from "@medusajs/framework/utils";
import { ApprovalStatusType } from "./types";
import { Approval, ApprovalSettings, ApprovalStatus } from "./models";

/*
  MedusaService pluralization quirk: at RUNTIME the ApprovalStatus CRUD
  methods are pluralized via `pluralize` ("ApprovalStatuses"), but the
  generated TS types spell them singular ("createApprovalStatus"). The
  singular typed methods do not exist at runtime. This merged interface
  declares the real runtime methods so call sites can use them under tsc.
*/
type ApprovalStatusRow = {
  id: string;
  cart_id: string;
  status: ApprovalStatusType;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface ApprovalModuleService {
  createApprovalStatuses(
    data: { cart_id: string; status?: ApprovalStatusType }[]
  ): Promise<ApprovalStatusRow[]>;
  updateApprovalStatuses(
    data: { id: string; status: ApprovalStatusType }[]
  ): Promise<ApprovalStatusRow[]>;
  deleteApprovalStatuses(ids: string[]): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class ApprovalModuleService extends MedusaService({
  Approval,
  ApprovalSettings,
  ApprovalStatus,
}) {
  async hasPendingApprovals(cartId: string): Promise<boolean> {
    const [, count] = await this.listAndCountApprovals({
      cart_id: cartId,
      status: ApprovalStatusType.PENDING,
    });

    return count > 0;
  }
}

export default ApprovalModuleService;
