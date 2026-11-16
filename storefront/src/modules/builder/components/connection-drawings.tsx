// Connection explainer drawings (spec Page 3: "what tri-clamp, I-line, bevel seat, grooved and
// flanged connections are, with a drawing of each, and which side of a liquid-cooling loop they
// typically sit on"). Plain inline SVG, server-rendered, no dependencies. Schematic side views
// (upper half sectioned), not to scale.

import type { ReactNode } from "react"

const INK = "#0a0a0a"
const RED = "#D72638"
const HATCH = "#d4d4d4"

export type ConnectionKey = "tc" | "iline" | "bevel" | "grv" | "flange" | "npt"

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 260 140" role="img" aria-label={title} className="h-auto w-full" data-testid="connection-drawing">
      <title>{title}</title>
      <rect x="0" y="0" width="260" height="140" fill="#fff" />
      <line x1="6" y1="70" x2="254" y2="70" stroke={INK} strokeWidth="0.6" strokeDasharray="10 3 2 3" />
      <g fill="none" stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  )
}

/** Tube walls from x0 to x1 (OD radius 22, wall 3), upper half hatched. */
function Tube({ x0, x1, r = 22 }: { x0: number; x1: number; r?: number }) {
  return (
    <>
      <rect x={x0} y={70 - r} width={x1 - x0} height="3" fill={HATCH} />
      <line x1={x0} y1={70 - r} x2={x1} y2={70 - r} />
      <line x1={x0} y1={70 - r + 3} x2={x1} y2={70 - r + 3} />
      <line x1={x0} y1={70 + r} x2={x1} y2={70 + r} />
      <line x1={x0} y1={70 + r - 3} x2={x1} y2={70 + r - 3} strokeDasharray="3 2" strokeWidth="0.8" />
    </>
  )
}

/** A tri-clamp ferrule flange: face at x, growing toward `dir` (-1 = left ferrule). */
function Ferrule({ face, dir }: { face: number; dir: 1 | -1 }) {
  const back = face + dir * 16
  const taper = face + dir * 24
  const pts = (s: 1 | -1) =>
    `${taper},${70 - s * 22} ${back},${70 - s * 33} ${face},${70 - s * 33} ${face},${70 - s * 22}`
  return (
    <>
      <polygon points={pts(1)} fill={HATCH} />
      <polygon points={pts(-1)} />
    </>
  )
}

function ClampBand({ x0, x1 }: { x0: number; x1: number }) {
  const mid = (x0 + x1) / 2
  return (
    <>
      <polyline points={`${x0},44 ${x0 + 6},30 ${x1 - 6},30 ${x1},44`} stroke={RED} strokeWidth="2" />
      <polyline points={`${x0},96 ${x0 + 6},110 ${x1 - 6},110 ${x1},96`} stroke={RED} strokeWidth="2" />
      <rect x={mid - 5} y="16" width="10" height="14" stroke={RED} strokeWidth="1.6" />
      <line x1={mid - 9} y1="16" x2={mid + 9} y2="16" stroke={RED} strokeWidth="2" />
    </>
  )
}

function Gasket({ x }: { x: number }) {
  return (
    <>
      <rect x={x - 1.5} y="37" width="3" height="15" fill={INK} stroke="none" />
      <rect x={x - 1.5} y="88" width="3" height="15" fill={INK} stroke="none" />
    </>
  )
}

export function TriClampDrawing() {
  return (
    <Frame title="Tri-clamp connection: two ferrules, a gasket and a hinged clamp">
      <Tube x0={10} x1={106} />
      <Ferrule face={128.5} dir={-1} />
      <Gasket x={130} />
      <Ferrule face={131.5} dir={1} />
      <Tube x0={154} x1={250} />
      <ClampBand x0={104} x1={156} />
    </Frame>
  )
}

export function ILineDrawing() {
  return (
    <Frame title="I-line connection: male and female ferrules that nest, clamped">
      <Tube x0={10} x1={106} />
      <Ferrule face={128.5} dir={-1} />
      {/* male spigot into the female recess */}
      <rect x="128.5" y="40" width="7" height="8" fill={HATCH} />
      <rect x="128.5" y="92" width="7" height="8" />
      <Ferrule face={131.5} dir={1} />
      <Tube x0={154} x1={250} />
      <ClampBand x0={104} x1={156} />
    </Frame>
  )
}

export function BevelSeatDrawing() {
  const thread = Array.from({ length: 8 }, (_, i) => `${132 + i * 4},38 ${134 + i * 4},34`).join(" ")
  return (
    <Frame title="Bevel seat connection: threaded ferrule, bevel-seat ferrule and hex nut">
      <Tube x0={10} x1={112} />
      {/* bevel-seat ferrule */}
      <polygon points="112,48 124,40 132,40 132,48" fill={HATCH} />
      <polygon points="112,92 124,100 132,100 132,92" />
      {/* threaded ferrule */}
      <polyline points={`132,38 ${thread} 164,38`} />
      <polyline points="132,102 164,102" />
      <Tube x0={164} x1={250} />
      {/* hex nut */}
      <rect x="108" y="26" width="44" height="12" stroke={RED} strokeWidth="2" />
      <rect x="108" y="102" width="44" height="12" stroke={RED} strokeWidth="2" />
      <line x1="108" y1="38" x2="112" y2="44" stroke={RED} strokeWidth="2" />
      <line x1="108" y1="102" x2="112" y2="96" stroke={RED} strokeWidth="2" />
    </Frame>
  )
}

export function GroovedDrawing() {
  return (
    <Frame title="Grooved connection: roll-grooved pipe ends in a bolted coupling housing">
      <Tube x0={10} x1={128} r={24} />
      <Tube x0={132} x1={250} r={24} />
      {/* roll grooves */}
      <path d="M108 46 q4 6 8 0" />
      <path d="M144 46 q4 6 8 0" />
      <path d="M108 94 q4 -6 8 0" />
      <path d="M144 94 q4 -6 8 0" />
      {/* housing + gasket */}
      <path d="M100 46 L100 34 Q100 28 106 28 L154 28 Q160 28 160 34 L160 46" stroke={RED} strokeWidth="2" />
      <path d="M100 94 L100 106 Q100 112 106 112 L154 112 Q160 112 160 106 L160 94" stroke={RED} strokeWidth="2" />
      <rect x="114" y="38" width="32" height="7" fill={INK} stroke="none" />
      <rect x="114" y="95" width="32" height="7" fill={INK} stroke="none" />
      <rect x="125" y="14" width="10" height="14" stroke={RED} strokeWidth="1.6" />
    </Frame>
  )
}

export function FlangedDrawing() {
  return (
    <Frame title="Flanged connection: two flanges bolted face to face over a gasket">
      <Tube x0={10} x1={108} />
      <rect x="108" y="22" width="18" height="96" fill="none" />
      <rect x="108" y="22" width="18" height="26" fill={HATCH} />
      <rect x="128" y="22" width="18" height="96" fill="none" />
      <Tube x0={146} x1={250} />
      <rect x="126" y="30" width="2" height="18" fill={INK} stroke="none" />
      <rect x="126" y="92" width="2" height="18" fill={INK} stroke="none" />
      {/* bolts */}
      <line x1="98" y1="30" x2="156" y2="30" stroke={RED} strokeWidth="2" />
      <line x1="98" y1="110" x2="156" y2="110" stroke={RED} strokeWidth="2" />
      <rect x="146" y="25" width="8" height="10" stroke={RED} strokeWidth="1.6" />
      <rect x="146" y="105" width="8" height="10" stroke={RED} strokeWidth="1.6" />
      <rect x="100" y="25" width="8" height="10" stroke={RED} strokeWidth="1.6" />
      <rect x="100" y="105" width="8" height="10" stroke={RED} strokeWidth="1.6" />
    </Frame>
  )
}

export function NptDrawing() {
  const teeth = (y0: number, s: 1 | -1) =>
    Array.from({ length: 9 }, (_, i) => {
      const x = 128 + i * 6
      const taper = i * 0.6
      return `${x},${y0 + s * taper} ${x + 3},${y0 - s * 4 + s * taper}`
    }).join(" ")
  return (
    <Frame title="NPT connection: tapered pipe thread into a threaded fitting">
      <Tube x0={10} x1={128} r={20} />
      <polyline points={`128,50 ${teeth(50, 1)} 182,55`} />
      <polyline points={`128,90 ${teeth(90, -1)} 182,85`} />
      {/* female fitting body */}
      <rect x="124" y="26" width="104" height="88" stroke={RED} strokeWidth="2" />
      <line x1="186" y1="56" x2="228" y2="56" />
      <line x1="186" y1="84" x2="228" y2="84" />
    </Frame>
  )
}

/** The loop with the usual connection on each side (FWS facility side, TCS rack side). */
export function LoopDiagram() {
  const box = (x: number, label: string, sub?: string) => (
    <g>
      <rect x={x} y="40" width="120" height="60" fill="#fff" stroke={INK} strokeWidth="1.4" />
      <text x={x + 60} y="66" textAnchor="middle" fontSize="13" fontWeight="600" fill={INK}>
        {label}
      </text>
      {sub ? (
        <text x={x + 60} y="84" textAnchor="middle" fontSize="10" fill="#525252">
          {sub}
        </text>
      ) : null}
    </g>
  )
  const joint = (x: number, label: string, color: string) => (
    <g>
      <line x1={x} y1="62" x2={x + 80} y2="62" stroke={color} strokeWidth="4" />
      <line x1={x} y1="78" x2={x + 80} y2="78" stroke={color} strokeWidth="4" />
      <text x={x + 40} y="118" textAnchor="middle" fontSize="10.5" fill={color} fontWeight="600">
        {label}
      </text>
    </g>
  )
  return (
    <svg viewBox="0 0 620 140" role="img" aria-label="Liquid cooling loop: facility water to CDU to TCS manifold and racks" className="h-auto w-full" data-testid="loop-diagram">
      <title>Which connection sits where in a liquid cooling loop</title>
      <rect width="620" height="140" fill="#fff" />
      {box(0, "Facility water", "FWS (primary)")}
      {joint(120, "Flanged / grooved", "#525252")}
      {box(200, "CDU", "heat exchanger + pumps")}
      {joint(320, "Tri-clamp (sanitary)", RED)}
      {box(400, "Row manifold", "TCS (secondary)")}
      <line x1="520" y1="70" x2="560" y2="70" stroke={RED} strokeWidth="4" />
      <rect x="560" y="46" width="56" height="48" fill="#fff" stroke={INK} strokeWidth="1.4" />
      <text x="588" y="74" textAnchor="middle" fontSize="11" fontWeight="600" fill={INK}>
        Racks
      </text>
      <text x="100" y="20" fontSize="10.5" fill="#525252">
        HVAC pipe side
      </text>
      <text x="380" y="20" fontSize="10.5" fill={RED}>
        Sanitary side
      </text>
    </svg>
  )
}

export const CONNECTION_DRAWINGS: Record<ConnectionKey, () => JSX.Element> = {
  tc: TriClampDrawing,
  iline: ILineDrawing,
  bevel: BevelSeatDrawing,
  grv: GroovedDrawing,
  flange: FlangedDrawing,
  npt: NptDrawing,
}
