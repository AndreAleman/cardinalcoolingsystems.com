---
status: accepted
---
# One storefront host; Company is resolved from the signed-in Team Member, never from the hostname or a header

Accurate Forklift routes each Company to its own subdomain and passes an `x-company-id` header. Cardinal will not: every request resolves the Company server-side by walking the authenticated customer to their Team Member record. This removes the tenant middleware, the subdomain column, and the cookie-forgery surface, at the cost of no per-Company branding on the URL.
