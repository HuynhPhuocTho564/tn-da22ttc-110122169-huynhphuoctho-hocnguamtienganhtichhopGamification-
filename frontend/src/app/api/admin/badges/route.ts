import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, readJsonObject, readOptionalString, readRequiredString, requireAdminSession } from "@/lib/admin-api";

/** GET /api/admin/badges - List all badges */
export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const badges = await prisma.badge.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { userBadges: true } },
      },
    });

    return apiSuccess({ badges });
  } catch (error) {
    console.error("Admin list badges error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}

/** POST /api/admin/badges - Create a new badge */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const name = readRequiredString(body, "name", 255);
    const description = readOptionalString(body, "description", 1000);
    const image = readOptionalString(body, "image", 500);
    const condition = readOptionalString(body, "condition", 1000);
    const type = typeof body.type === "string" ? body.type : "COMMON";

    if (!name) return apiFailure("VALIDATION_ERROR", "name là bắt buộc", 400);

    const badge = await prisma.badge.create({
      data: {
        name,
        description: description ?? null,
        image: image ?? null,
        condition: condition ?? null,
        type,
      },
    });

    return apiSuccess({ badge }, 201);
  } catch (error) {
    console.error("Admin create badge error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
