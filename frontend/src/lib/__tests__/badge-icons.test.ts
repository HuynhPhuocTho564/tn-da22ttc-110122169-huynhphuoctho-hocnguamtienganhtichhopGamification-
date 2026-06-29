import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BADGE_DEFINITIONS } from "../gamification";
import {
  BADGE_ICON_MAP,
  RARITY_STYLES,
  type BadgeIconName,
  type BadgeRarity,
} from "../gamification/badge-icons";

describe("Badge Icon Mapping", () => {
  it("every badge definition has a corresponding icon mapping", () => {
    for (const badge of BADGE_DEFINITIONS) {
      assert.ok(
        BADGE_ICON_MAP[badge.id],
        `Badge "${badge.id}" (${badge.name}) is missing from BADGE_ICON_MAP`,
      );
    }
  });

  it("no orphan icon mappings (all map to existing badges)", () => {
    const badgeIds = new Set(BADGE_DEFINITIONS.map((b) => b.id));
    for (const iconId of Object.keys(BADGE_ICON_MAP)) {
      assert.ok(
        badgeIds.has(iconId),
        `Icon mapping "${iconId}" does not match any badge definition`,
      );
    }
  });

  it("icon count matches badge count", () => {
    assert.equal(
      Object.keys(BADGE_ICON_MAP).length,
      BADGE_DEFINITIONS.length,
      "Icon map size should match badge definitions size",
    );
  });
});

describe("Rarity Styles", () => {
  const allRarities: BadgeRarity[] = ["COMMON", "RARE", "EPIC", "LEGENDARY", "PERIODIC"];

  it("covers all 5 rarity tiers", () => {
    for (const rarity of allRarities) {
      assert.ok(
        RARITY_STYLES[rarity],
        `Rarity "${rarity}" is missing from RARITY_STYLES`,
      );
    }
  });

  it("every tier has required style properties", () => {
    for (const rarity of allRarities) {
      const style = RARITY_STYLES[rarity];
      assert.ok(style.ring, `${rarity} missing ring class`);
      assert.ok(style.bg, `${rarity} missing bg class`);
      assert.ok(style.icon, `${rarity} missing icon class`);
      assert.ok(style.border, `${rarity} missing border class`);
      assert.ok(style.label, `${rarity} missing label`);
    }
  });

  it("EPIC tier has glow effect", () => {
    assert.ok(
      RARITY_STYLES.EPIC.glow.length > 0,
      "EPIC tier should have a glow effect class",
    );
    assert.ok(
      RARITY_STYLES.EPIC.glow.includes("drop-shadow"),
      "EPIC glow should use drop-shadow",
    );
  });

  it("LEGENDARY tier has glow effect", () => {
    assert.ok(
      RARITY_STYLES.LEGENDARY.glow.length > 0,
      "LEGENDARY tier should have a glow effect",
    );
    assert.ok(
      RARITY_STYLES.LEGENDARY.glow.includes("drop-shadow"),
      "LEGENDARY glow should use drop-shadow",
    );
  });

  it("non-prestige tiers have no glow", () => {
    assert.equal(RARITY_STYLES.COMMON.glow, "", "COMMON should have no glow");
    assert.equal(RARITY_STYLES.RARE.glow, "", "RARE should have no glow");
    assert.equal(RARITY_STYLES.PERIODIC.glow, "", "PERIODIC should have no glow");
  });
});

describe("Badge Icon Names", () => {
  it("all mapped icons are valid BadgeIconName values", () => {
    const validIcons: BadgeIconName[] = [
      "Mic", "BookOpen", "Dumbbell", "Ear", "Star",
      "Flame", "CalendarCheck", "Diamond", "TrendingUp", "Trophy",
    ];
    const validSet = new Set(validIcons);

    for (const [badgeId, iconName] of Object.entries(BADGE_ICON_MAP)) {
      assert.ok(
        validSet.has(iconName),
        `Badge "${badgeId}" has invalid icon name "${iconName}"`,
      );
    }
  });
});
