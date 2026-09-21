---
status: accepted
---
# Anyone can create a Company, but Cardinal must approve it before the Dashboard unlocks

We considered fully self-serve companies (Accurate Forklift's sibling build does the opposite — operator-only). We chose the middle: signup creates a Pending Company immediately, a Welcome Code is issued at once so the visitor gets value, and Cardinal flips the Company to Approved in Medusa Admin. This keeps per-Company pricing and credit decisions in Cardinal's hands without turning the marketing page into a dead end.

_Amended by ADR-0007: signups from an Approved Domain skip the wait and are born Approved; a Pending signup gets its Welcome Code at approval, not at signup._
