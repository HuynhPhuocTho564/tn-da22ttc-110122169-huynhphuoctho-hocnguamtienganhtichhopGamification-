import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

async function main() {
  const email = "thott7290415@gmail.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.error("User not found"); process.exit(1); }

  console.log(`\n📋 Updating missions for: ${user.username} (${email})\n`);

  // ─── 1. DailyQuest: create today's 4 missions, all completed + claimed ───
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyQuestDefs = [
    { questType: "perfect-1", target: 1, rewardXp: 60, rewardGems: 12 },
    { questType: "daily-3", target: 3, rewardXp: 30, rewardGems: 5 },
    { questType: "high-score-3", target: 3, rewardXp: 50, rewardGems: 10 },
    { questType: "daily-5", target: 5, rewardXp: 40, rewardGems: 8 },
  ];

  let dailyCreated = 0;
  let dailyUpdated = 0;

  for (const q of dailyQuestDefs) {
    const result = await prisma.dailyQuest.upsert({
      where: { userId_date_questType: { userId: user.id, date: today, questType: q.questType } },
      update: { progress: q.target, completed: true, claimedAt: new Date() },
      create: {
        userId: user.id,
        date: today,
        questType: q.questType,
        target: q.target,
        progress: q.target,
        completed: true,
        rewardXp: q.rewardXp,
        rewardGems: q.rewardGems,
        claimedAt: new Date(),
      },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) dailyCreated++;
    else dailyUpdated++;
    console.log(`   ✓ DailyQuest: ${q.questType} (${q.target}/${q.target})`);
  }

  // Also do yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const q of dailyQuestDefs) {
    await prisma.dailyQuest.upsert({
      where: { userId_date_questType: { userId: user.id, date: yesterday, questType: q.questType } },
      update: { progress: q.target, completed: true, claimedAt: new Date() },
      create: {
        userId: user.id,
        date: yesterday,
        questType: q.questType,
        target: q.target,
        progress: q.target,
        completed: true,
        rewardXp: q.rewardXp,
        rewardGems: q.rewardGems,
        claimedAt: new Date(),
      },
    });
    console.log(`   ✓ DailyQuest (hôm qua): ${q.questType}`);
  }

  console.log(`\n   DailyQuest: ${dailyCreated} created, ${dailyUpdated} updated`);

  // ─── 2. WeeklyChallenge: create + complete participation ───
  const weekKey = getWeekKey(today);
  const existingChallenge = await prisma.weeklyChallenge.findUnique({ where: { weekKey } });

  let challenge;
  if (existingChallenge) {
    challenge = existingChallenge;
  } else {
    challenge = await prisma.weeklyChallenge.create({
      data: {
        weekKey,
        title: "Tuần luyện tập chăm chỉ",
        description: "Hoàn thành 5 bài tập trong tuần",
        targetMetric: "exercises",
        targetValue: 5,
        rewardGems: 25,
        startsAt: new Date(today.getTime() - today.getDay() * 86400000),
        endsAt: new Date(today.getTime() + (7 - today.getDay()) * 86400000),
      },
    });
    console.log(`   ✓ WeeklyChallenge created: ${weekKey}`);
  }

  const participant = await prisma.weeklyChallengeParticipant.upsert({
    where: { challengeId_userId: { challengeId: challenge.id, userId: user.id } },
    update: { progress: 5, completed: true, claimedAt: new Date() },
    create: {
      challengeId: challenge.id,
      userId: user.id,
      progress: 5,
      completed: true,
      claimedAt: new Date(),
    },
  });
  console.log(`   ✓ WeeklyChallengeParticipant: ${weekKey} (5/5 completed)`);

  // ─── 3. Verify ───
  const totalDaily = await prisma.dailyQuest.count({ where: { userId: user.id, completed: true } });
  const totalClaimed = await prisma.dailyQuest.count({ where: { userId: user.id, claimedAt: { not: null } } });
  const totalWeekly = await prisma.weeklyChallengeParticipant.count({ where: { userId: user.id, completed: true } });

  console.log(`\n✅ Summary:`);
  console.log(`   DailyQuest completed: ${totalDaily}`);
  console.log(`   DailyQuest claimed: ${totalClaimed}`);
  console.log(`   WeeklyChallenge completed: ${totalWeekly}`);
}

main()
  .catch((err) => { console.error("❌ Error:", err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
