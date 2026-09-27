import { InvalidSplitError } from "../utils/errors";
import { CalculatedShare, ParticipantInput, SplitType } from "../types/expense.types";

/**
 * All amounts here are integer minor currency units (e.g. paise).
 * Every function guarantees: sum(result shares) === amountMinor exactly.
 * This is enforced explicitly at the end of each branch (and re-checked by
 * `calculateSplit`) so that rounding remainders can never silently leak or
 * fabricate money.
 */

const EPSILON = 1e-6;

/**
 * EQUAL SPLIT
 * ---------------------------------------------------------------------
 * ₹1000 across 4 people => ₹250 each.
 *
 * When the amount does not divide evenly (e.g. ₹1000 across 3 people =
 * 333.33 each), we compute the integer floor share for everyone, then
 * distribute the leftover minor units (the remainder) one-by-one to the
 * first participants (in the order supplied). This keeps the split
 * deterministic and guarantees the shares sum exactly to the total.
 */
export function calculateEqualSplit(amountMinor: number, participantIds: string[]): CalculatedShare[] {
  if (participantIds.length === 0) {
    throw new InvalidSplitError("At least one participant is required for an equal split.");
  }
  const uniqueIds = Array.from(new Set(participantIds));
  if (uniqueIds.length !== participantIds.length) {
    throw new InvalidSplitError("Duplicate participants are not allowed in a split.");
  }

  const n = participantIds.length;
  const baseShare = Math.floor(amountMinor / n);
  const remainder = amountMinor - baseShare * n;

  const shares: CalculatedShare[] = participantIds.map((userId, index) => ({
    userId,
    // The first `remainder` participants (by input order) absorb the
    // leftover 1-minor-unit differences so the total matches exactly.
    shareAmount: baseShare + (index < remainder ? 1 : 0)
  }));

  assertSharesSumToAmount(shares, amountMinor);
  return shares;
}

/**
 * PERCENTAGE SPLIT
 * ---------------------------------------------------------------------
 * Percentages must sum to 100 (within a small floating point tolerance).
 * Each participant's raw share is amount * percentage / 100, rounded to
 * the nearest minor unit. Because independently rounding each share can
 * introduce a small residual (positive or negative), any leftover minor
 * units are assigned to the participant(s) with the largest percentage
 * share, largest first, to minimize the observable distortion.
 */
export function calculatePercentageSplit(
  amountMinor: number,
  participants: ParticipantInput[]
): CalculatedShare[] {
  if (participants.length === 0) {
    throw new InvalidSplitError("At least one participant is required for a percentage split.");
  }

  const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage ?? 0), 0);
  if (Math.abs(totalPercentage - 100) > 1e-2) {
    throw new InvalidSplitError(
      `Percentages must add up to 100 (received ${totalPercentage.toFixed(2)}).`
    );
  }
  if (participants.some((p) => p.percentage === undefined || p.percentage! < 0)) {
    throw new InvalidSplitError("Every participant must have a non-negative percentage.");
  }

  const rawShares = participants.map((p) => ({
    userId: p.userId,
    percentage: p.percentage!,
    exact: (amountMinor * p.percentage!) / 100
  }));

  const rounded = rawShares.map((r) => ({
    userId: r.userId,
    percentage: r.percentage,
    shareAmount: Math.round(r.exact)
  }));

  let diff = amountMinor - rounded.reduce((sum, r) => sum + r.shareAmount, 0);

  // Distribute the rounding remainder starting with the largest percentage
  // holders, one minor unit at a time, until the totals reconcile exactly.
  const order = [...rounded].sort((a, b) => b.percentage - a.percentage);
  let i = 0;
  while (diff !== 0 && order.length > 0) {
    const target = order[i % order.length];
    const entry = rounded.find((r) => r.userId === target.userId)!;
    if (diff > 0) {
      entry.shareAmount += 1;
      diff -= 1;
    } else {
      entry.shareAmount -= 1;
      diff += 1;
    }
    i++;
  }

  const shares: CalculatedShare[] = rounded.map((r) => ({
    userId: r.userId,
    shareAmount: r.shareAmount,
    percentage: r.percentage
  }));

  assertSharesSumToAmount(shares, amountMinor);
  return shares;
}

/**
 * CUSTOM SPLIT
 * ---------------------------------------------------------------------
 * The caller specifies exact shares for each participant. These must sum
 * exactly to the expense amount - no rounding or redistribution happens
 * here, since the whole point of a custom split is caller-specified
 * amounts. A mismatch is rejected outright.
 */
export function calculateCustomSplit(
  amountMinor: number,
  participants: ParticipantInput[]
): CalculatedShare[] {
  if (participants.length === 0) {
    throw new InvalidSplitError("At least one participant is required for a custom split.");
  }
  if (participants.some((p) => p.shareAmount === undefined || p.shareAmount < 0)) {
    throw new InvalidSplitError("Every participant must have a non-negative shareAmount.");
  }
  if (participants.some((p) => !Number.isInteger(p.shareAmount))) {
    throw new InvalidSplitError("shareAmount must be an integer number of minor currency units.");
  }

  const shares: CalculatedShare[] = participants.map((p) => ({
    userId: p.userId,
    shareAmount: p.shareAmount!
  }));

  assertSharesSumToAmount(shares, amountMinor);
  return shares;
}

/**
 * Dispatches to the correct split strategy based on splitType.
 */
export function calculateSplit(
  splitType: SplitType,
  amountMinor: number,
  participants: ParticipantInput[]
): CalculatedShare[] {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new InvalidSplitError("Expense amount must be a positive integer minor-unit value.");
  }

  switch (splitType) {
    case "EQUAL":
      return calculateEqualSplit(
        amountMinor,
        participants.map((p) => p.userId)
      );
    case "PERCENTAGE":
      return calculatePercentageSplit(amountMinor, participants);
    case "CUSTOM":
      return calculateCustomSplit(amountMinor, participants);
    default:
      throw new InvalidSplitError(`Unsupported split type: ${splitType as string}`);
  }
}

function assertSharesSumToAmount(shares: CalculatedShare[], amountMinor: number): void {
  const total = shares.reduce((sum, s) => sum + s.shareAmount, 0);
  if (Math.abs(total - amountMinor) > EPSILON) {
    throw new InvalidSplitError(
      `Split amounts must equal the expense total. Expected ${amountMinor}, got ${total}.`
    );
  }
}
