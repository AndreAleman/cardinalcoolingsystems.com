// CAD Request emails: the React Email templates render with Cardinal copy and no prices, they are
// registered in the template registry, and the notification wrapper sends one notification per
// recipient to CAD_REQUEST_INBOX_EMAIL (default aleman@cardinalcoolingsystems.com only).

import * as React from "react"
import { render } from "@react-email/render"
import { generateEmailTemplate, EmailTemplates } from "../../../modules/email-notifications/templates"
import { CadRequestLinkTemplate } from "../../../modules/email-notifications/templates/cad-request-link"
import { CadRequestQueuedTemplate } from "../../../modules/email-notifications/templates/cad-request-queued"
import { CadRequestAlertTemplate, cadAlertSubject, type CadRequestAlertKind, type CadRequestAlertProps } from "../../../modules/email-notifications/templates/cad-request-alert"
import { CAD_REFERENCE_ONLY_NOTE } from "../../../modules/email-notifications/templates/cad-request-rows"
import { adminUrl, cadDownloadUrl, cadEmailFrom, cadRequestRecipients, storefrontUrl } from "../cad-email"

const configuration = [
  { label: "End A", value: "TRI-CLAMP FERRULE" },
  { label: "End B", value: "150# RF FLANGE" },
]
const flat = (s: string) => s.replace(/\s+/g, " ")

async function both(el: React.ReactElement) {
  const html = await render(el)
  const text = flat(await render(el, { plainText: true }))
  return { html, text }
}

const linkProps = {
  reference: "CAD-12",
  contactName: "Ada",
  partNumber: "clmp-fl150-tspool-l12-6-200",
  description: '2" TRANSITION SPOOL 12" OAL TC X 150# FLG T316L',
  configuration,
  downloadUrl: "https://cardinalcoolingsystems.com/us/cad/download/tok123",
  quoteUrl: "https://cardinalcoolingsystems.com/us/build/transition?v=1",
}

describe("cad-request-link", () => {
  it("download button, STEP + PDF copy, 7-day note, reference-only note, quote link, no price", async () => {
    const { html, text } = await both(React.createElement(CadRequestLinkTemplate, linkProps))
    expect(text).toContain("Hi Ada,")
    expect(text).toContain("CAD-12")
    expect(text).toContain("a 3D STEP model and a PDF drawing")
    expect(html).toContain("Download CAD files")
    expect(html).toContain('href="https://cardinalcoolingsystems.com/us/cad/download/tok123"')
    expect(text).toContain("The link works for 7 days.")
    expect(text).toContain(CAD_REFERENCE_ONLY_NOTE)
    expect(text).toMatch(/Need pricing\? Request a quote/)
    expect(text).toContain("cardinalcoolingsystems.com")
    expect(text).not.toMatch(/sanitube/i)
    expect(text).not.toContain("$")
  })

  it("PDF-only builders: no STEP promised; stocked-part STEPs on request", async () => {
    const { text } = await both(React.createElement(CadRequestLinkTemplate, { ...linkProps, hasStep: false }))
    expect(text).toContain("a PDF drawing with the bill of materials")
    expect(text).toContain("STEP files for the stocked parts are available on request")
    expect(text).not.toContain("3D STEP model and")
  })

  it("falls back to 'Hi there' without a name or a quote link", async () => {
    const { text } = await both(React.createElement(CadRequestLinkTemplate, { ...linkProps, contactName: undefined, quoteUrl: undefined }))
    expect(text).toContain("Hi there,")
    expect(text).not.toContain("Request a quote")
  })
})

describe("cad-request-queued", () => {
  it("without review: the link within 1 business day", async () => {
    const { text } = await both(React.createElement(CadRequestQueuedTemplate, { ...linkProps }))
    expect(text).toContain("You'll get the download link within 1 business day.")
    expect(text).not.toContain("engineering team")
  })

  it("CAD Review: Cardinal's engineering team reviews every drawing, normally within 1 business day", async () => {
    const { text } = await both(React.createElement(CadRequestQueuedTemplate, { ...linkProps, review: true }))
    expect(text).toContain("Cardinal's engineering team reviews every CAD drawing before release.")
    expect(text).toContain("normally within 1 business day")
    expect(text).not.toContain("You'll get the download link within 1 business day.")
  })
})

describe("cad-request-alert", () => {
  const base: CadRequestAlertProps = {
    kind: "new",
    reference: "CAD-13",
    builderTitle: "Transition Spool",
    contactName: "Ada Lovelace",
    companyName: "Acme CDU",
    email: "ada@acme-cdu.com",
    partNumber: "clmp-fl150-tspool-l12-6-200",
    description: "desc",
    configuration,
    clientIp: "203.0.113.9",
    ipSource: "forwarded",
    emailRequests30d: { used: 7, limit: 10 },
    generationsToday: { used: 10, cap: 10 },
    reviewUrl: "https://backend.cardinalcoolingsystems.com/app/cad-requests/cadr_1",
    releaseUrl: "https://backend.cardinalcoolingsystems.com/app/cad-requests/cadr_1",
  }

  it.each<[CadRequestAlertKind, RegExp, RegExp]>([
    ["new", /^New CAD Request CAD-13 — Acme CDU$/, /emailed them the download link/],
    ["allowance_reached", /^CAD Allowance reached — ada@acme-cdu\.com$/, /limit of 10 CAD Requests in 30 days/],
    ["queued", /^CAD Request CAD-13 queued — Acme CDU$/, /9:00 Eastern on the next business day/],
    ["failed", /^CAD Request CAD-13 failed — clmp-fl150-tspool-l12-6-200$/, /retry automatically/],
    ["review", /^CAD Request awaiting review: clmp-fl150-tspool-l12-6-200 — Acme CDU$/, /waiting for your review/],
  ])("%s: subject, wording, counters, buttons", async (kind, subject, wording) => {
    const props = { ...base, kind, error: kind === "failed" ? "boom" : undefined, attempts: 1 }
    expect(cadAlertSubject(props)).toMatch(subject)
    const { html, text } = await both(React.createElement(CadRequestAlertTemplate, props))
    expect(text).toMatch(wording)
    if (kind !== "allowance_reached") expect(text).toContain("Transition Spool")
    expect(text).toContain("CAD Requests from this email in 30 days: 7/10")
    expect(text).toContain("New generations today: 10/10")
    expect(text).toContain("203.0.113.9 (forwarded)")
    expect(html).toContain('href="https://backend.cardinalcoolingsystems.com/app/cad-requests/cadr_1"')
    expect(html).toContain(kind === "review" ? "Review files" : ">Review<")
    if (kind === "queued") expect(html).toContain("Release now")
    else expect(html).not.toContain("Release now")
    if (kind === "failed") expect(text).toContain("boom")
    expect(text).not.toContain("$")
  })

  it("a queued alert with review on says Generate now", async () => {
    const { html, text } = await both(React.createElement(CadRequestAlertTemplate, { ...base, kind: "queued", review: true }))
    expect(text).toMatch(/then wait for your review/)
    expect(html).toContain("Generate now")
    expect(html).not.toContain("Release now")
  })
})

describe("template registry and notification wrapper", () => {
  it("registers the three CAD templates with data guards", () => {
    expect(EmailTemplates.CAD_REQUEST_LINK).toBe("cad-request-link")
    expect(EmailTemplates.CAD_REQUEST_QUEUED).toBe("cad-request-queued")
    expect(EmailTemplates.CAD_REQUEST_ALERT).toBe("cad-request-alert")
    expect(generateEmailTemplate("cad-request-link", linkProps)).toBeTruthy()
    expect(generateEmailTemplate("cad-request-queued", linkProps)).toBeTruthy()
    expect(() => generateEmailTemplate("cad-request-alert", { kind: "review" })).toThrow(/Invalid data/)
  })

  it("sends one notification per recipient through createNotifications", async () => {
    const createNotifications = jest.fn(async () => [])
    const email = cadEmailFrom({ createNotifications })
    await email.sendCadRequestAlert(["a@x.com", "b@x.com"], { kind: "review" } as any)
    await email.sendCadRequestLink("ada@acme-cdu.com", linkProps)
    expect((createNotifications.mock.calls as any[])[0][0]).toEqual([
      { to: "a@x.com", channel: "email", template: "cad-request-alert", data: { kind: "review" } },
      { to: "b@x.com", channel: "email", template: "cad-request-alert", data: { kind: "review" } },
    ])
    expect((createNotifications.mock.calls as any[])[1][0][0]).toMatchObject({ to: "ada@acme-cdu.com", template: "cad-request-link" })
  })
})

describe("recipients and URLs", () => {
  it("defaults to aleman@cardinalcoolingsystems.com only; reads CAD_REQUEST_INBOX_EMAIL (comma-separated)", () => {
    expect(cadRequestRecipients({} as any)).toEqual(["aleman@cardinalcoolingsystems.com"])
    expect(cadRequestRecipients({ CAD_REQUEST_INBOX_EMAIL: " a@x.com , b@y.com ," } as any)).toEqual(["a@x.com", "b@y.com"])
  })
  it("builds storefront (/us) and admin (/app) links", () => {
    expect(cadDownloadUrl("tok", {} as any)).toBe("https://cardinalcoolingsystems.com/us/cad/download/tok")
    expect(storefrontUrl("/build/transition?v=1", { STOREFRONT_URL: "http://localhost:8033/" } as any)).toBe(
      "http://localhost:8033/us/build/transition?v=1",
    )
    expect(adminUrl("/cad-requests/x", { BACKEND_URL: "http://localhost:9053" } as any)).toBe("http://localhost:9053/app/cad-requests/x")
  })
})
