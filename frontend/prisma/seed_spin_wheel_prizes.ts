/**
 * Display SpinWheel prize catalog from hardcoded config.
 *
 * Prizes are defined in src/lib/gamification/spin-wheel.ts — no DB table needed.
 *
 * Usage: `npx tsx prisma/seed_spin_wheel_prizes.ts`
 */

import { SPIN_WHEEL_PRIZES } from "../src/lib/gamification/spin-wheel";

function main() {
  console.log("🎰 Spin Wheel Prize Catalog (hardcoded in spin-wheel.ts):\n");
  console.log("ID                 | Label              | Weight | Value");
  console.log("-------------------|--------------------|--------|------");
  for (const prize of SPIN_WHEEL_PRIZES) {
    const value = prize.value.gems
      ? `${prize.value.gems} gems`
      : prize.value.xp
        ? `${prize.value.xp} xp`
        : prize.value.streakFreezes
          ? `${prize.value.streakFreezes} freeze`
          : "—";
    console.log(
      `${prize.id.padEnd(18)} | ${prize.label.padEnd(18)} | ${String(prize.weight).padStart(6)} | ${value}`
    );
  }
  console.log(`\nTotal weight: ${SPIN_WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0)}`);
}

main();
