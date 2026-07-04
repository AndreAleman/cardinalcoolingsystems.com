export const getBaseURL = () => {
  // Falls back to the production origin (not localhost) so that canonical URLs,
  // sitemap entries, and OpenGraph/Twitter image URLs resolve correctly even if
  // NEXT_PUBLIC_BASE_URL is ever unset on the deployed environment.
  return process.env.NEXT_PUBLIC_BASE_URL || "https://cardinalcoolingsystems.com"
}
