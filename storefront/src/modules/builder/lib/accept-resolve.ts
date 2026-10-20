// The stale-response guard of use-build-resolve, kept pure (no server action import) so it tests.
// A response whose config_key differs from the requested key is another configuration's answer
// (a backend/storefront version skew where the backend decode reset an option it doesn't know),
// so it is an error and the page falls back to its local values.

import type { ResolveResponse } from "@lib/builder/types"

type ResolveActionResult = { ok: true; data: ResolveResponse } | { ok: false }

/** Accepts a resolve only when it answers the configuration that was asked for. */
export function acceptResolve(
  requestedKey: string,
  res: ResolveActionResult,
): { status: "done"; result: ResolveResponse } | { status: "error"; result: null } {
  if (!res.ok || res.data.config_key !== requestedKey) return { status: "error", result: null }
  return { status: "done", result: res.data }
}
