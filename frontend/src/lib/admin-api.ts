import { NextResponse } from "next/server";
import type { Prisma, PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

export const EXERCISE_STATUSES = ["ACTIVE", "LOCKED", "DRAFT", "ARCHIVED"] as const;
export const QUESTION_STATUSES = ["ACTIVE", "DRAFT", "NEEDS_REVIEW", "ARCHIVED"] as const;
export const MAP_STATUSES = ["ACTIVE", "LOCKED", "DRAFT", "ARCHIVED"] as const;

/**
 * Shared content status values — used by all admin CRUD routes.
 * maintainable-code DRY-2: single source instead of 13 local copies.
 */
export const CONTENT_STATUSES = ["DRAFT", "NEEDS_REVIEW", "ACTIVE", "ARCHIVED"] as const;

/**
 * Shared user status values for admin user management.
 */
export const USER_STATUSES = ["ACTIVE", "INACTIVE", "BANNED"] as const;

type AdminDbClient = PrismaClient | Prisma.TransactionClient;

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiFailure(code: string, message: string, status = 400, data?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
      ...(data ? { data } : {}),
    },
    { status },
  );
}

/**
 * Extract authenticated user ID from session.
 * Returns null if not authenticated.
 * maintainable-code DRY-5: replaces duplicate getSessionUserId() in route files.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: apiFailure("UNAUTHENTICATED", "Cần đăng nhập để sử dụng chức năng admin", 401),
    };
  }

  if (session.user.role !== "Admin") {
    return {
      ok: false as const,
      response: apiFailure("FORBIDDEN", "Tài khoản không có quyền admin", 403),
    };
  }

  return {
    ok: true as const,
    userId: session.user.id,
    role: session.user.role,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function readJsonObject(request: Request) {
  const body = await request.json().catch(() => null);
  return isRecord(body) ? body : null;
}

export function readRequiredString(body: Record<string, unknown>, field: string, maxLength = 255) {
  const value = body[field];
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export function readOptionalString(body: Record<string, unknown>, field: string, maxLength = 1000) {
  const value = body[field];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

export function readNullableString(body: Record<string, unknown>, field: string, maxLength = 1000) {
  if (!(field in body)) return undefined;

  const value = body[field];
  if (value === null || value === "") return null;
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (trimmed.length > maxLength) return false;
  return trimmed || null;
}

export function readOptionalInt(body: Record<string, unknown>, field: string, min = 0, max = 86400) {
  const value = body[field];
  if (value === undefined || value === null || value === "") return undefined;

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < min || numeric > max) return null;
  return numeric;
}

export function readNullableInt(body: Record<string, unknown>, field: string, min = 0, max = 86400) {
  if (!(field in body)) return undefined;

  const value = body[field];
  if (value === null || value === "") return null;

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < min || numeric > max) return false;
  return numeric;
}

export function readStatus<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]) {
  if (value === undefined || value === null || value === "") return fallback;
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

export function readOptionalStatus<T extends readonly string[]>(value: unknown, allowed: T) {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

export async function refreshExerciseQuestionCount(db: AdminDbClient, exerciseId: string) {
  const activeQuestionCount = await db.question.count({
    where: {
      exerciseId,
      status: "ACTIVE",
    },
  });

  await db.exercise.update({
    where: { id: exerciseId },
    data: {
      questionCount: activeQuestionCount,
    },
  });

  return activeQuestionCount;
}
