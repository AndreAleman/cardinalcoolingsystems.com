const { MetadataStorage } = require("@mikro-orm/core");
MetadataStorage.clear();

// Tests must never send real email: with these empty, medusa-config
// registers no notification provider and every notify step no-ops.
// Empty string (not delete): the app boot re-runs loadEnv, and dotenv
// only fills vars that are UNSET — an empty value survives the reload.
// (A run with backend/.env leaking through burned the Resend daily
// quota and emailed real addresses.)
process.env.RESEND_API_KEY = "";
process.env.RESEND_FROM_EMAIL = "";
process.env.SENDGRID_API_KEY = "";
process.env.SENDGRID_FROM_EMAIL = "";

// Bot protection: every spec talks from 127.0.0.1, so the per-IP limits
// would trip by accident. The abuse-guard spec switches them back on.
process.env.RATE_LIMIT_DISABLED = "1";
// The "registered without a Company" email waits out a grace period on
// a timer; push it past the life of any suite.
process.env.SIGNUP_COMPANY_GRACE_MS = "86400000";
process.env.TURNSTILE_SECRET_KEY = "";
process.env.STOREFRONT_SHARED_SECRET = "";
