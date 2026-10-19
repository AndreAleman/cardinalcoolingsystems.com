// CAD Package cache identity (Sanitube Phase 3 D5). Any change to the dimension tables, the
// generator or the drawing gives a new key (and new object keys).

import { CPQ_TABLES_HASH } from "../cpq-shared"
import { DRAWING_VERSION } from "../cpq-shared/drawing"

/**
 * The generator version the backend expects from cad-service (cad-service/app/version.py
 * GENERATOR_VERSION). Bump both together: the cache key is computed before the service is called.
 * A response with a different generator_version is logged and stored on the row.
 * generator-version.unit.spec.ts keeps this equal to version.py.
 */
export const CAD_GENERATOR_VERSION = "1"

/** Part Numbers are used in object keys and file names. */
export const PART_NUMBER_RE = /^[A-Za-z0-9-]{1,80}$/

export function cadCacheKey(partNumber: string): string {
  return `${partNumber}@${CPQ_TABLES_HASH}-g${CAD_GENERATOR_VERSION}-d${DRAWING_VERSION}`
}

/** Object keys of a CAD Package. PDF-only kinds (cdu-kit, strainer, hose) never write the STEP key. */
export function cadObjectKeys(partNumber: string): { step: string; pdf: string } {
  const base = `cad/${partNumber}/${CPQ_TABLES_HASH}-g${CAD_GENERATOR_VERSION}-d${DRAWING_VERSION}`
  return { step: `${base}.step`, pdf: `${base}.pdf` }
}
