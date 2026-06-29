import ForgotPasswordForm from "./ForgotPasswordForm";
import AuthShell from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Khôi phục"
      title="Quên mật khẩu?"
      description="Nhập email tài khoản để nhận liên kết đặt lại mật khẩu."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
