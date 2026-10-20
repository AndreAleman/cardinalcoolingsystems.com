// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Shared CPQ types for the Cardinal Builder (docs/specs/cardinal-builder-plan.md).
// Pure TypeScript: no deps, no DOM/Node APIs, ES2021, extensionless relative imports.

/** Nominal OD × 100: 50, 75, 100, 150, 200, 250, 300, 400, 600, 800, 1000, 1200. */
export type SizeCode = number
/** Sanitube's End Connections plus Cardinal's (flanges, NPT, grooved, butt-weld pipe, cap). */
export type EndConnectionCode =
  | "bw"
  | "tc"
  | "mil"
  | "fil"
  | "pbs"
  | "tbs"
  | "mnpt"
  | "fl150"
  | "fl300"
  | "fnpt"
  | "grv"
  | "bwp"
  | "cap"
export type AlloyValue = "T304L" | "T316L"
export type Vec2 = [number, number]

/** Every dimension JSON file starts with this header. */
export type TableHeader = {
  version: string
  status: string
  units: "in"
  notes?: string[]
}

// ---------------------------------------------------------------- tube-sizes.json (= Sanitube)
export type TubeSizeRow = {
  size_code: SizeCode
  label: string
  od_in: number
  wall_in: number
  source: string
  verified: boolean
}
export type TubeSizesTable = TableHeader & { sizes: TubeSizeRow[] }

// ---------------------------------------------------------------- end-connections.json
export type EndConnectionType = {
  code: EndConnectionCode
  label: string
  /** Drawing/summary label: "TC", "BW", "150# FLG", ... */
  short: string
  /** Part Number token: "clmp" for tc (Sanitube H27), otherwise the code. */
  pn_token: string
  /** Canonical order for Part Numbers. */
  sort: number
  aliases?: string[]
}
export type EndConnectionRow = {
  code: EndConnectionCode
  size_code: SizeCode
  /** Face → weld line along the axis; 0 for bw. */
  length_in: number
  /** Largest diameter (TC flange OD, B16.5 flange OD, ...); = tube OD for bw. */
  max_od_in: number
  /** OUTER half-section, [axial_from_face_in, radius_in], from the face (0) to the weld line (length_in). */
  profile: Vec2[]
  /** null = tube ID; 0 = closed (cap); otherwise the bore at the face. */
  bore_in: number | null
  /** Estimated mass of the End Connection (lb), verified false. */
  mass_lb: number
  source: string
  verified: boolean
}
export type EndConnectionsTable = TableHeader & {
  types: EndConnectionType[]
  rows: EndConnectionRow[]
}

// ---------------------------------------------------------------- materials.json (= Sanitube)
export type AlloyRow = {
  value: AlloyValue
  digit: "4" | "6"
  label: string
  density_lb_per_in3: number
}
export type MaterialsTable = TableHeader & { alloys: AlloyRow[] }

// ---------------------------------------------------------------- bom-templates.json
export type BomRoleTemplate = {
  role: string
  label: string
  /** Candidate SKU patterns in order of preference; {d} {s} {sr} {s2} placeholders. Empty = none stocked. */
  patterns: string[]
  /**
   * Fixed material of the whole SKU family, when it does not follow the configuration's alloy
   * (clamps are T304, strainers T316L). Named in the BOM line and in the Spec Block.
   */
  material?: string
  source: string
  verified: boolean
}
export type KitRules = {
  ports_per_cdu: number
  base_joints_per_port: number
  joints_per_valve: number
  joints_per_strainer: number
  strainer_ports: number
  spool_ferrules_per_port: number
  far_tc_ferrules_per_port: number
  spare_gasket_fraction: number
  spare_clamps_per_kit: number
  source: string
  verified: boolean
}
export type BomTemplatesTable = TableHeader & {
  size_ranges: Record<string, string>
  roles: BomRoleTemplate[]
  kit_rules: KitRules
  hose: { stock_lengths_in: number[]; source: string; verified: boolean }
}

// ---------------------------------------------------------------- assemblies.json
export type AssembliesTable = TableHeader & {
  stick_length_in: number
  lead_time: { stock: string; custom: string; quote_promise: string; source: string; verified: boolean }
  components: {
    clamp_mass_lb_base: number
    clamp_mass_lb_per_in_od: number
    gasket_mass_lb: number
    source: string
    verified: boolean
  }
  reducers: { size_code: SizeCode; length_in: number; source: string; verified: boolean }[]
  valves: { kind: "bv" | "bfv"; size_code: SizeCode; length_in: number; mass_lb: number; source: string; verified: boolean }[]
  strainer: {
    body_od_factor: number
    body_od_min_extra_in: number
    short_length_factor: number
    short_length_min_in: number
    long_length_factor: number
    screen_mass_lb_per_in2: number
    mesh: { mesh: number; micron: number }[]
    dp_port_size_code: SizeCode
    source: string
    verified: boolean
  }
  hoses: {
    size_code: SizeCode
    lb_per_ft: number
    rated_psi: number
    min_bend_radius_in: number
    source: string
    verified: boolean
  }[]
  hose_covers: { cover: string; label: string; max_psi: number | null }[]
  tc_clamp_max_psi: { size_code: SizeCode; psi: number }[]
  manifold: {
    rows: {
      header_code: SizeCode
      end_allowance_in: number
      drop_height_in: number
      source: string
      verified: boolean
    }[]
    fill_size_code: SizeCode
    drain_size_code: SizeCode
    vent_size_code: SizeCode
    instrument_size_code: SizeCode
    instrument_ports: number
    port_projection_in: number
    min_pitch_clearance_in: number
    hydro_test_psig: number
    design_psig: number
    source: string
    verified: boolean
  }
}

// ---------------------------------------------------------------- builder options

export type BuilderType = "cdu-kit" | "row-manifold" | "transition" | "strainer" | "hose"
export type AlloyKey = "t316l" | "t304l"

/** One canonical query key. Order in a builder's `keys` = canonical order = identity. */
export type KeySpec =
  | { key: string; type: "enum"; values: readonly string[]; default: string }
  | { key: string; type: "int"; min: number; max: number; default: number }
  /** Decimal inches on the 1/8" grid. */
  | { key: string; type: "inches"; min: number; max: number; default: number }
  /** Size code; encoded as a 3-digit token (050, 150, 1000). */
  | { key: string; type: "size"; values: readonly number[]; default: number }
  /** Comma list of allowed items; encoded in the order of `values`. */
  | { key: string; type: "list"; values: readonly string[]; default: readonly string[] }

export type OptionValue = string | number | string[]
export type Options = Record<string, OptionValue>

/** URLSearchParams, Next.js searchParams, or a JSON body (numbers and arrays allowed). */
export type ParamSource =
  | URLSearchParams
  | Record<string, string | number | boolean | readonly (string | number)[] | null | undefined>

export type DecodeResult<O> = { options: O; ignored: string[] }
export type OptionError = { key: string; message: string }
export type ValidationResult<O> = { ok: true; value: O } | { ok: false; errors: OptionError[] }

export type CduPort = "tc100" | "tc150" | "tc200" | "tc300" | "tc400" | "dn50" | "dn80"
export type CduKitOptions = {
  cdu: "none" | "boyd-10u"
  port: CduPort
  side: "tcs" | "fws"
  run: "hard" | "hose"
  far: "tc" | "fl150" | "npt" | "grv"
  len: number
  iso: "none" | "bfv" | "bv"
  strainer: "none" | "short" | "long"
  gasket: "epdm" | "sil" | "ptfe"
  spares: "0" | "1"
  units: number
  alloy: AlloyKey
}
export type RowManifoldOptions = {
  header: number
  drops: number
  pitch: number
  drop: number
  dstyle: "tc" | "bv" | "uqd"
  ends: "tc" | "fl150" | "grv" | "cap"
  pair: "1" | "0"
  alloy: AlloyKey
  finish: "32" | "20"
  fill: "1" | "0"
  inst: "0" | "1"
  docs: ("hydro" | "mtr" | "pass" | "weldmap")[]
}
export type TransitionEndA = "tc" | "mil" | "fil" | "pbs" | "tbs" | "bw"
export type TransitionEndB = "fl150" | "fl300" | "mnpt" | "fnpt" | "grv" | "bwp"
export type TransitionOptions = {
  a: TransitionEndA
  b: TransitionEndB
  od: number
  odb: number
  len: number
  alloy: AlloyKey
  qty: number
}
export type StrainerOptions = {
  size: number
  body: "short" | "long"
  mesh: "20" | "40" | "100"
  iso: "0" | "1"
  dp: "0" | "1"
  qty: number
}
export type HoseOptions = {
  size: number
  len: number
  ends: "tc-tc" | "tc-npt" | "tc-fl150"
  cover: "braid" | "silicone" | "ptfe"
  sleeve: "none" | "armor" | "fire"
  qty: number
}
export type OptionsByType = {
  "cdu-kit": CduKitOptions
  "row-manifold": RowManifoldOptions
  transition: TransitionOptions
  strainer: StrainerOptions
  hose: HoseOptions
}

// ---------------------------------------------------------------- outputs

export type LeadTimeKind = "stock" | "custom"
export type LeadTime = { kind: LeadTimeKind; label: string }

export type BomLineKind = "sku" | "fabricated"
export type BomLine = {
  role: string
  /** Shown in the BOM, e.g. 'TC ferrule, long weld, 1-1/2" T316L'. */
  label: string
  /** Candidate SKUs, preferred first; the resolver takes the first published one. Empty = none stocked. */
  candidates: string[]
  qty_per_unit: number
  /** "fabricated" = welded or cut to length: never Instant (Quote mode). */
  kind: BomLineKind
  lead_time: LeadTimeKind
  /** Fabricated sub-assemblies (spool, hose, strainer) carry their own Part Number. */
  part_number?: string
  size_code?: SizeCode
  note?: string
  /**
   * The line's material as the BOM names it ("T316L", "T304"): the configuration's alloy for
   * alloy-following parts, or the role's fixed `material` from bom-templates.json. The Spec Block
   * reads it from here, so the two can't disagree.
   */
  material?: string
}
export type Bom = { lines: BomLine[]; units: number }

export type ReviewReason = { code: string; message: string }
/** Review flags, not hard limits: a configuration outside the Standard Range is still quotable. */
export type StandardRange = { ok: boolean; reasons: ReviewReason[] }

export type WeightPart = { label: string; lb: number }
export type Weight = { per_unit_lb: number; parts: WeightPart[] }

export type DisplayRow = { label: string; value: string }

// ---------------------------------------------------------------- geometry

export type Segment =
  | { kind: "line"; from: Vec2; to: Vec2 }
  | {
      kind: "arc"
      center: Vec2
      radius: number
      startRad: number
      endRad: number
      clockwise: boolean
    }

export type EndGeom = {
  code: EndConnectionCode
  /** Size code of the tube this end is welded to. */
  sizeCode: SizeCode
  length: number
  maxOd: number
  profile: Vec2[]
  bore: number | null
  massLb: number
}
export type BBox = { minX: number; minY: number; maxX: number; maxY: number }
/** Inches, XY plane: `dir` = unit outward normal of the face. */
export type FaceGeom = { point: Vec2; dir: Vec2; end: EndGeom }

/** An axisymmetric piece between two weld lines along +X (tube, cone, body, hose). */
export type AxialSegment = {
  x0: number
  x1: number
  /** Outer radius at x0 / x1. */
  r0: number
  r1: number
  /** Inner radius at x0 / x1 (drawn dashed); null = solid (not drawn). */
  ri0: number | null
  ri1: number | null
  style: "tube" | "cone" | "body" | "hose"
}

/** Transition Spool: axis along +X, Face A (0,0) facing −X, Face B (L,0) facing +X. */
export type TransitionGeometry = {
  kind: "transition"
  od: number
  odb: number
  wall: number
  wallB: number
  id: number
  idb: number
  overallLength: number
  ends: { a: EndGeom; b: EndGeom }
  faces: { a: FaceGeom; b: FaceGeom }
  weldA: Vec2
  weldB: Vec2
  /** Concentric reducer just behind End B's weld line, or null when od = odb. */
  reducer: { x0: number; x1: number; length: number } | null
  /** Straight tube at size od: weldA → reducer (or weldB). May be < 0 → review. */
  tubeStraight: number
  segments: AxialSegment[]
  bbox: BBox
  tubeVolumeIn3: number
  approxWeightLb: number
}

export type ManifoldPortRole = "drop" | "fill" | "drain" | "vent" | "instrument"
/** A branch welded to the header: its face at (x, ±faceY), pointing up (+Y) or down (−Y). */
export type ManifoldBranch = {
  role: ManifoldPortRole
  x: number
  /** +1 = up (drops, vent, instruments), −1 = down (fill, drain). */
  side: 1 | -1
  sizeCode: SizeCode
  od: number
  wall: number
  /** Header centerline → branch face. */
  height: number
  /** Tube stub between the header OD and the end's weld line. */
  stubLength: number
  end: EndGeom
  face: FaceGeom
  /** Isolation ball valve clamped on the drop face (drop style bv), else null. */
  valve: { length: number; massLb: number } | null
}
/** Row Manifold: header along +X from Face A (0,0) to Face B (L,0); drops toward +Y. */
export type ManifoldGeometry = {
  kind: "row-manifold"
  header: {
    sizeCode: SizeCode
    od: number
    wall: number
    id: number
    /** Face to face = (drops − 1) × pitch + 2 × end allowance. */
    length: number
    endAllowance: number
    ends: { a: EndGeom; b: EndGeom }
    faces: { a: FaceGeom; b: FaceGeom }
    /** Header tube between the two end weld lines. */
    tubeLength: number
  }
  pitch: number
  dropHeight: number
  branches: ManifoldBranch[]
  cutList: {
    header_tube_in: number
    /** One per drop (all equal). */
    drop_stub_in: number
    drops: number
    port_stubs: { role: ManifoldPortRole; size_code: SizeCode; length_in: number }[]
    /** Header tube longer than one 20 ft stick → welded header joint. */
    header_sticks: number
  }
  bbox: BBox
  approxWeightLb: number
}

export type StrainerGeometry = {
  kind: "strainer"
  od: number
  wall: number
  bodyOd: number
  bodyLength: number
  overallLength: number
  ends: { a: EndGeom; b: EndGeom }
  faces: { a: FaceGeom; b: FaceGeom }
  segments: AxialSegment[]
  meshMicron: number
  bbox: BBox
  approxWeightLb: number
}

export type HoseGeometry = {
  kind: "hose"
  od: number
  length: number
  ends: { a: EndGeom; b: EndGeom }
  faces: { a: FaceGeom; b: FaceGeom }
  segments: AxialSegment[]
  ratedPsi: number
  minBendRadius: number
  bbox: BBox
  approxWeightLb: number
}
