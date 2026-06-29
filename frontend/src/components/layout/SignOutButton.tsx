"use client";

import { signOut } from "next-auth/react";

type SignOutButtonProps = {
 className?: string;
 "data-signout-button"?: boolean;
};

export default function SignOutButton({ className = "", ...props }: SignOutButtonProps) {
 return (
 <button
 type="button"
 onClick={() => signOut({ callbackUrl: "/login" })}
 className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${className}`}
 {...props}
 >
 Đăng xuất
 </button>
 );
}
