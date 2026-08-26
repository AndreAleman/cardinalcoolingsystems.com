import { isWelcomeCodeLive } from "../welcome-code-live";

describe("isWelcomeCodeLive", () => {
  const now = new Date("2026-09-01T00:00:00Z");
  const live = {
    campaign: { ends_at: "2026-09-24T15:00:00Z", budget: { limit: 1, used: 0 } },
  };

  it("is live before expiry and before use", () => {
    expect(isWelcomeCodeLive(live, now)).toBe(true);
  });

  it("is dead once used", () => {
    expect(
      isWelcomeCodeLive({ campaign: { ...live.campaign, budget: { limit: 1, used: 1 } } }, now)
    ).toBe(false);
  });

  it("is dead after 30 days", () => {
    expect(isWelcomeCodeLive(live, new Date("2026-09-24T15:00:00Z"))).toBe(false);
  });

  it("is dead when the promotion is gone", () => {
    expect(isWelcomeCodeLive(null, now)).toBe(false);
  });
});
