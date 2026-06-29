import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { isGoogleOAuthEnabled } from "@/lib/auth-providers";
import LoginForm from "./LoginForm";

function LoginFallback() {
  return (
    <div className="space-y-5" aria-label="Đang tải form đăng nhập">
      <div className="h-11 rounded-lg bg-neutral-100" />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <div className="h-3 w-12 rounded bg-neutral-100" />
        <div className="h-px flex-1 bg-neutral-200" />
      </div>
      <div className="space-y-4">
        <div className="h-16 rounded-lg bg-neutral-100" />
        <div className="h-16 rounded-lg bg-neutral-100" />
        <div className="h-11 rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const googleEnabled = isGoogleOAuthEnabled();

  return (
    <AuthShell
      eyebrow="Đăng nhập"
      title="Chào mừng bạn quay lại"
      description="Tiếp tục luyện phát âm và theo dõi EXP, streak, huy hiệu của bạn."
    >
      <Suspense fallback={<LoginFallback />}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
