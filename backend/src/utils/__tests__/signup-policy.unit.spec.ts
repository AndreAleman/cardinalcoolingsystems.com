import {
  domainsFromOutreachCsv,
  emailDomain,
  isAllowlistable,
  normalizeDomain,
  planDomainImport,
  signupStatusFor,
} from "../signup-policy";

const listed = (...domains: string[]) => (d: string) => domains.includes(d);

describe("emailDomain", () => {
  it("lowercases and trims", () => {
    expect(emailDomain("  Ada@Acme.COM ")).toBe("acme.com");
  });
  it("rejects junk", () => {
    expect(emailDomain("nope")).toBeNull();
    expect(emailDomain("@acme.com")).toBeNull();
    expect(emailDomain("ada@localhost")).toBeNull();
    expect(emailDomain("ada@acme..com")).toBeNull();
    expect(emailDomain(null)).toBeNull();
  });
  it("uses the last @", () => {
    expect(emailDomain('"a@b"@acme.com')).toBe("acme.com");
  });
});

describe("normalizeDomain", () => {
  it("drops a trailing dot", () => {
    expect(normalizeDomain("Acme.com.")).toBe("acme.com");
  });
  it("rejects urls and paths", () => {
    expect(normalizeDomain("https://acme.com")).toBeNull();
    expect(normalizeDomain("acme.com/x")).toBeNull();
  });
});

describe("signupStatusFor", () => {
  it("approves a listed domain, any case", () => {
    expect(signupStatusFor("Buyer@ATKORE.com", listed("atkore.com"))).toBe("approved");
  });
  it("approves a colleague of the emailed contact (domain match)", () => {
    expect(signupStatusFor("someone.else@atkore.com", listed("atkore.com"))).toBe("approved");
  });
  it("holds an unlisted domain as pending", () => {
    expect(signupStatusFor("buyer@unknown.com", listed("atkore.com"))).toBe("pending");
  });
  it("does not wildcard subdomains either way", () => {
    expect(signupStatusFor("a@mail.atkore.com", listed("atkore.com"))).toBe("pending");
    expect(signupStatusFor("a@atkore.com", listed("mail.atkore.com"))).toBe("pending");
  });
  it("does not match lookalike suffixes", () => {
    expect(signupStatusFor("a@notatkore.com", listed("atkore.com"))).toBe("pending");
    expect(signupStatusFor("a@atkore.com.evil.io", listed("atkore.com"))).toBe("pending");
  });
  it("never approves free-mail, even if it got listed", () => {
    expect(signupStatusFor("a@gmail.com", listed("gmail.com"))).toBe("pending");
  });
  it("holds an unusable email as pending", () => {
    expect(signupStatusFor("", listed("atkore.com"))).toBe("pending");
    expect(signupStatusFor(undefined, listed("atkore.com"))).toBe("pending");
  });
});

describe("isAllowlistable", () => {
  it("refuses free-mail and null", () => {
    expect(isAllowlistable("outlook.com")).toBe(false);
    expect(isAllowlistable(null)).toBe(false);
    expect(isAllowlistable("atkore.com")).toBe(true);
  });
});

describe("domainsFromOutreachCsv", () => {
  it("reads the Email column by name, dedupes, sorts", () => {
    const csv = [
      "First Name,Last Name,Company Name,Email",
      "Zion,Chatman,Atkore,zchatman@atkore.com",
      'Zach,Boyum,"EPCO, Inc.",ZBoyum@EngProducts.com',
      "Ann,Other,Atkore,ann@atkore.com",
    ].join("\r\n");
    expect(domainsFromOutreachCsv(csv).domains).toEqual(["atkore.com", "engproducts.com"]);
  });
  it("skips free-mail and invalid rows and says why", () => {
    const csv = "Email,Name\nbob@gmail.com,Bob\nnot-an-email,X\nok@acme.com,Ok\n";
    const r = domainsFromOutreachCsv(csv);
    expect(r.domains).toEqual(["acme.com"]);
    expect(r.skipped).toEqual([
      { value: "bob@gmail.com", reason: "free_mail" },
      { value: "not-an-email", reason: "invalid" },
    ]);
  });
  it("throws without an Email column", () => {
    expect(() => domainsFromOutreachCsv("Name\nBob\n")).toThrow(/Email/);
  });
});

describe("planDomainImport", () => {
  it("adds new, skips listed, never re-lists a declined company's domain", () => {
    expect(
      planDomainImport(["a.com", "b.com", "c.com", "a.com"], ["b.com"], ["c.com"])
    ).toEqual({ add: ["a.com"], already: ["b.com"], blocked: ["c.com"] });
  });
  it("a declined domain stays blocked even if it is still listed", () => {
    expect(planDomainImport(["c.com"], ["c.com"], ["c.com"]).blocked).toEqual(["c.com"]);
  });
});
