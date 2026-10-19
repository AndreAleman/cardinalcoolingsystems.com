import { generateDownloadToken, hashDownloadToken, isWellFormedToken } from "../../../modules/cad-request/tokens"
import { TRANSITION_BUILDER, getBuilder } from "../../cpq-shared"
import { cadFiles, downloadStatus, isTokenExpired, toCadDownloadDTO } from "../download"

const NOW = new Date("2026-10-16T17:00:00Z")
const HOUR = 60 * 60 * 1000

const pkg: any = { id: "cadpkg_1", status: "ready", step_key: "cad/x/a.step", pdf_key: "cad/x/a.pdf", step_bytes: 22665, pdf_bytes: 61234 }
const base: any = {
  id: "cadr_1",
  display_id: 7,
  status: "emailed",
  builder_type: "transition",
  part_number: "clmp-fl150-tspool-l12-6-200",
  description: '2" TRANSITION SPOOL 12" OAL TC X 150# FLG T316L',
  configuration: { ...TRANSITION_BUILDER.defaults },
  token_expires_at: new Date(NOW.getTime() + 168 * HOUR),
  download_count: 2,
}

describe("download tokens", () => {
  it("are 32 random bytes in base64url, stored as sha256 hex", () => {
    const t = generateDownloadToken()
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(isWellFormedToken(t)).toBe(true)
    expect(hashDownloadToken(t)).toMatch(/^[0-9a-f]{64}$/)
    expect(generateDownloadToken()).not.toBe(t)
    expect(isWellFormedToken("short")).toBe(false)
    expect(isWellFormedToken("../../etc/passwd")).toBe(false)
  })
})

describe("download link state", () => {
  it("is valid until token_expires_at (7 days), then expired", () => {
    expect(isTokenExpired(base, NOW)).toBe(false)
    expect(isTokenExpired(base, new Date(NOW.getTime() + 168 * HOUR))).toBe(true)
    expect(isTokenExpired({ token_expires_at: null }, NOW)).toBe(true)
  })

  it("maps request + package status", () => {
    expect(downloadStatus(base, pkg, NOW)).toBe("ready")
    expect(downloadStatus({ ...base, status: "ready" }, pkg, NOW)).toBe("ready")
    expect(downloadStatus(base, { ...pkg, status: "generating" }, NOW)).toBe("preparing")
    expect(downloadStatus({ ...base, status: "pending" }, null, NOW)).toBe("preparing")
    expect(downloadStatus({ ...base, status: "review" }, pkg, NOW)).toBe("preparing")
    expect(downloadStatus({ ...base, status: "queued" }, null, NOW)).toBe("queued")
    expect(downloadStatus({ ...base, status: "failed" }, null, NOW)).toBe("failed")
    expect(downloadStatus({ ...base, status: "rejected" }, null, NOW)).toBe("expired")
  })

  it("builds the DTO with files, remaining downloads, display rows and the Share Link; no prices", () => {
    const dto = toCadDownloadDTO(base, pkg, NOW)
    expect(dto).toMatchObject({
      status: "ready",
      builder_type: "transition",
      builder_title: "Transition Spool",
      has_step: true,
      part_number: "clmp-fl150-tspool-l12-6-200",
      display_id: 7,
      downloads_remaining: 18,
      files: [
        { kind: "step", filename: "clmp-fl150-tspool-l12-6-200.step", bytes: 22665 },
        { kind: "pdf", filename: "clmp-fl150-tspool-l12-6-200.pdf", bytes: 61234 },
      ],
    })
    expect(dto.share_path).toBe(TRANSITION_BUILDER.sharePath(TRANSITION_BUILDER.defaults))
    expect(dto.configuration_display[0]).toEqual({ label: "End A", value: expect.any(String) })
    expect(JSON.stringify(dto)).not.toMatch(/price|amount/i)
  })

  it("PDF-only builders: only the PDF, has_step false", () => {
    const kit = getBuilder("cdu-kit")
    const pdfOnly = { ...pkg, step_key: null, step_bytes: null }
    const dto = toCadDownloadDTO({ ...base, builder_type: "cdu-kit", configuration: { ...kit.defaults }, part_number: "kit-cdu-a5ad698f" }, pdfOnly, NOW)
    expect(dto.has_step).toBe(false)
    expect(dto.files).toEqual([{ kind: "pdf", filename: "kit-cdu-a5ad698f.pdf", bytes: 61234 }])
    expect(dto.share_path).toMatch(/^\/build\/cdu-kit\?v=1/)
    expect(cadFiles("x", pdfOnly).map((f) => f.kind)).toEqual(["pdf"])
  })

  it("hides files when not ready; unparseable options fall back to the builder page", () => {
    expect(toCadDownloadDTO({ ...base, status: "queued" }, null, NOW).files).toEqual([])
    const bad = toCadDownloadDTO({ ...base, configuration: { od: 999 } }, pkg, NOW)
    expect(bad.configuration_display).toEqual([])
    expect(bad.share_path).toBe("/build/transition")
  })
})
