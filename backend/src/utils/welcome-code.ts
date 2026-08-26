export const WELCOME_CODE_PERCENT = 10;
export const WELCOME_CODE_DAYS = 30;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export type WelcomeCode = {
  code: string;
  ends_at: Date;
};

/*
  Pure seam: what a Welcome Code is. One per Company, 10% off, works
  once, any order size, expires 30 days after issue. `random` is
  injectable so tests are deterministic.
*/
export function welcomeCodeFor(
  issuedAt: Date,
  random: () => number = Math.random
): WelcomeCode {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  const ends_at = new Date(issuedAt.getTime());
  ends_at.setUTCDate(ends_at.getUTCDate() + WELCOME_CODE_DAYS);
  return { code: `WELCOME-${suffix}`, ends_at };
}
