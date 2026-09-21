---
status: accepted
---
# Bot protection is layered, enforced on the backend, and fails open

The public write endpoints had no anti-abuse layer: no challenge, no rate limit, and the signup chain (register → create customer → create Company) could be driven straight against the backend with the public publishable key. Another project of ours was hit by bots this way. ADR-0007 already stopped Cardinal emailing unvetted addresses; this closes the rest.

Four layers, outermost first:

1. **Turnstile challenge** (Cloudflare, invisible unless it wants a click) on register, invite-accept, and every form that posts to `/store/contact`. Verified on the backend, where the secret lives.
2. **Honeypot**: an off-screen `website` field and a 1.5 s floor on time-to-submit. A tripped trap gets a calm `200` and nothing is sent. Telling a bot it was caught only teaches it.
3. **Per-IP rate limits**, in Redis: register 5/h, create Company 3/h, contact 10/h, login 20 per 15 min.
4. **Cap on signup emails to Cardinal**: 20 an hour, then one "volume is unusually high" notice, then silence. Every Company is still listed in Medusa Admin. One email per signup: the separate "New Customer Registration" email is now only sent when an account has no Company after a 90 s grace period.

## Signup is storefront-only

Signup and login run as storefront **server actions**, so the backend sees the storefront server's address for every buyer. A naive per-IP limit would throttle all real buyers as one. The backend sits directly on Railway's edge, not behind Cloudflare, so client-supplied address headers cannot be trusted either.

So the storefront forwards the buyer's address (`x-client-ip`, taken from Cloudflare's `cf-connecting-ip`) and proves itself with `x-storefront-secret` (`STOREFRONT_SHARED_SECRET`, the same value on both services, server-only). The backend believes `x-client-ip` **only** with a valid secret, and register / create-customer / create-Company refuse requests without it. A bot rotating `x-client-ip` gains nothing. The contact forms post from the browser, so they are limited by Railway's `x-real-ip`.

## Everything fails open

The contact form is the conversion event and the revenue path. A guard whose dependency is missing must never take it down:

- no `TURNSTILE_SECRET_KEY`, or Cloudflare unreachable → challenge skipped, error logged (at most once a minute);
- no `STOREFRONT_SHARED_SECRET` → storefront-only check skipped, error logged;
- Redis down → request allowed, error logged; no `REDIS_URL` → in-process counter;
- no `NEXT_PUBLIC_TURNSTILE_SITE_KEY` → no widget rendered.

The cost is that a misconfiguration is silent to buyers, so the log lines are loud and the rollout checklist sets all three variables together.

## Performance

Cold-email landing pages must stay fast. Nothing from Cloudflare loads until the visitor first touches a form.

## Configuration

| Variable | Service | Notes |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Backend | from the Cloudflare Turnstile site |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Storefront | same Turnstile site; build-time |
| `STOREFRONT_SHARED_SECRET` | Backend **and** Storefront | any long random string, identical on both |
| `SIGNUP_COMPANY_GRACE_MS` | Backend | optional, default 90000 |

Set the site key and the secret key **together**: a backend that demands a token the storefront never sends would reject every submit.

Rules: `backend/src/utils/abuse-policy.ts`. Guards: `backend/src/api/middlewares/abuse-guard.ts`. Storefront: `storefront/src/lib/data/storefront-trust.ts`, `storefront/src/modules/common/components/bot-guard`.
