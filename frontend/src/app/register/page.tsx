import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { isGoogleOAuthEnabled } from "@/lib/auth-providers";
import RegisterForm from "./RegisterForm";

function RegisterFallback() {
  return (
    <div className="space-y-5" aria-label="Đang tải form đăng ký">
      <div className="h-11 rounded-lg bg-neutral-100" />
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <div className="h-3 w-12 rounded bg-neutral-100" />
        <div className="h-px flex-1 bg-neutral-200" />
      </div>
      <div className="space-y-4">
        <div className="h-20 rounded-lg bg-neutral-100" />
        <div className="h-16 rounded-lg bg-neutral-100" />
        <div className="h-20 rounded-lg bg-neutral-100" />
        <div className="h-11 rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const googleEnabled = isGoogleOAuthEnabled();

  return (
    <AuthShell
      eyebrow="Đăng ký"
      title="Tạo tài khoản học phát âm"
      description="Lưu tiến độ, EXP, streak và kết quả luyện tập bằng tài khoản của bạn."
    >
      <Suspense fallback={<RegisterFallback />}>
        <RegisterForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
