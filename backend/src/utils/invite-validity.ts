export const INVITE_DAYS = 7;

type InviteLike = {
  email: string;
  expires_at: string | Date;
  accepted_at?: string | Date | null;
} | null | undefined;

export type InviteProblem = "not_found" | "expired" | "already_accepted" | "wrong_email";

/*
  Pure seam: may this customer accept this Invite right now? The token
  is single-use, expires, and belongs to exactly one email (compared
  case-insensitively).
*/
export function inviteProblem(
  invite: InviteLike,
  customerEmail: string,
  now: Date
): InviteProblem | null {
  if (!invite) return "not_found";
  if (invite.accepted_at) return "already_accepted";
  if (new Date(invite.expires_at).getTime() <= now.getTime()) return "expired";
  if (invite.email.trim().toLowerCase() !== customerEmail.trim().toLowerCase()) return "wrong_email";
  return null;
}

export function inviteExpiry(issuedAt: Date): Date {
  const d = new Date(issuedAt.getTime());
  d.setUTCDate(d.getUTCDate() + INVITE_DAYS);
  return d;
}
