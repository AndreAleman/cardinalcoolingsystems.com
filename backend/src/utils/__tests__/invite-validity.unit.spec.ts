import { inviteExpiry, inviteProblem } from "../invite-validity";

describe("inviteProblem", () => {
  const now = new Date("2026-08-26T12:00:00Z");
  const open = { email: "bo@acme.test", expires_at: "2026-09-02T12:00:00Z", accepted_at: null };

  it("an open invite for the right email has no problem", () => {
    expect(inviteProblem(open, "bo@acme.test", now)).toBeNull();
    expect(inviteProblem(open, "  Bo@Acme.Test ", now)).toBeNull();
  });

  it("a used invite is already_accepted", () => {
    expect(inviteProblem({ ...open, accepted_at: "2026-08-25T00:00:00Z" }, "bo@acme.test", now)).toBe("already_accepted");
  });

  it("a stale invite is expired", () => {
    expect(inviteProblem(open, "bo@acme.test", new Date("2026-09-02T12:00:00Z"))).toBe("expired");
  });

  it("someone else's email is wrong_email", () => {
    expect(inviteProblem(open, "mallory@evil.test", now)).toBe("wrong_email");
  });

  it("nothing is not_found", () => {
    expect(inviteProblem(null, "bo@acme.test", now)).toBe("not_found");
  });
});

describe("inviteExpiry", () => {
  it("is 7 days after issue", () => {
    expect(inviteExpiry(new Date("2026-08-26T12:00:00Z")).toISOString()).toBe("2026-09-02T12:00:00.000Z");
  });
});
