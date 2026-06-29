import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "./ResetPasswordForm";

function ResetPasswordFallback() {
 return (
 <div className="space-y-5" aria-label="Đang tải form đặt lại mật khẩu">
 <div className="h-16 rounded-lg bg-neutral-100 " />
 <div className="h-11 rounded-lg bg-neutral-100 " />
 </div>
 );
}

export default function ResetPasswordPage() {
 return (
 <AuthShell
 eyebrow="Mật khẩu mới"
 title="Đặt lại mật khẩu"
 description="Tạo mật khẩu mới để tiếp tục đăng nhập bằng email."
 >
 <Suspense fallback={<ResetPasswordFallback />}>
 <ResetPasswordForm />
 </Suspense>
 </AuthShell>
 );
}
