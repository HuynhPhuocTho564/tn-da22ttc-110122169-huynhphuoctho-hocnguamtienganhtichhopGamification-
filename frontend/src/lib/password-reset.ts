import crypto from "node:crypto";

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createPasswordResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiresAt(now = new Date()) {
  return new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

export function getAppBaseUrl(request: Request) {
  const configuredUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export function buildPasswordResetUrl(request: Request, token: string) {
  const url = new URL("/reset-password", getAppBaseUrl(request));
  url.searchParams.set("token", token);
  return url.toString();
}
