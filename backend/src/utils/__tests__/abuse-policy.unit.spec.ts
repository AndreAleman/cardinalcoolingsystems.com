import {
  clientIpFrom,
  honeypotTripped,
  isOverLimit,
  mailCapVerdict,
  RATE_RULES,
} from "../abuse-policy";

describe("clientIpFrom", () => {
  const headers = { "x-client-ip": "203.0.113.9", "x-real-ip": "198.51.100.7" };
  it("believes the storefront's forwarded address only when trusted", () => {
    expect(clientIpFrom({ headers, trusted: true })).toBe("203.0.113.9");
    expect(clientIpFrom({ headers, trusted: false })).toBe("198.51.100.7");
  });
  it("ignores a forwarded value that is not an IP", () => {
    expect(clientIpFrom({ headers: { ...headers, "x-client-ip": "evil; drop" }, trusted: true })).toBe("198.51.100.7");
  });
  it("falls back to x-forwarded-for's first hop, then the socket", () => {
    expect(clientIpFrom({ headers: { "x-forwarded-for": "192.0.2.1, 10.0.0.1" }, trusted: false })).toBe("192.0.2.1");
    expect(clientIpFrom({ headers: {}, socketIp: "::1", trusted: false })).toBe("::1");
    expect(clientIpFrom({ headers: {}, trusted: false })).toBe("unknown");
  });
  it("accepts IPv6", () => {
    expect(clientIpFrom({ headers: { "x-real-ip": "2001:db8::1" }, trusted: false })).toBe("2001:db8::1");
  });
});

describe("honeypotTripped", () => {
  it("trips on a filled trap field", () => {
    expect(honeypotTripped({ website: "http://spam" })).toBe(true);
  });
  it("trips on an inhumanly fast submit", () => {
    expect(honeypotTripped({ elapsed_ms: 200 })).toBe(true);
  });
  it("passes a normal human submit, and a body without the fields", () => {
    expect(honeypotTripped({ website: "", elapsed_ms: 9000 })).toBe(false);
    expect(honeypotTripped({ name: "Ada" })).toBe(false);
    expect(honeypotTripped(undefined)).toBe(false);
  });
});

describe("rate rules", () => {
  it("are the agreed numbers", () => {
    expect(RATE_RULES.register).toEqual({ limit: 5, windowSec: 3600 });
    expect(RATE_RULES.company).toEqual({ limit: 3, windowSec: 3600 });
    expect(RATE_RULES.contact).toEqual({ limit: 10, windowSec: 3600 });
    expect(RATE_RULES.login).toEqual({ limit: 20, windowSec: 900 });
  });
  it("the Nth request is allowed, the N+1th is not", () => {
    expect(isOverLimit(3, RATE_RULES.company)).toBe(false);
    expect(isOverLimit(4, RATE_RULES.company)).toBe(true);
  });
});

describe("mailCapVerdict", () => {
  it("sends 20, then one flood notice, then drops", () => {
    expect(mailCapVerdict(1)).toBe("send");
    expect(mailCapVerdict(20)).toBe("send");
    expect(mailCapVerdict(21)).toBe("send_flood_notice");
    expect(mailCapVerdict(22)).toBe("drop");
    expect(mailCapVerdict(500)).toBe("drop");
  });
});
