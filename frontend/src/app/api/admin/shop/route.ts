import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiFailure,
  apiSuccess,
  readJsonObject,
  readNullableInt,
  readOptionalStatus,
  readRequiredString,
  requireAdminSession,
} from "@/lib/admin-api";

export const SHOP_ITEM_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
export const SHOP_ITEM_CATEGORIES = ["power_up", "protection", "cosmetic"] as const;

/** GET /api/admin/shop - List all shop items */
export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const items = await prisma.shopItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return apiSuccess({ items });
  } catch (error) {
    console.error("Admin list shop items error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

/** POST /api/admin/shop - Create a new shop item */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const key = readRequiredString(body, "key", 64);
    const name = readRequiredString(body, "name", 255);
    const description = readRequiredString(body, "description", 1000);
    const cost = readNullableInt(body, "cost", 0, 1_000_000);
    const category = readOptionalStatus(body, SHOP_ITEM_CATEGORIES);
    const sortOrder = readNullableInt(body, "sortOrder", 0, 100_000);
    const status = readOptionalStatus(body, SHOP_ITEM_STATUSES);

    if (!key) return apiFailure("VALIDATION_ERROR", "key là bắt buộc", 400);
    if (!name) return apiFailure("VALIDATION_ERROR", "name là bắt buộc", 400);
    if (!description) return apiFailure("VALIDATION_ERROR", "description là bắt buộc", 400);
    if (cost === undefined || cost === false || cost === null) {
      return apiFailure("VALIDATION_ERROR", "cost là bắt buộc (0-1000000)", 400);
    }
    if (category === null) return apiFailure("VALIDATION_ERROR", "category không hợp lệ", 400);
    if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);

    const existing = await prisma.shopItem.findUnique({ where: { key } });
    if (existing) return apiFailure("CONFLICT", `key "${key}" đã tồn tại`, 409);

    const item = await prisma.shopItem.create({
      data: {
        key,
        name,
        description,
        cost,
        category: category ?? "power_up",
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
        status: status ?? "ACTIVE",
      },
    });

    return apiSuccess({ item }, 201);
  } catch (error) {
    console.error("Admin create shop item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
