"use client";

import { useState } from "react";
import Link from "next/link";

type ForgotPasswordResponse = {
 success: boolean;
 data?: {
 message?: string;
 resetUrl?: string;
 };
 error?: {
 message?: string;
 };
};

export default function ForgotPasswordForm() {
 const [email, setEmail] = useState("");
 const [message, setMessage] = useState("");
 const [resetUrl, setResetUrl] = useState("");
 const [error, setError] = useState("");
 const [isLoading, setIsLoading] = useState(false);

 const handleSubmit = async (event: React.FormEvent) => {
 event.preventDefault();
 setIsLoading(true);
 setMessage("");
 setResetUrl("");
 setError("");

 try {
 const response = await fetch("/api/auth/forgot-password", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email }),
 });
 const payload = (await response.json()) as ForgotPasswordResponse;

 if (!response.ok) {
 setError(payload.error?.message ?? "Không thể tạo liên kết đặt lại mật khẩu.");
 return;
 }

 setMessage(payload.data?.message ?? "Nếu email tồn tại, hệ thống đã tạo liên kết đặt lại mật khẩu.");
 setResetUrl(payload.data?.resetUrl ?? "");
 } catch (requestError) {
 setError("Đã xảy ra lỗi hệ thống, vui lòng thử lại.");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="space-y-5">
 <form className="space-y-5" onSubmit={handleSubmit} noValidate>
 <div aria-live="polite" aria-atomic="true" className="space-y-3">
 {message && (
 <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-sm font-medium text-success-800 " role="status">
 <p>{message}</p>
 {resetUrl && (
 <Link
 href={resetUrl}
 className="mt-3 inline-flex font-bold text-primary-700 hover:text-primary-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 "
 >
 Mở liên kết đặt lại mật khẩu
 </Link>
 )}
 </div>
 )}

 {error && (
 <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm font-medium text-error-800 " role="alert">
 {error}
 </div>
 )}
 </div>

 <div className="space-y-2">
 <label className="text-sm font-bold text-neutral-800 " htmlFor="email">
 Email
 </label>
 <input
 id="email"
 name="email"
 type="email"
 autoComplete="email"
 required
 className="block min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 sm:text-sm"
 placeholder="ban@example.com"
 value={email}
 onChange={(event) => setEmail(event.target.value)}
 />
 </div>

 <button
 type="submit"
 disabled={isLoading}
 className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 "
 >
 {isLoading ? "Đang xử lý..." : "Gửi liên kết đặt lại"}
 </button>
 </form>

 <p className="text-center text-sm text-neutral-600 ">
 Nhớ mật khẩu?{" "}
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
