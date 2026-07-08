import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { XP_BOOST_ARTICLES } from "@/lib/gamification/constants";

/** Cosmetic item IDs that use UserCosmetic model instead of User fields */
const COSMETIC_ITEM_IDS = new Set(["frame_silver", "frame_gold", "frame_diamond", "frame_fire"]);

/** Map DB key → User field for consumable items */
const CONSUMABLE_FIELD_MAP: Record<string, string> = {
  streak_freeze: "streakFreezes",
  ipa_reveal: "unlockedIpaReveal",
  slow_audio: "unlockedSlowAudio",
  xp_boost: "xpBoostRemaining",
  hint_token: "hintTokens",
  second_chance: "secondChances",
};

/**
 * POST /api/shop
 * Purchase a shop item using diamonds.
 * Body: { itemId: string }
 *
 * Reads item from DB ShopItem table (not hardcoded).
 * Uses atomic DB-level guard to prevent gems going negative.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Cần đăng nhập để mua hàng" } },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { itemId?: string };
    if (!body.itemId || typeof body.itemId !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "itemId không hợp lệ" } },
        { status: 400 },
      );
    }

    // Read item from DB instead of hardcoded array
    const item = await prisma.shopItem.findFirst({
      where: { key: body.itemId, status: "ACTIVE" },
    });
    if (!item) {
      return NextResponse.json(
        { success: false, error: { code: "ITEM_NOT_FOUND", message: "Vật phẩm không tồn tại hoặc đã ngừng bán" } },
        { status: 404 },
      );
    }

    // Check already owned (permanent boolean items)
    const isPermanent = item.key === "ipa_reveal" || item.key === "slow_audio";
    if (isPermanent) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { unlockedIpaReveal: true, unlockedSlowAudio: true },
      });
      if (user) {
        const alreadyOwned =
          (item.key === "ipa_reveal" && user.unlockedIpaReveal) ||
          (item.key === "slow_audio" && user.unlockedSlowAudio);
        if (alreadyOwned) {
          return NextResponse.json(
            { success: false, error: { code: "ALREADY_OWNED", message: "Bạn đã sở hữu vật phẩm này" } },
            { status: 400 },
          );
        }
      }
    }

    // Cosmetic items: separate flow using UserCosmetic model
    if (COSMETIC_ITEM_IDS.has(item.key)) {
      const existing = await prisma.userCosmetic.findUnique({
        where: { userId_itemId: { userId, itemId: item.key } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: "ALREADY_OWNED", message: "Bạn đã sở hữu vật phẩm này" } },
          { status: 400 },
        );
      }

      // Atomic transaction: check gems >= cost AND deduct in one DB operation
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { gems: true },
        });
        if (!user || user.gems < item.cost) {
          return null;
        }

        // Unequip other frames before equipping new one
        if (item.key.startsWith("frame_")) {
          await tx.userCosmetic.updateMany({
            where: {
              userId,
              itemId: { startsWith: "frame_" },
              equipped: true,
            },
            data: { equipped: false },
          });
        }

        const [updatedUser] = await Promise.all([
          tx.user.update({
            where: { id: userId },
            data: { gems: { decrement: item.cost } },
            select: { gems: true },
          }),
          tx.userCosmetic.create({
            data: { userId, itemId: item.key, equipped: true },
          }),
        ]);
        return updatedUser;
      });

      if (!result) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_ENOUGH_GEMS", message: "Không đủ đá quý" } },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          item: { id: item.key, name: item.name },
          cost: item.cost,
          user: { gems: result.gems },
        },
      });
    }

    // Consumable items: atomic transaction with gems guard
    const field = CONSUMABLE_FIELD_MAP[item.key];
    if (!field) {
      return NextResponse.json(
        { success: false, error: { code: "ITEM_NOT_IMPLEMENTED", message: "Vật phẩm sắp ra mắt" } },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (field === "unlockedIpaReveal") {
      updateData.unlockedIpaReveal = true;
    } else if (field === "unlockedSlowAudio") {
      updateData.unlockedSlowAudio = true;
    } else if (field === "xpBoostRemaining") {
      updateData.xpBoostRemaining = { increment: XP_BOOST_ARTICLES };
    } else {
      updateData[field] = { increment: 1 };
    }

    // Atomic: check gems + deduct in transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { gems: true },
      });
      if (!user || user.gems < item.cost) {
        return null;
      }
      return tx.user.update({
        where: { id: userId, gems: { gte: item.cost } },
        data: { gems: { decrement: item.cost }, ...updateData },
        select: { gems: true, streakFreezes: true, unlockedIpaReveal: true, unlockedSlowAudio: true, xpBoostRemaining: true, hintTokens: true, secondChances: true },
      });
    });

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_ENOUGH_GEMS", message: "Không đủ đá quý" } },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        item: { id: item.key, name: item.name },
        cost: item.cost,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Shop purchase error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Lỗi server khi mua hàng" } },
      { status: 500 },
    );
  }
}
