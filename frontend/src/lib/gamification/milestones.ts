/**
 * Milestone Reward Logic
 *
 * Pure functions + DB operations for milestone rewards.
 * Called by API routes and potentially by the submit flow.
 *
 * @module gamification/milestones
 */

import { prisma } from "@/lib/prisma";

export type MilestoneInfo = {
  id: string;
  level: number;
  gemsReward: number;
  badgeName: string | null;
  unlockType: string | null;
  title: string;
  description: string;
};

export type MilestoneStatus = {
  milestone: MilestoneInfo;
  reached: boolean;
  claimed: boolean;
};

/** Map a Prisma MilestoneReward row to the public MilestoneInfo type. */
function toMilestoneInfo(r: {
  id: string;
  level: number;
  gemsReward: number;
  badgeName: string | null;
  unlockType: string | null;
  title: string;
  description: string;
}): MilestoneInfo {
  return {
    id: r.id,
    level: r.level,
    gemsReward: r.gemsReward,
    badgeName: r.badgeName,
    unlockType: r.unlockType,
    title: r.title,
    description: r.description,
  };
}

/**
 * Get all milestone rewards from DB, sorted by level ascending.
 */
export async function getAllMilestones(): Promise<MilestoneInfo[]> {
  const rows = await prisma.milestoneReward.findMany({
    orderBy: { level: "asc" },
  });
  return rows.map(toMilestoneInfo);
}

/**
 * Get milestones that the user has reached but not yet claimed.
 */
export async function getUnclaimedMilestones(
  userId: string,
  currentLevel: number,
): Promise<MilestoneInfo[]> {
  const allMilestones = await prisma.milestoneReward.findMany({
    where: { level: { lte: currentLevel } },
    orderBy: { level: "asc" },
  });

  const claimedIds = await prisma.userMilestone.findMany({
    where: { userId, milestoneId: { in: allMilestones.map((m) => m.id) } },
    select: { milestoneId: true },
  });
  const claimedSet = new Set(claimedIds.map((c) => c.milestoneId));

  return allMilestones.filter((m) => !claimedSet.has(m.id)).map(toMilestoneInfo);
}

/**
 * Get the next milestone the user hasn't reached yet (for progress display).
 */
export async function getNextMilestone(
  currentLevel: number,
): Promise<MilestoneInfo | null> {
  const row = await prisma.milestoneReward.findFirst({
    where: { level: { gt: currentLevel } },
    orderBy: { level: "asc" },
  });
  if (!row) return null;
  return toMilestoneInfo(row);
}

/** Result type for claim validation — pure, no DB dependency. */
export type ClaimValidation =
  | { ok: true }
  | { ok: false; error: "MILESTONE_NOT_FOUND" | "USER_NOT_FOUND" | "LEVEL_NOT_REACHED" | "ALREADY_CLAIMED" };

/**
 * Pure validation for milestone claims — no DB calls.
 * Extracted from claimMilestone() for testability without Prisma mock.
 *
 * @param milestone  The milestone row (null if not found in DB)
 * @param user       The user row with { level } (null if not found)
 * @param alreadyClaimed  Whether a UserMilestone record exists
 */
export function validateClaim(
  milestone: { level: number } | null,
  user: { level: number } | null,
  alreadyClaimed: boolean,
): ClaimValidation {
  if (!milestone) return { ok: false, error: "MILESTONE_NOT_FOUND" };
  if (!user) return { ok: false, error: "USER_NOT_FOUND" };
  if (user.level < milestone.level) return { ok: false, error: "LEVEL_NOT_REACHED" };
  if (alreadyClaimed) return { ok: false, error: "ALREADY_CLAIMED" };
  return { ok: true };
}

/**
 * Claim a milestone reward for a user.
 * Awards diamonds + optional badge. Returns the reward details.
 *
 * Validation logic is delegated to validateClaim() (pure, testable).
 */
export async function claimMilestone(
  userId: string,
  milestoneId: string,
): Promise<{ gems: number; badgeName: string | null } | { error: string }> {
  // Fetch data needed for validation
  const milestone = await prisma.milestoneReward.findUnique({
    where: { id: milestoneId },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true, gems: true },
  });

  const existing = await prisma.userMilestone.findUnique({
    where: { userId_milestoneId: { userId, milestoneId } },
  });

  // Pure validation (testable without DB)
  const validation = validateClaim(milestone, user, existing !== null);
  if (!validation.ok) return { error: validation.error };

  // After validation passes, milestone and user are guaranteed non-null
  const { gemsReward, badgeName } = milestone!;

  // Claim: create UserMilestone + award diamonds in transaction
  await prisma.$transaction(async (tx) => {
    await tx.userMilestone.create({
      data: { userId, milestoneId },
    });
    await tx.user.update({
      where: { id: userId },
      data: { gems: { increment: gemsReward } },
    });

    // Award badge if badgeName is set.
    // Lookup by name (not ID) because milestones.seed defines badge names,
    // not IDs. Silently skip if badge not yet seeded — not a critical error.
    if (badgeName) {
      const badge = await tx.badge.findFirst({
        where: { name: badgeName },
        select: { id: true },
      });
      if (badge) {
        await tx.userBadge.upsert({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          update: {},
          create: { userId, badgeId: badge.id },
        });
      }
    }
  });

  return { gems: gemsReward, badgeName };
}
