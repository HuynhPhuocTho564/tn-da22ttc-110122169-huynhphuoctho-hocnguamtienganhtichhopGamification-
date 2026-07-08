import assert from "node:assert/strict";
import test from "node:test";
import {
  BADGE_DEFINITIONS,
  CHECKIN_REWARD,
  calculateExerciseRewards,
  calculateLevelFromXp,
  getBadgeDefinition,
  getBadgeProgressFromStats,
  getLeaderboardTargets,
  getNextLevelXp,
  computeGemReward,
  validateShopPurchase,
  calculateNextStreak,
  computeXpMultiplier,
  isRetakeLimitExceeded,
  MAX_RETAKE_PER_DAY,
  GEM_REWARDS,
  SHOP_ITEMS,
  QUEST_TYPES,
  computeStreakMilestoneGems,
  shouldIncrementQuest,
  pickDailyQuests,
} from "../gamification";

test("first exercise attempt earns score-based EXP and ranking score", () => {
  const rewards = calculateExerciseRewards({
    exerciseScore: 85,
    previousBestScore: null,
    completedExercisesTodayBefore: 0,
    exerciseCompleted: true,
  });

  assert.equal(rewards.baseXp, 128); // 85 × 1.5 = 127.5 → 128
  assert.equal(rewards.retakeXp, 0);
  assert.equal(rewards.dailyBonusXp, 0);
  assert.equal(rewards.xpEarned, 128);
  assert.equal(rewards.rankingDelta, 85);
  assert.equal(rewards.totalRankingDelta, 85);
});

test("improved retake earns partial EXP and only the improved ranking delta", () => {
  const rewards = calculateExerciseRewards({
    exerciseScore: 90,
    previousBestScore: 70,
    completedExercisesTodayBefore: 0,
    exerciseCompleted: true,
  });

  assert.equal(rewards.baseXp, 40); // (90 - 70) × 2 = 40
  assert.equal(rewards.retakeXp, 0);
  assert.equal(rewards.rankingDelta, 20);
  assert.equal(rewards.totalRankingDelta, 20);
});

test("lower retake still earns a small practice reward", () => {
  const rewards = calculateExerciseRewards({
    exerciseScore: 80,
    previousBestScore: 85,
    completedExercisesTodayBefore: 0,
    exerciseCompleted: true,
  });

  assert.equal(rewards.baseXp, 0);
  assert.equal(rewards.retakeXp, 16); // 80 × 0.2 = 16
  assert.equal(rewards.rankingDelta, 0);
  assert.equal(rewards.retakeRanking, 4);
  assert.equal(rewards.totalRankingDelta, 4);
});

test("daily completion bonus applies at configured milestones", () => {
  const secondCompleted = calculateExerciseRewards({
    exerciseScore: 75,
    previousBestScore: null,
    completedExercisesTodayBefore: 1,
    exerciseCompleted: true,
  });
  const thirdCompleted = calculateExerciseRewards({
    exerciseScore: 75,
    previousBestScore: null,
    completedExercisesTodayBefore: 2,
    exerciseCompleted: true,
  });
  const fifthCompleted = calculateExerciseRewards({
    exerciseScore: 75,
    previousBestScore: null,
    completedExercisesTodayBefore: 4,
    exerciseCompleted: true,
  });
  const eighthCompleted = calculateExerciseRewards({
    exerciseScore: 75,
    previousBestScore: null,
    completedExercisesTodayBefore: 7,
    exerciseCompleted: true,
  });

  assert.equal(secondCompleted.dailyBonusXp, 10);
  assert.equal(secondCompleted.dailyBonusRanking, 2);
  assert.equal(secondCompleted.gemsEarned, 3);
  assert.equal(thirdCompleted.dailyBonusXp, 20);
  assert.equal(thirdCompleted.dailyBonusRanking, 4);
  assert.equal(thirdCompleted.gemsEarned, 3);
  assert.equal(fifthCompleted.dailyBonusXp, 35);
  assert.equal(fifthCompleted.dailyBonusRanking, 8);
  assert.equal(fifthCompleted.gemsEarned, 5);
  assert.equal(eighthCompleted.dailyBonusXp, 50);
  assert.equal(eighthCompleted.dailyBonusRanking, 12);
  assert.equal(eighthCompleted.gemsEarned, 8);
});

test("low-score unfinished attempts do not receive practice or daily rewards", () => {
  const rewards = calculateExerciseRewards({
    exerciseScore: 45,
    previousBestScore: 80,
    completedExercisesTodayBefore: 7,
    exerciseCompleted: false,
  });

  assert.equal(rewards.xpEarned, 0);
  assert.equal(rewards.totalRankingDelta, 0);
});

test("level thresholds are derived from cumulative EXP", () => {
  assert.equal(calculateLevelFromXp(-10), 1);
  assert.equal(calculateLevelFromXp(0), 1);
  assert.equal(calculateLevelFromXp(99), 1);
  assert.equal(calculateLevelFromXp(100), 2);
  assert.equal(calculateLevelFromXp(399), 2);
  assert.equal(calculateLevelFromXp(400), 3);
  assert.equal(getNextLevelXp(2), 400);
});

test("check-in reward and leaderboard targets remain explicit", () => {
  const targets = getLeaderboardTargets(new Date("2026-06-14T12:00:00+07:00"));

  assert.deepEqual(CHECKIN_REWARD, {
    xp: 10,
    rankingScore: 2,
    gems: 3,
  });
  assert.deepEqual(
    targets.map((target) => target.type),
    ["tuan"],
  );
  assert.equal(targets[0].period, "2026-W24");
});

test("badge definitions expose progress metadata for the badge page", () => {
  const firstExercise = getBadgeDefinition("badge-milestone-first-exercise");
  const streakSeven = BADGE_DEFINITIONS.find((definition) => definition.id === "badge-streak-silver");

  assert.ok(firstExercise);
  assert.ok(streakSeven);
  assert.deepEqual(
    getBadgeProgressFromStats(firstExercise, {
      completedExercises: 1,
      listeningHighScoreExercises: 0,
      speakingHighScoreExercises: 0,
      excellentSpeakingExercises: 0,
      streakCount: 0,
      bestImprovement: 0,
      weeklyRank: 0,
      uniqueTopicCount: 0,
      uniqueQuestionTypeCount: 0,
      shareCount: 0,
      maxRetakeCount: 0,
      bestComebackScore: 0,
      perfectScoreExercises: 0,
    }),
    {
      current: 1,
      target: 1,
      unit: "exercise",
    },
  );
});

// ===== Badge Progress Calculation (MC-9: generic statKey) =====

const MOCK_STATS = {
  completedExercises: 8,
  listeningHighScoreExercises: 3,
  speakingHighScoreExercises: 2,
  excellentSpeakingExercises: 0,
  streakCount: 5,
  bestImprovement: 15,
  weeklyRank: 7,
  uniqueTopicCount: 2,
  uniqueQuestionTypeCount: 3,
  shareCount: 1,
  maxRetakeCount: 2,
  bestComebackScore: 0,
  perfectScoreExercises: 0,
};

test("getBadgeProgressFromStats: progress badge reads completedExercises", () => {
  const def = getBadgeDefinition("badge-milestone-ten-exercises");
  assert.ok(def);
  const result = getBadgeProgressFromStats(def, MOCK_STATS);
  assert.deepEqual(result, { current: 8, target: 10, unit: "exercise" });
});

test("getBadgeProgressFromStats: streak badge reads streakCount", () => {
  const def = getBadgeDefinition("badge-streak-silver");
  assert.ok(def);
  const result = getBadgeProgressFromStats(def, MOCK_STATS);
  assert.deepEqual(result, { current: 5, target: 7, unit: "day" });
});

test("getBadgeProgressFromStats: skill badge reads correct stat", () => {
  const def = getBadgeDefinition("badge-skill-ear-training");
  assert.ok(def);
  const result = getBadgeProgressFromStats(def, MOCK_STATS);
  assert.deepEqual(result, { current: 3, target: 3, unit: "listen_exercise" });
});

test("getBadgeProgressFromStats: new explorer badge reads uniqueTopicCount", () => {
  const def = getBadgeDefinition("badge-explorer-ipa");
  assert.ok(def);
  const result = getBadgeProgressFromStats(def, MOCK_STATS);
  assert.deepEqual(result, { current: 2, target: 4, unit: "topic" });
});

test("getBadgeProgressFromStats: new effort badge reads maxRetakeCount", () => {
  const def = getBadgeDefinition("badge-effort-persistent");
  assert.ok(def);
  const result = getBadgeProgressFromStats(def, MOCK_STATS);
  assert.deepEqual(result, { current: 2, target: 3, unit: "retake" });
});

test("getBadgeProgressFromStats: unknown badge returns null", () => {
  const fakeDef = { ...BADGE_DEFINITIONS[0], statKey: "nonExistent" as never };
  const result = getBadgeProgressFromStats(fakeDef, MOCK_STATS);
  assert.equal(result, null);
});

test("all badge definitions have valid statKey", () => {
  const validKeys = new Set([
    "completedExercises", "listeningHighScoreExercises", "speakingHighScoreExercises",
    "excellentSpeakingExercises", "streakCount", "bestImprovement", "weeklyRank",
    "uniqueTopicCount", "uniqueQuestionTypeCount", "shareCount",
    "maxRetakeCount", "bestComebackScore", "perfectScoreExercises",
  ]);
  for (const def of BADGE_DEFINITIONS) {
    assert.ok(validKeys.has(def.statKey), `Badge "${def.id}" has invalid statKey: ${def.statKey}`);
  }
});

// ===== SP7: Diamond + Streak Freeze =====

test("diamond reward: EXCELLENT → +10 gems, GOOD → +5 gems, PASS → +2 gems, NEEDS_PRACTICE → 0", () => {
  assert.equal(computeGemReward("EXCELLENT"), 10);
  assert.equal(computeGemReward("GOOD"), 5);
  assert.equal(computeGemReward("PASS"), 2);
  assert.equal(computeGemReward("NEEDS_PRACTICE"), 0);
});

test("streakFreeze: missed 1 day + has freeze → keep streak, use 1 freeze", () => {
  const today = new Date("2026-06-19");
  const lastCheckIn = new Date("2026-06-17"); // 2 days ago (diffDays = 2 > 1)
  const result = calculateNextStreak(lastCheckIn, 10, today, 2);
  assert.equal(result.streak, 10);
  assert.equal(result.usedFreeze, true);
});

test("streakFreeze: missed 1 day + 0 freezes → reset streak to 1", () => {
  const today = new Date("2026-06-19");
  const lastCheckIn = new Date("2026-06-17");
  const result = calculateNextStreak(lastCheckIn, 10, today, 0);
  assert.equal(result.streak, 1);
  assert.equal(result.usedFreeze, false);
});

test("shop validate: enough diamonds → OK; insufficient → NOT_ENOUGH_GEMS", () => {
  assert.deepEqual(validateShopPurchase(50, 50), { ok: true });
  assert.deepEqual(validateShopPurchase(49, 50), { ok: false, reason: "NOT_ENOUGH_GEMS" });
});

// ===== SP4: Scoring multiplier + Retake limit =====

test("computeXpMultiplier: majority speaking → 1.0", () => {
  assert.equal(computeXpMultiplier(["qtype-2-voice", "qtype-2-voice", "qtype-1-mc"]), 1.0);
});

test("computeXpMultiplier: majority listening → 0.8", () => {
  assert.equal(computeXpMultiplier(["qtype-1-mc", "qtype-1-mc", "qtype-2-voice"]), 0.8);
});

test("computeXpMultiplier: empty array → 1.0", () => {
  assert.equal(computeXpMultiplier([]), 1);
});

test("computeXpMultiplier: all speaking → 1.0", () => {
  assert.equal(computeXpMultiplier(["qtype-2-voice", "qtype-3-minimal-pairs"]), 1.0);
});

test("isRetakeLimitExceeded: under limit → false", () => {
  assert.equal(isRetakeLimitExceeded(4), false);
});

test("isRetakeLimitExceeded: at limit → true", () => {
  assert.equal(isRetakeLimitExceeded(MAX_RETAKE_PER_DAY), true);
});

test("isRetakeLimitExceeded: over limit → true", () => {
  assert.equal(isRetakeLimitExceeded(MAX_RETAKE_PER_DAY + 1), true);
});

test("MAX_RETAKE_PER_DAY is 5", () => {
  assert.equal(MAX_RETAKE_PER_DAY, 5);
});

// ===== SP7: Coverage — constants + helpers =====

test("GEM_REWARDS constant has expected values", () => {
  assert.equal(GEM_REWARDS.excellent_exercise, 10);
  assert.equal(GEM_REWARDS.good_exercise, 5);
  assert.equal(GEM_REWARDS.pass_exercise, 2);
  assert.equal(GEM_REWARDS.daily_checkin, 3);
  assert.equal(GEM_REWARDS.streak_7_bonus, 15);
  assert.equal(GEM_REWARDS.streak_14_bonus, 30);
  assert.equal(GEM_REWARDS.daily_quest_complete, 10);
  assert.equal(GEM_REWARDS.weekly_challenge, 25);
});

test("SHOP_ITEMS has 10 items with valid structure", () => {
  assert.equal(SHOP_ITEMS.length, 10);
  for (const item of SHOP_ITEMS) {
    assert.ok(item.id, "item must have id");
    assert.ok(item.name, "item must have name");
    assert.ok(item.cost > 0, "item cost must be positive");
    assert.ok(["power_up", "cosmetic", "protection"].includes(item.category), `invalid category: ${item.category}`);
    assert.ok(item.desc, "item must have desc");
    assert.ok(item.icon, "item must have icon");
  }
});

test("SHOP_ITEMS includes 2 implemented items", () => {
  const ids = SHOP_ITEMS.map((i) => i.id);
  assert.ok(ids.includes("slow_audio"), "must have slow_audio");
  assert.ok(ids.includes("streak_freeze"), "must have streak_freeze");
});

test("QUEST_TYPES has 3 quest definitions", () => {
  assert.equal(QUEST_TYPES.length, 3);
  const types = QUEST_TYPES.map((q) => q.type);
  assert.ok(types.includes("PRACTICE_3"));
  assert.ok(types.includes("CD2_3"));
  assert.ok(types.includes("CD4_LINKING_3"));
  for (const q of QUEST_TYPES) {
    assert.equal(q.target, 3);
    assert.equal(q.rewardXp, 50);
    assert.equal(q.rewardGems, 10);
  }
});

test("computeStreakMilestoneGems: streak 7 (from 6) → +15 diamonds", () => {
  assert.equal(computeStreakMilestoneGems(7, 6), 15);
});

test("computeStreakMilestoneGems: streak 14 (from 13) → +30 diamonds", () => {
  assert.equal(computeStreakMilestoneGems(14, 13), 30);
});

test("computeStreakMilestoneGems: already past milestone → 0", () => {
  assert.equal(computeStreakMilestoneGems(8, 7), 0);
  assert.equal(computeStreakMilestoneGems(15, 14), 0);
});

test("computeStreakMilestoneGems: non-milestone streak → 0", () => {
  assert.equal(computeStreakMilestoneGems(3, 2), 0);
  assert.equal(computeStreakMilestoneGems(10, 9), 0);
});

test("shouldIncrementQuest: PRACTICE_3 increments on any completed exercise", () => {
  assert.equal(
    shouldIncrementQuest("PRACTICE_3", { exerciseCompleted: true, topicId: "any", soundGroupId: "any" }),
    true,
  );
  assert.equal(
    shouldIncrementQuest("PRACTICE_3", { exerciseCompleted: false, topicId: "any", soundGroupId: "any" }),
    false,
  );
});

test("shouldIncrementQuest: CD2_3 only for topic-2-consonants", () => {
  assert.equal(
    shouldIncrementQuest("CD2_3", { exerciseCompleted: true, topicId: "topic-2-consonants", soundGroupId: "any" }),
    true,
  );
  assert.equal(
    shouldIncrementQuest("CD2_3", { exerciseCompleted: true, topicId: "topic-1-vowels", soundGroupId: "any" }),
    false,
  );
});

test("shouldIncrementQuest: CD4_LINKING_3 only for map-t4-g03-linking", () => {
  assert.equal(
    shouldIncrementQuest("CD4_LINKING_3", { exerciseCompleted: true, topicId: "any", soundGroupId: "map-t4-g03-linking" }),
    true,
  );
  assert.equal(
    shouldIncrementQuest("CD4_LINKING_3", { exerciseCompleted: true, topicId: "any", soundGroupId: "map-t4-g01-stress" }),
    false,
  );
});

test("shouldIncrementQuest: unknown quest type → false", () => {
  assert.equal(
    shouldIncrementQuest("UNKNOWN", { exerciseCompleted: true, topicId: "any", soundGroupId: "any" }),
    false,
  );
});

test("pickDailyQuests: returns 3 quests with valid structure", () => {
  const quests = pickDailyQuests();
  assert.equal(quests.length, 3);
  for (const q of quests) {
    assert.ok(q.type, "quest must have type");
    assert.equal(q.target, 3);
    assert.ok(q.desc, "quest must have desc");
    assert.equal(q.rewardXp, 50);
    assert.equal(q.rewardGems, 10);
  }
  // All types must come from QUEST_TYPES
  const validTypes: string[] = QUEST_TYPES.map((q) => q.type);
  for (const q of quests) {
    assert.ok(validTypes.includes(q.type), `invalid quest type: ${q.type}`);
  }
});
