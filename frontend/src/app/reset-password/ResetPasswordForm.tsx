"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PasswordInput from "@/components/auth/PasswordInput";

type ResetPasswordResponse = {
 success: boolean;
 data?: {
 message?: string;
 };
 error?: {
 message?: string;
 };
};

export default function ResetPasswordForm() {
 const searchParams = useSearchParams();
 const token = searchParams.get("token") ?? "";
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [message, setMessage] = useState("");
 const [error, setError] = useState("");
 const [isLoading, setIsLoading] = useState(false);

 const handleSubmit = async (event: React.FormEvent) => {
 event.preventDefault();
 setMessage("");
 setError("");

 if (!token) {
 setError("Liên kết đặt lại mật khẩu không hợp lệ.");
 return;
 }

 if (password !== confirmPassword) {
 setError("Mật khẩu nhập lại chưa khớp.");
 return;
 }

 setIsLoading(true);

 try {
 const response = await fetch("/api/auth/reset-password", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ token, password }),
 });
 const payload = (await response.json()) as ResetPasswordResponse;

 if (!response.ok) {
 setError(payload.error?.message ?? "Không thể đặt lại mật khẩu.");
 return;
 }

 setMessage(payload.data?.message ?? "Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.");
 setPassword("");
 setConfirmPassword("");
 } catch (requestError) {
 setError("Đã xảy ra lỗi hệ thống, vui lòng thử lại.");
 } finally {
 setIsLoading(false);
 }
 };

 if (!token) {
 return (
 <div className="space-y-5">
 <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm font-medium text-error-800 " role="alert">
 Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token.
 </div>
 <Link
 href="/forgot-password"
 className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
 >
 Yêu cầu liên kết mới
 </Link>
 </div>
 );
 }

 return (
 <div className="space-y-5">
 <form className="space-y-5" onSubmit={handleSubmit} noValidate>
 <div aria-live="polite" aria-atomic="true" className="space-y-3">
 {message && (
 <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-sm font-medium text-success-800 " role="status">
 {message}
 </div>
 )}

 {error && (
 <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm font-medium text-error-800 " role="alert">
 {error}
 </div>
 )}
 </div>

 <div className="space-y-4">
 <PasswordInput
 id="password"
 name="password"
 label="Mật khẩu mới"
 autoComplete="new-password"
 required
 minLength={6}
 placeholder="Tối thiểu 6 ký tự"
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 helpText="Dùng mật khẩu mới này cho lần đăng nhập tiếp theo."
 hasError={Boolean(error)}
 />
 <PasswordInput
 id="confirm-password"
 name="confirmPassword"
 label="Nhập lại mật khẩu"
 autoComplete="new-password"
 required
 minLength={6}
 placeholder="Nhập lại mật khẩu mới"
 value={confirmPassword}
 onChange={(event) => setConfirmPassword(event.target.value)}
 hasError={Boolean(error)}
 />
 </div>

 <button
 type="submit"
 disabled={isLoading}
 className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 "
 >
 {isLoading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
 </button>
 </form>

 <p className="text-center text-sm text-neutral-600 ">
 Đã đặt lại xong?{" "}
 <Link
 href="/login"
 className="font-bold text-primary-700 transition-colors hover:text-primary-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 "
 >
 Đăng nhập
 </Link>
 </p>
 </div>
 );
}
