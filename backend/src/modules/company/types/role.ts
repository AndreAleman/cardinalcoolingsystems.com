export const TEAM_MEMBER_ROLES = ["member", "manager", "admin"] as const;
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];
