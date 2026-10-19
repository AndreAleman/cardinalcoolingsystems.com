import { MedusaError } from "@medusajs/framework/utils"
import { assertBusinessEmail, BUSINESS_EMAIL_MESSAGE, businessEmailDomain, isBusinessEmail } from "../business-email"

describe("isBusinessEmail", () => {
  it.each([
    "jane@gmail.com",
    "JANE@Gmail.Com",
    "x@googlemail.com",
    "x@yahoo.com",
    "x@mail.yahoo.co.uk",
    "x@outlook.com",
    "x@hotmail.fr",
    "x@live.com",
    "x@aol.com",
    "x@icloud.com",
    "x@me.com",
    "x@proton.me",
    "x@protonmail.ch",
    "x@gmx.de",
    "x@zoho.com",
    "x@yandex.ru",
    "x@hey.com",
    "x@qq.com",
    "x@comcast.net",
    // Cardinal's signup list (ADR-0007) also rejects these
    "x@126.com",
    "x@bellsouth.net",
    "x@tuta.io",
  ])("rejects free webmail %s", (email) => {
    expect(isBusinessEmail(email)).toBe(false)
  })

  it.each(["ada@acme-cdu.com", "aleman@cardinalcoolingsystems.com", "buyer@boydcorp.co.uk", "x@gmailer.com", "x@notgmail.com", "x@mymail.com"])(
    "accepts company domain %s",
    (email) => {
      expect(isBusinessEmail(email)).toBe(true)
    },
  )

  it("rejects malformed addresses and extracts the domain", () => {
    for (const e of ["", "nodomain", "x@localhost", "@acme.com"]) expect(isBusinessEmail(e)).toBe(false)
    expect(businessEmailDomain(" Jane@Acme.COM ")).toBe("acme.com")
  })
})

describe("assertBusinessEmail", () => {
  it("throws INVALID_DATA with the friendly message for webmail, passes a company address", () => {
    expect.assertions(3)
    try {
      assertBusinessEmail("jane@gmail.com")
    } catch (e) {
      expect((e as MedusaError).type).toBe(MedusaError.Types.INVALID_DATA)
      expect((e as MedusaError).message).toBe(BUSINESS_EMAIL_MESSAGE)
    }
    expect(() => assertBusinessEmail("buyer@acme-cdu.com")).not.toThrow()
  })
})
