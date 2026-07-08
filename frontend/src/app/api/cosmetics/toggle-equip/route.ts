import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_COSMETIC_IDS = ["frame_silver", "frame_gold", "frame_diamond", "frame_fire"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Cần đăng nhập" } },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { itemId?: string };
    if (!body.itemId || !VALID_COSMETIC_IDS.includes(body.itemId)) {
      return Response.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "itemId không hợp lệ" } },
        { status: 400 },
      );
    }

    const cosmetic = await prisma.userCosmetic.findUnique({
      where: { userId_itemId: { userId, itemId: body.itemId } },
    });

    if (!cosmetic) {
      return Response.json(
        { success: false, error: { code: "NOT_OWNED", message: "Bạn chưa sở hữu vật phẩm này" } },
        { status: 400 },
      );
    }

    const newEquipped = !cosmetic.equipped;

    // If equipping, unequip same-category items first (only 1 frame + 1 title at a time)
    if (newEquipped) {
      const category = body.itemId.startsWith("frame_") ? "frame_" : "title_";
      await prisma.userCosmetic.updateMany({
        where: {
          userId,
          itemId: { startsWith: category },
          equipped: true,
        },
        data: { equipped: false },
      });
    }

    const updated = await prisma.userCosmetic.update({
      where: { userId_itemId: { userId, itemId: body.itemId } },
      data: { equipped: newEquipped },
    });

    return Response.json({
      success: true,
      data: {
        itemId: body.itemId,
        equipped: updated.equipped,
      },
    });
  } catch (error) {
    console.error("Toggle equip error:", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Lỗi server" } },
      { status: 500 },
    );
  }
}
