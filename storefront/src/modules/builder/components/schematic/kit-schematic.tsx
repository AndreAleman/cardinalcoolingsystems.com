// CDU Hookup Kit schematic: one port's run, left to right: the CDU and its port, the isolation
// valve and supply strainer when chosen, the run (wavy = braided hose, straight = welded spool), the
// far-end fitting and the facility or TCS pipe. Labels carry the sizes (1.5" TC, 36" hose, 150#
// flange).
//
// A pure function of the options: no hooks, no browser APIs, no Tailwind classes inside the SVG
// (explicit fills and strokes), so it renders on the server, in the client shell and in an OG image.
// `role="img"` with a text caption; the page shows the caption alone on phones.

import { CDU_MODELS, cduPortSize, isDnPort, type CduKitOptions, type Options } from "@lib/cpq/shared"

/** Decimal inches (150 → 1.5"), as buyers say it. Kept local so this file has no app imports. */
const inch = (code: number) => `${code / 100}"`

const INK = "#1f2937"
const MUTED = "#6b7280"
const PIPE = "#e5e7eb"
const ACCENT = "#D72638"
const FONT = "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"

const FAR_LABEL: Record<CduKitOptions["far"], string> = {
  tc: "TC",
  fl150: "150# flange",
  npt: "NPT",
  grv: "grooved",
}
const FAR_WORDS: Record<CduKitOptions["far"], string> = {
  tc: "tri-clamp",
  fl150: "ANSI 150# flange adapter",
  npt: "NPT adapter",
  grv: "grooved adapter",
}
const VALVE_WORDS: Record<CduKitOptions["iso"], string> = { none: "", bfv: "butterfly valve", bv: "ball valve" }

function kitOptions(options: Options): CduKitOptions {
  return options as unknown as CduKitOptions
}

function portLabel(o: CduKitOptions): string {
  return isDnPort(o.port) ? `${o.port.toUpperCase()} flange` : `${inch(cduPortSize(o.port))} TC`
}

function runLabel(o: CduKitOptions): string {
  return `${o.len}" ${o.run === "hose" ? "hose" : "spool"}`
}

function farLabel(o: CduKitOptions): string {
  return o.far === "tc" ? `${inch(cduPortSize(o.port))} TC` : FAR_LABEL[o.far]
}

const loopWords = (o: CduKitOptions) => (o.side === "tcs" ? "TCS loop pipe" : "facility (FWS) pipe")

/** The schematic's text equivalent, also the phone view. */
export function kitSchematicCaption(options: Options): string {
  const o = kitOptions(options)
  const model = CDU_MODELS.find((m) => m.key === o.cdu && m.port)
  const parts = [
    `${model ? `${model.label}, ` : ""}${isDnPort(o.port) ? `${o.port.toUpperCase()} hygienic flange` : `${inch(cduPortSize(o.port))} tri-clamp`} port`,
    VALVE_WORDS[o.iso],
    o.strainer === "none" ? "" : `${o.strainer} strainer (supply side)`,
    o.run === "hose" ? `${o.len}" braided hose` : `${o.len}" welded spool`,
    FAR_WORDS[o.far],
    loopWords(o),
  ].filter((p) => p)
  const units = o.units > 1 ? ` × ${o.units} CDUs` : ""
  return `Per port: ${parts.join(" → ")}. Two runs per CDU (supply and return)${units}.`
}

// ------------------------------------------------------------------- symbols

type Sym = { w: number; node: (x: number) => JSX.Element }

const Y = 70 // pipe center line
const PIPE_H = 12

function pipe(x: number, w: number, key: string) {
  return <rect key={key} x={x} y={Y - PIPE_H / 2} width={w} height={PIPE_H} fill={PIPE} stroke={INK} strokeWidth={1.25} />
}

function label(x: number, text: string, opts: { above?: boolean; accent?: boolean; key?: string } = {}) {
  return (
    <text
      key={opts.key}
      x={x}
      y={opts.above ? Y - 22 : Y + 32}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize={12}
      fontWeight={opts.accent ? 600 : 500}
      fill={opts.accent ? ACCENT : INK}
    >
      {text}
    </text>
  )
}

/** Tri-clamp joint: two ferrule faces and the clamp band. */
function clampJoint(name: string, text?: string, above = false): Sym {
  return {
    w: 22,
    node: (x) => (
      <g key={`${name}-${x}`} data-symbol={name}>
        <rect x={x + 4} y={Y - 13} width={14} height={26} rx={3} fill="#fff" stroke={INK} strokeWidth={1.5} />
        <line x1={x + 11} y1={Y - 13} x2={x + 11} y2={Y + 13} stroke={INK} strokeWidth={1.5} />
        {text ? label(x + 11, text, { above }) : null}
      </g>
    ),
  }
}

function flange(name: string, text: string, above = false): Sym {
  return {
    w: 22,
    node: (x) => (
      <g key={`${name}-${x}`} data-symbol={name}>
        <rect x={x + 3} y={Y - 18} width={7} height={36} fill={INK} />
        <rect x={x + 12} y={Y - 18} width={7} height={36} fill={INK} />
        {label(x + 11, text, { above })}
      </g>
    ),
  }
}

function threaded(name: string, text: string): Sym {
  const teeth = [0, 1, 2, 3].map((i) => `M${4 + i * 5} ${Y - 9} l2.5 18`).join(" ")
  return {
    w: 26,
    node: (x) => (
      <g key={`${name}-${x}`} data-symbol={name} transform={`translate(${x} 0)`}>
        <rect x={2} y={Y - 9} width={22} height={18} fill="#fff" stroke={INK} strokeWidth={1.5} />
        <path d={teeth} stroke={INK} strokeWidth={1.25} fill="none" />
        <text x={13} y={Y + 32} textAnchor="middle" fontFamily={FONT} fontSize={12} fontWeight={500} fill={INK}>
          {text}
        </text>
      </g>
    ),
  }
}

function grooved(name: string, text: string): Sym {
  return {
    w: 26,
    node: (x) => (
      <g key={`${name}-${x}`} data-symbol={name}>
        <rect x={x + 2} y={Y - 10} width={22} height={20} fill="#fff" stroke={INK} strokeWidth={1.5} />
        <rect x={x + 10} y={Y - 14} width={6} height={28} fill={INK} />
        {label(x + 13, text)}
      </g>
    ),
  }
}

function valve(kind: "bv" | "bfv"): Sym {
  return {
    w: 46,
    node: (x) => (
      <g key={`valve-${x}`} data-symbol={`valve-${kind}`}>
        {pipe(x, 46, "vp")}
        <path d={`M${x + 5} ${Y - 14} L${x + 23} ${Y} L${x + 5} ${Y + 14} Z M${x + 41} ${Y - 14} L${x + 23} ${Y} L${x + 41} ${Y + 14} Z`} fill="#fff" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        {kind === "bv" ? (
          <circle cx={x + 23} cy={Y} r={5} fill={INK} />
        ) : (
          <>
            <circle cx={x + 23} cy={Y} r={5} fill="#fff" stroke={INK} strokeWidth={1.5} />
            <line x1={x + 19} y1={Y + 5} x2={x + 27} y2={Y - 5} stroke={INK} strokeWidth={1.5} />
          </>
        )}
        <line x1={x + 23} y1={Y - 5} x2={x + 23} y2={Y - 20} stroke={INK} strokeWidth={1.5} />
        <line x1={x + 15} y1={Y - 20} x2={x + 31} y2={Y - 20} stroke={INK} strokeWidth={2} />
        {label(x + 23, kind === "bv" ? "ball valve" : "butterfly valve", { accent: true })}
      </g>
    ),
  }
}

function strainer(body: "short" | "long"): Sym {
  const w = body === "long" ? 64 : 52
  return {
    w,
    node: (x) => (
      <g key={`strainer-${x}`} data-symbol="strainer">
        <rect x={x + 2} y={Y - 12} width={w - 4} height={24} rx={4} fill="#fff" stroke={INK} strokeWidth={1.5} />
        <path d={`M${x + 10} ${Y - 6} H${x + w - 10} M${x + 10} ${Y} H${x + w - 10} M${x + 10} ${Y + 6} H${x + w - 10}`} stroke={INK} strokeWidth={1} strokeDasharray="2 2" />
        {label(x + w / 2, `${body} strainer`, { accent: true })}
        <text x={x + w / 2} y={Y + 46} textAnchor="middle" fontFamily={FONT} fontSize={11} fill={MUTED}>
          supply side
        </text>
      </g>
    ),
  }
}

function run(o: CduKitOptions): Sym {
  const w = 200
  if (o.run === "hose") {
    // Wavy braided hose between its two TC ends.
    const waves = 8
    const step = (w - 16) / waves
    let d = `M${8} ${Y}`
    for (let i = 0; i < waves; i++) d += ` q${step / 4} ${i % 2 ? 9 : -9} ${step / 2} 0 t${step / 2} 0`
    return {
      w,
      node: (x) => (
        <g key={`run-${x}`} data-symbol="hose" transform={`translate(${x} 0)`}>
          <rect x={0} y={Y - 7} width={8} height={14} fill={PIPE} stroke={INK} strokeWidth={1.25} />
          <rect x={w - 8} y={Y - 7} width={8} height={14} fill={PIPE} stroke={INK} strokeWidth={1.25} />
          <path d={`${d} L${w - 8} ${Y}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <path d={`${d} L${w - 8} ${Y}`} fill="none" stroke={PIPE} strokeWidth={5.5} strokeLinecap="round" strokeDasharray="3 2" />
          <text x={w / 2} y={Y - 20} textAnchor="middle" fontFamily={FONT} fontSize={12} fontWeight={600} fill={INK}>
            {runLabel(o)}
          </text>
        </g>
      ),
    }
  }
  return {
    w,
    node: (x) => (
      <g key={`run-${x}`} data-symbol="spool">
        {pipe(x, w, "sp")}
        <text x={x + w / 2} y={Y - 20} textAnchor="middle" fontFamily={FONT} fontSize={12} fontWeight={600} fill={INK}>
          {runLabel(o)}
        </text>
        <text x={x + w / 2} y={Y + 32} textAnchor="middle" fontFamily={FONT} fontSize={11} fill={MUTED}>
          welded, face to face
        </text>
      </g>
    ),
  }
}

function farEnd(o: CduKitOptions): Sym {
  const text = farLabel(o)
  switch (o.far) {
    case "tc":
      return clampJoint("far-tc", text)
    case "fl150":
      return flange("far-fl150", text)
    case "npt":
      return threaded("far-npt", text)
    case "grv":
      return grooved("far-grv", text)
  }
}

const gap = (w: number): Sym => ({ w, node: (x) => pipe(x, w, `g-${x}`) })

// ------------------------------------------------------------------- component

export type KitSchematicProps = {
  options: Options
  className?: string
  /** Rendered as <title>; defaults to the caption. */
  title?: string
}

export function KitSchematic({ options, className, title }: KitSchematicProps) {
  const o = kitOptions(options)
  const model = CDU_MODELS.find((m) => m.key === o.cdu && m.port)
  const caption = kitSchematicCaption(options)

  const CDU_W = 104
  const syms: Sym[] = [gap(14)]
  syms.push(isDnPort(o.port) ? flange("port-dn", portLabel(o), true) : clampJoint("port", portLabel(o), true))
  if (o.iso !== "none") syms.push(gap(10), valve(o.iso), gap(10))
  if (o.strainer !== "none") syms.push(gap(o.iso === "none" ? 12 : 0), strainer(o.strainer), gap(10))
  syms.push(gap(6), run(o), gap(6), farEnd(o), gap(70))

  let x = 8 + CDU_W
  const nodes: JSX.Element[] = []
  for (const s of syms) {
    nodes.push(s.node(x))
    x += s.w
  }
  const width = x + 8
  const height = 150
  const pipeEnd = x

  return (
    <svg
      role="img"
      aria-label={title ?? caption}
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      data-testid="kit-schematic"
      data-run={o.run}
      data-far={o.far}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title ?? caption}</title>
      {/* The CDU */}
      <g data-symbol="cdu">
        <rect x={8} y={Y - 44} width={CDU_W} height={88} fill="#fff" stroke={INK} strokeWidth={1.75} />
        <text x={8 + CDU_W / 2} y={Y - 4} textAnchor="middle" fontFamily={FONT} fontSize={16} fontWeight={700} fill={INK}>
          CDU
        </text>
        <text x={8 + CDU_W / 2} y={Y + 14} textAnchor="middle" fontFamily={FONT} fontSize={10.5} fill={MUTED}>
          {model ? model.label.replace(/ CDU$/, "") : o.side === "tcs" ? "TCS side" : "FWS side"}
        </text>
      </g>
      {nodes}
      {/* Facility / TCS pipe fades out to the right. */}
      <text x={pipeEnd - 35} y={Y - 20} textAnchor="middle" fontFamily={FONT} fontSize={11} fill={MUTED}>
        {o.side === "tcs" ? "TCS pipe" : "facility pipe"}
      </text>
      <text x={8} y={height - 6} fontFamily={FONT} fontSize={11} fill={MUTED}>
        {`One run shown · 2 per CDU (supply + return)${o.units > 1 ? ` · × ${o.units} CDUs` : ""}`}
      </text>
    </svg>
  )
}

export default KitSchematic
