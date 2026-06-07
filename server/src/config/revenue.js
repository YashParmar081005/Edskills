/**
 * Platform revenue split.
 *
 * For every paid enrollment the platform (admin) keeps a fee and the rest is
 * credited to the course's instructor.
 *   - PLATFORM_FEE_RATE  → admin's cut (10%)
 *   - INSTRUCTOR_RATE    → instructor's cut (90%)
 */
export const PLATFORM_FEE_RATE = 0.1;
export const INSTRUCTOR_RATE = 1 - PLATFORM_FEE_RATE; // 0.9

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Split a gross amount into the platform fee (admin) and instructor earning.
 * @param {number} amount gross amount paid by the student (major units)
 * @returns {{ platformFee:number, instructorEarning:number }}
 */
export function splitRevenue(amount = 0) {
  const gross = Number(amount) || 0;
  const platformFee = round2(gross * PLATFORM_FEE_RATE);
  const instructorEarning = round2(gross - platformFee);
  return { platformFee, instructorEarning };
}
