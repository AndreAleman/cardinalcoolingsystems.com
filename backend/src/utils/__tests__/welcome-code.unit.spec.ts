import { welcomeCodeFor } from "../welcome-code";

describe("welcomeCodeFor", () => {
  const issued = new Date("2026-08-25T15:00:00Z");

  it("expires exactly 30 days after issue", () => {
    expect(welcomeCodeFor(issued, () => 0).ends_at.toISOString()).toBe(
      "2026-09-24T15:00:00.000Z"
    );
  });

  it("is WELCOME- plus six unambiguous characters", () => {
    const { code } = welcomeCodeFor(issued, () => 0);
    expect(code).toBe("WELCOME-AAAAAA");
    expect(welcomeCodeFor(issued).code).toMatch(/^WELCOME-[A-HJ-NP-Z2-9]{6}$/);
  });

  it("never uses 0, O, 1 or I", () => {
    const { code } = welcomeCodeFor(issued, () => 0.999999);
    expect(code).toBe("WELCOME-999999");
    expect(code.replace("WELCOME-", "")).not.toMatch(/[0O1I]/);
  });
});
