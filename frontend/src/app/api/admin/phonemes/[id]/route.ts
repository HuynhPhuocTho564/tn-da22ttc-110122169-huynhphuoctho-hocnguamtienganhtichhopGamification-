import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiFailure,
  apiSuccess,
  CONTENT_STATUSES,
  readJsonObject,
  readNullableString,
  readOptionalStatus,
  readRequiredString,
  requireAdminSession,
} from "@/lib/admin-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function serializePhoneme(p: {
  id: string;
  symbol: string;
  name: string;
  category: string;
  description: string | null;
  mouthHint: string | null;
  commonMistake: string | null;
  status: string;
}) {
  return {
    id: p.id,
    symbol: p.symbol,
    name: p.name,
    category: p.category,
    description: p.description,
    mouthHint: p.mouthHint,
    commonMistake: p.commonMistake,
    status: p.status,
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) {
      return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);
    }

    const symbol = body.symbol === undefined ? undefined : readRequiredString(body, "symbol", 50);
    const name = body.name === undefined ? undefined : readRequiredString(body, "name", 255);
    const category = body.category === undefined ? undefined : readRequiredString(body, "category", 50);
    const description = readNullableString(body, "description", 1000);
    const mouthHint = readNullableString(body, "mouthHint", 1000);
    const commonMistake = readNullableString(body, "commonMistake", 1000);
    const status = readOptionalStatus(body.status, CONTENT_STATUSES);

    if (symbol === null || name === null || category === null) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu cập nhật không hợp lệ", 400);
    }
    if (description === false || mouthHint === false || commonMistake === false) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu text không hợp lệ", 400);
    }
    if (status === null) {
      return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);
    }

    const existing = await prisma.phoneme.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return apiFailure("PHONEME_NOT_FOUND", "Không tìm thấy phoneme", 404);
    }

    const phoneme = await prisma.phoneme.update({
      where: { id },
      data: {
        ...(symbol !== undefined ? { symbol } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(mouthHint !== undefined ? { mouthHint } : {}),
        ...(commonMistake !== undefined ? { commonMistake } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    return apiSuccess({ phoneme: serializePhoneme(phoneme) });
  } catch (error) {
    console.error("Admin update phoneme error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi cập nhật phoneme", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;

    const existing = await prisma.phoneme.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            soundGroups: true,
            wordItems: true,
          },
        },
      },
    });

    if (!existing) {
      return apiFailure("PHONEME_NOT_FOUND", "Không tìm thấy phoneme", 404);
    }

    if (existing._count.soundGroups > 0 || existing._count.wordItems > 0) {
      return apiFailure(
        "PHONEME_IN_USE",
        "Phoneme đang được sound group hoặc word item sử dụng",
        409,
        serializePhoneme(existing),
      );
    }

    await prisma.phoneme.delete({ where: { id } });
    return apiSuccess({ deletedId: id });
  } catch (error) {
    console.error("Admin delete phoneme error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi xóa phoneme", 500);
  }
}
