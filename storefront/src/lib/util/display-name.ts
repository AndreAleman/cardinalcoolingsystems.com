/* "Ada Acme", or the email when there is no name. */
export function displayName(c?: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
} | null): string {
  if (!c) return ""
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || ""
}
