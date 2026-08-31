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
