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
import { SHOP_ITEM_CATEGORIES, SHOP_ITEM_STATUSES } from "../route";

/** PATCH /api/admin/shop/[id] - Update a shop item */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const existing = await prisma.shopItem.findUnique({ where: { id } });
    if (!existing) return apiFailure("NOT_FOUND", "Shop item không tồn tại", 404);

    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const data: {
      key?: string;
      name?: string;
      description?: string;
      cost?: number;
      category?: string;
      sortOrder?: number;
      status?: string;
    } = {};

    if ("key" in body) {
      const key = readRequiredString(body, "key", 64);
      if (!key) return apiFailure("VALIDATION_ERROR", "key không hợp lệ", 400);
      if (key !== existing.key) {
        const conflict = await prisma.shopItem.findUnique({ where: { key } });
        if (conflict) return apiFailure("CONFLICT", `key "${key}" đã tồn tại`, 409);
      }
      data.key = key;
    }

    if ("name" in body) {
      const name = readRequiredString(body, "name", 255);
      if (!name) return apiFailure("VALIDATION_ERROR", "name không hợp lệ", 400);
      data.name = name;
    }

    if ("description" in body) {
      const description = readRequiredString(body, "description", 1000);
      if (!description) return apiFailure("VALIDATION_ERROR", "description không hợp lệ", 400);
      data.description = description;
    }

    if ("cost" in body) {
      const cost = readNullableInt(body, "cost", 0, 1_000_000);
      if (cost === false || cost === null) {
        return apiFailure("VALIDATION_ERROR", "cost không hợp lệ (0-1000000)", 400);
      }
      data.cost = cost ?? 0;
    }

    if ("category" in body) {
      const category = readOptionalStatus(body, SHOP_ITEM_CATEGORIES);
      if (category === null) return apiFailure("VALIDATION_ERROR", "category không hợp lệ", 400);
      data.category = category;
    }

    if ("sortOrder" in body) {
      const sortOrder = readNullableInt(body, "sortOrder", 0, 100_000);
      if (sortOrder === false || sortOrder === null) {
        return apiFailure("VALIDATION_ERROR", "sortOrder không hợp lệ (0-100000)", 400);
      }
      data.sortOrder = sortOrder ?? 0;
    }

    if ("status" in body) {
      const status = readOptionalStatus(body, SHOP_ITEM_STATUSES);
      if (status === null) return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);
      data.status = status;
    }

    const item = await prisma.shopItem.update({ where: { id }, data });
    return apiSuccess({ item });
  } catch (error) {
    console.error("Admin update shop item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

/** DELETE /api/admin/shop/[id] - Archive a shop item (soft delete) */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const existing = await prisma.shopItem.findUnique({ where: { id } });
    if (!existing) return apiFailure("NOT_FOUND", "Shop item không tồn tại", 404);

    // Soft delete: set status to ARCHIVED so existing user references stay valid.
    const item = await prisma.shopItem.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    return apiSuccess({ item });
  } catch (error) {
    console.error("Admin archive shop item error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
