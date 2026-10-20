// Open Graph / Twitter card for the builder section (1200×630): the page title over a simplified
// schematic, in the site's dark style. Drawn here in ImageResponse-safe JSX (flex layout, inline
// SVG shapes, labels as positioned divs; no CSS grid or classes), so it doesn't depend on the builder's interactive schematic.

import { ImageResponse } from "next/og"

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

const BG = "#0a0a0a"
const RED = "#E3000F"
const STEEL = "#c9ced6"
const DIM = "rgba(255,255,255,0.55)"

export type OgSchematic = "kit" | "manifold"

/** Satori can't draw SVG <text>, so labels are absolutely placed divs centred on (x, baseline y). */
function Label({ x, y, color, size, children }: { x: number; y: number; color: string; size: number; children: React.ReactNode }) {
  const w = 520
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - Math.round(size * 0.9),
        width: w,
        display: "flex",
        justifyContent: "center",
        fontSize: size,
        lineHeight: 1,
        color,
      }}
    >
      {children}
    </div>
  )
}

/** CDU port → hose → far-end fitting, with size labels. */
function KitSchematic() {
  return (
    <div style={{ position: "relative", display: "flex", width: 1040, height: 250 }}>
      <svg width="1040" height="250" viewBox="0 0 1040 250" xmlns="http://www.w3.org/2000/svg">
        {/* CDU */}
        <rect x="10" y="40" width="200" height="170" rx="6" fill="none" stroke={STEEL} strokeWidth="4" />
        {/* port ferrule + clamp */}
        <rect x="210" y="105" width="26" height="40" fill={STEEL} />
        <rect x="236" y="98" width="14" height="54" fill={RED} />
        <rect x="250" y="105" width="26" height="40" fill={STEEL} />
        {/* braided hose */}
        <path d="M276 125 C 380 40, 470 210, 580 125 S 760 40, 790 125" fill="none" stroke={STEEL} strokeWidth="22" strokeLinecap="round" />
        <path d="M276 125 C 380 40, 470 210, 580 125 S 760 40, 790 125" fill="none" stroke={BG} strokeWidth="6" strokeDasharray="6 10" />
        {/* far-end fitting: tri-clamp x flange */}
        <rect x="790" y="105" width="26" height="40" fill={STEEL} />
        <rect x="816" y="98" width="14" height="54" fill={RED} />
        <rect x="830" y="105" width="60" height="40" fill={STEEL} />
        <rect x="890" y="70" width="18" height="110" fill={STEEL} />
        <rect x="912" y="70" width="18" height="110" fill={STEEL} />
        <rect x="930" y="105" width="100" height="40" fill="none" stroke={STEEL} strokeWidth="4" />
        
      </svg>
        <Label x={110} y={132} color={STEEL} size={34}>CDU</Label>
        <Label x={243} y={200} color={DIM} size={24}>CDU port</Label>
        <Label x={243} y={232} color="#ffffff" size={26}>1&quot; – 4&quot; TC</Label>
        <Label x={533} y={30} color={DIM} size={24}>Hose or welded spool</Label>
        <Label x={910} y={212} color={DIM} size={24}>Far end</Label>
        <Label x={910} y={244} color="#ffffff" size={26}>TC · flange · NPT · grooved</Label>
    </div>
  )
}

/** Header with drops at a fixed pitch, fill point, labels. */
function ManifoldSchematic() {
  const drops = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <div style={{ position: "relative", display: "flex", width: 1040, height: 250 }}>
      <svg width="1040" height="250" viewBox="0 0 1040 250" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="70" width="900" height="44" rx="4" fill={STEEL} />
        <rect x="940" y="62" width="16" height="60" fill={RED} />
        <rect x="956" y="70" width="40" height="44" fill={STEEL} />
        {drops.map((i) => (
          <g key={i}>
            <rect x={110 + i * 105} y="114" width="20" height="70" fill={STEEL} />
            <rect x={104 + i * 105} y="184" width="32" height="10" fill={RED} />
          </g>
        ))}
        <rect x="70" y="40" width="16" height="30" fill={STEEL} />
        <rect x="64" y="32" width="28" height="8" fill={RED} />
      </svg>
        <Label x={78} y={22} color={DIM} size={22}>1&quot; fill</Label>
        <Label x={490} y={40} color="#ffffff" size={26}>Header 3&quot; – 8&quot;</Label>
        <Label x={490} y={236} color={DIM} size={24}>Drops 1&quot; or 1.5&quot; at your pitch · 316L / 304L</Label>
    </div>
  )
}

export function builderOgImage({ eyebrow, title, schematic = "kit" }: { eyebrow: string; title: string; schematic?: OgSchematic }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BG,
          padding: "56px 80px 48px",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: RED, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ display: "flex", marginTop: 16, fontSize: title.length > 48 ? 50 : 58, lineHeight: 1.1, maxWidth: 1040 }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {schematic === "manifold" ? <ManifoldSchematic /> : <KitSchematic />}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: DIM }}>
          <span>Cardinal Cooling Systems</span>
          <span>cardinalcoolingsystems.com</span>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  )
}
