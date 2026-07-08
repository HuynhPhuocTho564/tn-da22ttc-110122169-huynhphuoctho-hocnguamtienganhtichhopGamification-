import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiFailure,
  apiSuccess,
  CONTENT_STATUSES,
  readJsonObject,
  readOptionalString,
  readRequiredString,
  readStatus,
  requireAdminSession,
} from "@/lib/admin-api";

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

export async function GET() {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const phonemes = await prisma.phoneme.findMany({
      orderBy: [{ category: "asc" }, { symbol: "asc" }],
    });

    return apiSuccess({ phonemes: phonemes.map(serializePhoneme) });
  } catch (error) {
    console.error("Admin list phonemes error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy phonemes", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const body = await readJsonObject(request);
    if (!body) {
      return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);
    }

    const symbol = readRequiredString(body, "symbol", 50);
    const name = readRequiredString(body, "name", 255);
    const category = readRequiredString(body, "category", 50);
    const description = readOptionalString(body, "description", 1000);
    const mouthHint = readOptionalString(body, "mouthHint", 1000);
    const commonMistake = readOptionalString(body, "commonMistake", 1000);
    const status = readStatus(body.status, CONTENT_STATUSES, "ACTIVE");

    if (!symbol || !name || !category) {
      return apiFailure("VALIDATION_ERROR", "symbol, name, category là bắt buộc", 400);
    }
    if (description === null || mouthHint === null || commonMistake === null) {
      return apiFailure("VALIDATION_ERROR", "Dữ liệu text không hợp lệ", 400);
    }
    if (!status) {
      return apiFailure("VALIDATION_ERROR", "status không hợp lệ", 400);
    }

    const phoneme = await prisma.phoneme.create({
      data: { symbol, name, category, description, mouthHint, commonMistake, status },
    });

    return apiSuccess({ phoneme: serializePhoneme(phoneme) }, 201);
  } catch (error) {
    console.error("Admin create phoneme error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi tạo phoneme", 500);
  }
}
