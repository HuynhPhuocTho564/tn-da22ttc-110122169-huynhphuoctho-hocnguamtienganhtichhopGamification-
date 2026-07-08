"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GoogleMark from "@/components/auth/GoogleMark";
import PasswordInput from "@/components/auth/PasswordInput";
import { buildAuthHref, getSafeCallbackPath } from "@/lib/auth-redirect";

type LoginFormProps = {
 googleEnabled: boolean;
};

export default function LoginForm({ googleEnabled }: LoginFormProps) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const callbackUrl = getSafeCallbackPath(searchParams.get("callbackUrl"));
 const registered = searchParams.get("registered") === "true";
 const authError = searchParams.get("error");

 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [isGoogleLoading, setIsGoogleLoading] = useState(false);
 const [emailValid, setEmailValid] = useState(false);

 const validateEmail = (email: string) => {
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 return emailRegex.test(email);
 };

 const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
 const newEmail = event.target.value;
 setEmail(newEmail);
 
 if (newEmail.length > 0) {
 setEmailValid(validateEmail(newEmail));
 } else {
 setEmailValid(false);
 }
 };

 const handleSubmit = async (event: React.FormEvent) => {
 event.preventDefault();
 setIsLoading(true);
 setError("");

 try {
 const result = await signIn("credentials", {
 redirect: false,
 email,
 password,
 redirectTo: callbackUrl,
 });

 if (result?.error) {
 setError("Email hoặc mật khẩu không chính xác.");
 return;
 }

 router.push(callbackUrl);
 router.refresh();
  } catch {
 setError("Đã xảy ra lỗi, vui lòng thử lại.");
 } finally {
 setIsLoading(false);
 }
 };

 const handleGoogleSignIn = async () => {
 setIsGoogleLoading(true);
 setError("");
 await signIn("google", { redirectTo: callbackUrl });
 };

 const visibleError =
 error ||
 (authError
 ? "Đăng nhập Google chưa thành công. Hãy thử lại hoặc đăng nhập bằng email."
 : "");

 return (
 <div className="space-y-5">
 {registered && (
 <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-sm font-medium text-success-800" role="status">
 Đăng ký thành công. Hãy đăng nhập để bắt đầu học.
 </div>
 )}

 {googleEnabled && (
 <button
 type="button"
 onClick={handleGoogleSignIn}
 disabled={isGoogleLoading || isLoading}
 className="group relative inline-flex min-h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-neutral-800 shadow-sm transition-all duration-200 hover:border-neutral-400 hover:bg-neutral-50 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 "
 >
 <span className="relative z-10 flex items-center gap-3">
 <GoogleMark />
 {isGoogleLoading ? "Đang chuyển sang Google..." : "Tiếp tục với Google"}
 </span>
 <div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-neutral-100/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 " />
 </button>
 )}

 {googleEnabled && (
 <div className="relative flex items-center gap-3 py-3" aria-hidden="true">
 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-300 to-neutral-300 " />
 <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 ">
 hoặc đăng nhập bằng email
 </span>
 <div className="h-px flex-1 bg-gradient-to-l from-transparent via-neutral-300 to-neutral-300 " />
 </div>
 )}

 <form className="space-y-5" onSubmit={handleSubmit} noValidate>
 <div aria-live="polite" aria-atomic="true">
 {visibleError && (
 <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm font-medium text-error-800 " role="alert">
 {visibleError}
 </div>
 )}
 </div>

 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-bold text-neutral-800 " htmlFor="email">
 Email
 </label>
 <div className="relative">
 <input
 id="email"
 name="email"
 type="email"
 autoComplete="email"
 required
 aria-invalid={Boolean(visibleError) || undefined}
 className="block min-h-12 w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 pr-12 text-base text-neutral-950 shadow-sm outline-none transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-400 focus:border-primary-500 focus:shadow-md focus:ring-4 focus:ring-primary-100 sm:text-sm"
 placeholder="ban@example.com"
 value={email}
 onChange={handleEmailChange}
 />
 {email.length > 0 && emailValid && (
 <div className="absolute right-4 top-1/2 -translate-y-1/2">
 <svg className="h-5 w-5 text-success-600 " viewBox="0 0 20 20" fill="currentColor">
 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
 </svg>
 </div>
 )}
 </div>
 </div>
 <PasswordInput
 id="password"
 name="password"
 label="Mật khẩu"
 autoComplete="current-password"
 required
 placeholder="Nhập mật khẩu"
 value={password}
 onChange={(event) => setPassword(event.target.value)}
 hasError={Boolean(visibleError)}
 />
 <div className="flex justify-end">
 <Link
 href="/forgot-password"
 className="inline-flex min-h-9 items-center rounded-md text-sm font-bold text-primary-700 transition-colors hover:text-primary-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 "
 >
 Quên mật khẩu?
 </Link>
 </div>
 </div>

 <button
 type="submit"
 disabled={isLoading || isGoogleLoading}
 className="group relative inline-flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all duration-200 hover:scale-[1.02] hover:from-primary-700 hover:to-primary-800 hover:shadow-xl hover:shadow-primary-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 "
 >
 <span className="relative z-10">{isLoading ? "Đang xử lý..." : "Đăng nhập"}</span>
 <div className="absolute inset-0 -z-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
 </button>
 </form>

 <p className="text-center text-sm text-neutral-600 ">
 Chưa có tài khoản?{" "}
 <Link
 href={buildAuthHref("/register", callbackUrl)}
 className="font-bold text-primary-700 transition-colors hover:text-primary-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 "
 >
 Đăng ký ngay
 </Link>
 </p>
 </div>
 );
}
