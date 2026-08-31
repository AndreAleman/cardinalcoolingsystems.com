type PromotionLike = {
  campaign?: {
    ends_at?: string | Date | null;
    budget?: { limit?: number | null; used?: number | null } | null;
  } | null;
} | null | undefined;

/*
  Pure seam: is a Welcome Code still worth showing? False once it has
  been used (usage budget spent) or its campaign has ended, or if the
  promotion no longer exists.
*/
export function isWelcomeCodeLive(promotion: PromotionLike, now: Date): boolean {
  if (!promotion) return false;
  const campaign = promotion.campaign;
  if (campaign?.ends_at && new Date(campaign.ends_at).getTime() <= now.getTime()) {
    return false;
  }
  const budget = campaign?.budget;
  if (budget?.limit != null && (budget.used ?? 0) >= budget.limit) {
    return false;
  }
  return true;
}
