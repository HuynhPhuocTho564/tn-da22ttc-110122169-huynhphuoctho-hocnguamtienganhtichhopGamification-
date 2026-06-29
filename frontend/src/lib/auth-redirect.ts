const DEFAULT_CALLBACK_PATH = "/dashboard";

export function getSafeCallbackPath(value: string | null | undefined) {
  const path = value?.trim();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return DEFAULT_CALLBACK_PATH;
  }

  if (path === "/login" || path.startsWith("/login?") || path === "/register" || path.startsWith("/register?")) {
    return DEFAULT_CALLBACK_PATH;
  }

  return path;
}

export function buildAuthHref(pathname: "/login" | "/register", callbackUrl: string) {
  const safeCallbackUrl = getSafeCallbackPath(callbackUrl);

  if (safeCallbackUrl === DEFAULT_CALLBACK_PATH) {
    return pathname;
  }

  const params = new URLSearchParams({ callbackUrl: safeCallbackUrl });
  return `${pathname}?${params.toString()}`;
}
