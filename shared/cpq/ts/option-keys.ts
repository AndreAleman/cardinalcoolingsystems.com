// Canonical query keys per builder (plan "URLs and options", v=1). Order = canonical order =
// identity; the first enum value is the default unless `default` says otherwise.

import { defaultOptions } from "./share-link"
import type {
  BuilderType,
  CduKitOptions,
  HoseOptions,
  KeySpec,
  RowManifoldOptions,
  StrainerOptions,
  TransitionOptions,
} from "./types"

const ALLOY: KeySpec = { key: "alloy", type: "enum", values: ["t316l", "t304l"], default: "t316l" }

export const CDU_PORTS = ["tc100", "tc150", "tc200", "tc300", "tc400", "dn50", "dn80"] as const

export const CDU_KIT_KEYS: readonly KeySpec[] = [
  { key: "cdu", type: "enum", values: ["none", "boyd-10u"], default: "none" },
  { key: "port", type: "enum", values: CDU_PORTS, default: "tc150" },
  { key: "side", type: "enum", values: ["tcs", "fws"], default: "tcs" },
  { key: "run", type: "enum", values: ["hard", "hose"], default: "hard" },
  // Dependent default: TCS → tc, FWS → fl150 (normalize in builder-cdu-kit.ts).
  { key: "far", type: "enum", values: ["tc", "fl150", "npt", "grv"], default: "tc" },
  { key: "len", type: "int", min: 12, max: 240, default: 36 },
  { key: "iso", type: "enum", values: ["none", "bfv", "bv"], default: "none" },
  { key: "strainer", type: "enum", values: ["none", "short", "long"], default: "none" },
  { key: "gasket", type: "enum", values: ["epdm", "sil", "ptfe"], default: "epdm" },
  { key: "spares", type: "enum", values: ["0", "1"], default: "0" },
  { key: "units", type: "int", min: 1, max: 200, default: 1 },
  ALLOY,
]

export const MANIFOLD_HEADER_SIZES = [300, 400, 600, 800] as const
export const MANIFOLD_DROP_SIZES = [100, 150] as const
export const MANIFOLD_DOCS = ["hydro", "mtr", "pass", "weldmap"] as const

export const ROW_MANIFOLD_KEYS: readonly KeySpec[] = [
  { key: "header", type: "size", values: MANIFOLD_HEADER_SIZES, default: 400 },
  { key: "drops", type: "int", min: 2, max: 48, default: 12 },
  { key: "pitch", type: "int", min: 6, max: 96, default: 24 },
  { key: "drop", type: "size", values: MANIFOLD_DROP_SIZES, default: 100 },
  { key: "dstyle", type: "enum", values: ["tc", "bv", "uqd"], default: "tc" },
  { key: "ends", type: "enum", values: ["tc", "fl150", "grv", "cap"], default: "tc" },
  { key: "pair", type: "enum", values: ["1", "0"], default: "1" },
  ALLOY,
  { key: "finish", type: "enum", values: ["32", "20"], default: "32" },
  { key: "fill", type: "enum", values: ["1", "0"], default: "1" },
  { key: "inst", type: "enum", values: ["0", "1"], default: "0" },
  { key: "docs", type: "list", values: MANIFOLD_DOCS, default: ["hydro", "mtr"] },
]

export const TRANSITION_SIZES = [100, 150, 200, 250, 300, 400, 600, 800] as const
export const TRANSITION_END_A = ["tc", "mil", "fil", "pbs", "tbs", "bw"] as const
export const TRANSITION_END_B = ["fl150", "fl300", "mnpt", "fnpt", "grv", "bwp"] as const

export const TRANSITION_KEYS: readonly KeySpec[] = [
  { key: "a", type: "enum", values: TRANSITION_END_A, default: "tc" },
  { key: "b", type: "enum", values: TRANSITION_END_B, default: "fl150" },
  { key: "od", type: "size", values: TRANSITION_SIZES, default: 200 },
  // Dependent default: = od (normalize in builder-transition.ts).
  { key: "odb", type: "size", values: TRANSITION_SIZES, default: 200 },
  { key: "len", type: "inches", min: 2, max: 72, default: 12 },
  ALLOY,
  { key: "qty", type: "int", min: 1, max: 500, default: 1 },
]

export const STRAINER_SIZES = [100, 150, 200, 250, 300, 400, 600] as const

export const STRAINER_KEYS: readonly KeySpec[] = [
  { key: "size", type: "size", values: STRAINER_SIZES, default: 200 },
  { key: "body", type: "enum", values: ["short", "long"], default: "short" },
  { key: "mesh", type: "enum", values: ["20", "40", "100"], default: "20" },
  { key: "iso", type: "enum", values: ["0", "1"], default: "0" },
  { key: "dp", type: "enum", values: ["0", "1"], default: "0" },
  { key: "qty", type: "int", min: 1, max: 500, default: 1 },
]

export const HOSE_SIZES = [50, 75, 100, 150, 200, 250, 300, 400] as const

export const HOSE_KEYS: readonly KeySpec[] = [
  { key: "size", type: "size", values: HOSE_SIZES, default: 150 },
  { key: "len", type: "int", min: 12, max: 240, default: 36 },
  { key: "ends", type: "enum", values: ["tc-tc", "tc-npt", "tc-fl150"], default: "tc-tc" },
  { key: "cover", type: "enum", values: ["braid", "silicone", "ptfe"], default: "braid" },
  { key: "sleeve", type: "enum", values: ["none", "armor", "fire"], default: "none" },
  { key: "qty", type: "int", min: 1, max: 500, default: 1 },
]

export const KEYS_BY_TYPE: { readonly [T in BuilderType]: readonly KeySpec[] } = {
  "cdu-kit": CDU_KIT_KEYS,
  "row-manifold": ROW_MANIFOLD_KEYS,
  transition: TRANSITION_KEYS,
  strainer: STRAINER_KEYS,
  hose: HOSE_KEYS,
}

export const DEFAULT_CDU_KIT_OPTIONS: Readonly<CduKitOptions> = Object.freeze(defaultOptions<CduKitOptions>(CDU_KIT_KEYS))
export const DEFAULT_ROW_MANIFOLD_OPTIONS: Readonly<RowManifoldOptions> = Object.freeze(
  defaultOptions<RowManifoldOptions>(ROW_MANIFOLD_KEYS),
)
export const DEFAULT_TRANSITION_OPTIONS: Readonly<TransitionOptions> = Object.freeze(
  defaultOptions<TransitionOptions>(TRANSITION_KEYS),
)
export const DEFAULT_STRAINER_OPTIONS: Readonly<StrainerOptions> = Object.freeze(
  defaultOptions<StrainerOptions>(STRAINER_KEYS),
)
export const DEFAULT_HOSE_OPTIONS: Readonly<HoseOptions> = Object.freeze(defaultOptions<HoseOptions>(HOSE_KEYS))
