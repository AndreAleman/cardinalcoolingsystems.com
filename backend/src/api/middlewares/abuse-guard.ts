import crypto from "node:crypto";
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import {
  clientIpFrom,
  honeypotTripped,
  isOverLimit,
  RATE_RULES,
  RateRuleName,
} from "../../utils/abuse-policy";
import { hit } from "../../lib/rate-limit";
import { verifyTurnstile } from "../../lib/turnstile";

/*
  Bot protection for the public write endpoints. See
  utils/abuse-policy.ts for the rules and why every guard fails open.

  Trust: the storefront server proves itself with x-storefront-secret
  (STOREFRONT_SHARED_SECRET on both services). Only then do we believe
  its x-client-ip, and only then may it reach the signup endpoints.
*/

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

const header = (req: MedusaRequest, name: string): string | undefined => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};

export function isFromStorefront(req: MedusaRequest): boolean {
  const expected = process.env.STOREFRONT_SHARED_SECRET;
  const got = header(req, "x-storefront-secret");
  return !!expected && !!got && safeEqual(got, expected);
}

export function requestIp(req: MedusaRequest): string {
  return clientIpFrom({
    headers: req.headers as any,
    socketIp: req.socket?.remoteAddress,
    trusted: isFromStorefront(req),
  });
}

const logger = (req: MedusaRequest) => {
  try {
    return req.scope.resolve("logger") as { error: (m: string) => void; warn: (m: string) => void };
  } catch {
    return console;
  }
};

let lastSecretShout = 0;

/*
  Signup endpoints are only for the storefront server. The publishable
  key is public, so without this a script can drive register → customer
  → company straight against the backend. No secret configured → OFF,
  loudly (never lock real buyers out over a missing env var).
*/
export function requireStorefront(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (!process.env.STOREFRONT_SHARED_SECRET) {
    const now = Date.now();
    if (process.env.NODE_ENV === "production" && now - lastSecretShout > 60_000) {
      lastSecretShout = now;
      logger(req).error(
        "[abuse-guard] STOREFRONT_SHARED_SECRET is not set — signup endpoints are reachable directly."
      );
    }
    return next();
  }
  if (!isFromStorefront(req)) {
    res.status(403).json({ code: "storefront_only", message: "Please sign up on the website." });
    return;
  }
  next();
}

export function rateLimit(name: RateRuleName) {
  const rule = RATE_RULES[name];
  return async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const ip = requestIp(req);
    const count = await hit(`${name}:${ip}`, rule, logger(req));
    if (count !== null && isOverLimit(count, rule)) {
      logger(req).warn(`[abuse-guard] rate limit "${name}" hit by ${ip} (${count}/${rule.limit})`);
      res.setHeader("Retry-After", String(rule.windowSec));
      res.status(429).json({
        code: "rate_limited",
        message: "Too many attempts. Please wait a while and try again, or email info@cardinalcoolingsystems.com.",
      });
      return;
    }
    next();
  };
}

/* Token from the x-turnstile-token header, or `turnstile_token` in the body. */
export async function requireTurnstile(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const token =
    header(req, "x-turnstile-token") ?? ((req.body as any)?.turnstile_token as string | undefined);
  const verdict = await verifyTurnstile(token, requestIp(req), logger(req));
  if (verdict === "rejected") {
    res.status(403).json({
      code: "challenge_failed",
      message:
        "We could not verify your browser. Please reload the page and try again, or email info@cardinalcoolingsystems.com.",
    });
    return;
  }
  next();
}

/*
  A tripped honeypot gets a calm 200 and nothing happens: telling a bot
  it was caught only teaches it.
*/
export function honeypot(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (honeypotTripped(req.body)) {
    logger(req).warn(`[abuse-guard] honeypot tripped by ${requestIp(req)} on ${req.path}`);
    res.json({ success: true });
    return;
  }
  next();
}
