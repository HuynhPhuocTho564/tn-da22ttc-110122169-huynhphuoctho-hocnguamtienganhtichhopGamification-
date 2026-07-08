"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Home, Languages, Map, ListTodo, CalendarCheck, Trophy, Award, ShoppingBag, Backpack, User, Settings, LogOut, ChevronDown } from "lucide-react";
import SignOutButton from "./SignOutButton";
import DiamondsDisplay from "@/components/gamification/DiamondsDisplay";

export type NavbarLink = {
 href: string;
 label: string;
};

// Map href → Lucide icon component (H6 — Recognition over recall, consistent style).
// Icons chosen for semantic match: Home, IPA (Languages), Learning Map, Check-in, Shop, Ranking, Badges.
const NAV_ICONS: Record<string, typeof Home> = {
 "/dashboard": Home,
 "/practice": Languages,
 "/learning_map": Map,
 "/missions": ListTodo,
 "/checkin": CalendarCheck,
 "/shop": ShoppingBag,
 "/inventory": Backpack,
 "/leaderboard": Trophy,
 "/badges": Award,
 "/profile": User,
};

type NavbarUser = {
  username: string;
  avatarUrl: string;
  gems: number;
  equippedFrame?: "frame_silver" | "frame_gold" | "frame_diamond" | "frame_fire" | null;
  purchasedItemIds?: string[];
};

type NavbarClientProps = {
 links: NavbarLink[];
 user: NavbarUser | null;
 isAdmin: boolean;
};

function isActivePath(pathname: string, href: string) {
 if (href === "/") return pathname === "/";
 return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(isActive: boolean) {
 return [
 "inline-flex min-h-14 items-center border-b-2 px-2 pt-1 text-base font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ",
 isActive
 ? "border-primary-600 text-primary-700 "
 : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 ",
 ].join(" ");
}

function mobileLinkClass(isActive: boolean) {
  return [
    "block rounded-lg px-4 py-3 text-lg font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500",
    isActive ? "bg-primary-50 text-primary-700 " : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 ",
  ].join(" ");
}

/** Frame ring styles for navbar avatar */
const NAVBAR_FRAME_STYLES: Record<string, string> = {
  frame_silver: "ring-2 ring-slate-400",
  frame_gold: "ring-2 ring-amber-400",
  frame_diamond: "ring-2 ring-cyan-400",
  frame_fire: "ring-2 ring-orange-500",
};

export default function NavbarClient({ links, user, isAdmin }: NavbarClientProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";
  const isAdminPage = pathname.startsWith("/admin");
  const isExerciseRoute = pathname.startsWith("/exercises/");

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Close dropdown on ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isDropdownOpen]);

  // Focus Mode: hide navbar during exercises (MUST be after all hooks)
  if (isExerciseRoute || isAdminPage) return null;

 return (
 <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white ">
 <a
 href="#main-content"
 className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-neutral-900 focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:outline-none focus:ring-4 focus:ring-primary-500"
 >
 Bỏ qua điều hướng
 </a>

 <nav aria-label="Điều hướng chính">
 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div className="flex h-20 items-center justify-between gap-3">
 <Link
 href="/"
 className="flex min-h-11 shrink-0 items-center rounded-lg text-xl font-extrabold tracking-tight text-neutral-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 "
 >
 LinguaEcho
 </Link>

 {!isAuthPage && (
 <div className="hidden flex-1 justify-center gap-6 md:flex">
 {links.map((link) => {
 const active = isActivePath(pathname, link.href);

 return (
 <Link
 key={link.href}
 href={link.href}
 aria-current={active ? "page" : undefined}
 className={navLinkClass(active)}
 >
 {NAV_ICONS[link.href] && (
 (() => {
 const Icon = NAV_ICONS[link.href];
 return <Icon aria-hidden="true" className="mr-3 h-8 w-8" strokeWidth={2} />;
 })()
 )}
 {link.label}
 </Link>
 );
 })}
 </div>
 )}

 {!isAuthPage && <div className="hidden flex-1 md:flex" aria-hidden="true" />}

 <div className="hidden items-center gap-3 md:flex">
 {!isAuthPage && (
 <>
 {isAdmin && (
 <Link
 href="/admin"
 aria-current={isActivePath(pathname, "/admin") ? "page" : undefined}
 className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 "
 >
 Admin
 </Link>
 )}

 {user ? (
 <>
 <DiamondsDisplay initialGems={user.gems} purchasedItemIds={user.purchasedItemIds} />
 <div ref={dropdownRef} className="relative">
 <button
 type="button"
 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
 aria-label={`Menu của ${user.username}`}
 aria-haspopup="true"
 aria-expanded={isDropdownOpen}
 className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 "
 >
  <img
  className={`h-8 w-8 rounded-full bg-neutral-200 ${user.equippedFrame ? NAVBAR_FRAME_STYLES[user.equippedFrame] ?? "" : ""}`}
  src={user.avatarUrl}
  alt=""
  aria-hidden="true"
  />
 <span className="hidden text-sm font-semibold text-neutral-700 lg:inline ">{user.username}</span>
 <ChevronDown
 aria-hidden="true"
 className={`hidden h-5 w-5 text-neutral-600 transition-transform lg:inline ${isDropdownOpen ? "rotate-180" : ""}`}
 />
 </button>

 {isDropdownOpen && (
 <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-neutral-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ">
 <div className="py-1" role="menu" aria-orientation="vertical">
 <Link
 href="/profile"
 onClick={() => setIsDropdownOpen(false)}
 className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none "
 role="menuitem"
 >
 <User aria-hidden="true" className="h-5 w-5 text-neutral-600" />
 Hồ sơ
 </Link>
 <Link
 href="/settings"
 onClick={() => setIsDropdownOpen(false)}
 className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none "
 role="menuitem"
 >
 <Settings aria-hidden="true" className="h-5 w-5 text-neutral-600" />
 Cài đặt
 </Link>
 <div className="border-t border-neutral-200 " />
 <button
 onClick={() => {
 setIsDropdownOpen(false);
 document.querySelector<HTMLButtonElement>('[data-signout-button]')?.click();
 }}
 className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none "
 role="menuitem"
 >
 <LogOut aria-hidden="true" className="h-5 w-5" />
 Đăng xuất
 </button>
 </div>
 </div>
 )}
 </div>
 <SignOutButton className="sr-only" data-signout-button />
 </>
 ) : (
 <div className="flex items-center gap-2">
 <Link
 href="/login"
 className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 "
 >
 Đăng nhập
 </Link>
 <Link
 href="/register"
 className="inline-flex min-h-11 items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
 >
 Đăng ký
 </Link>
 </div>
 )}
 </>
 )}
 </div>

 <div className="flex items-center gap-2 md:hidden">
 {!isAuthPage && (
 <button
 type="button"
 className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-800 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 "
 aria-label={isMobileOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
 aria-expanded={isMobileOpen}
 aria-controls="mobile-navigation"
 onClick={() => setIsMobileOpen((current) => !current)}
 >
 <span aria-hidden="true" className="flex flex-col gap-1">
 <span className={`h-0.5 w-5 rounded bg-neutral-800 transition-transform ${isMobileOpen ? "translate-y-1.5 rotate-45" : ""}`} />
 <span className={`h-0.5 w-5 rounded bg-neutral-800 transition-opacity ${isMobileOpen ? "opacity-0" : ""}`} />
 <span className={`h-0.5 w-5 rounded bg-neutral-800 transition-transform ${isMobileOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
 </span>
 </button>
 )}
 </div>
 </div>
 </div>

 {isMobileOpen && !isAuthPage && (
 <div id="mobile-navigation" className="border-t border-neutral-200 bg-white md:hidden ">
 <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
 {links.map((link) => {
 const active = isActivePath(pathname, link.href);

 return (
 <Link
 key={link.href}
 href={link.href}
 aria-current={active ? "page" : undefined}
 className={mobileLinkClass(active)}
 >
 {NAV_ICONS[link.href] && (
 (() => {
 const Icon = NAV_ICONS[link.href];
 return <Icon aria-hidden="true" className="mr-3 h-8 w-8" strokeWidth={2} />;
 })()
 )}
 {link.label}
 </Link>
 );
 })}

 {isAdmin && (
 <Link
 href="/admin"
 aria-current={isActivePath(pathname, "/admin") ? "page" : undefined}
 className={mobileLinkClass(isActivePath(pathname, "/admin"))}
 >
 Admin
 </Link>
 )}

 <div className="mt-4 border-t border-neutral-200 pt-4 ">
 {user ? (
 <div className="space-y-2">
 <Link
 href="/dashboard"
 className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 "
 >
  <img
  className={`h-9 w-9 rounded-full bg-neutral-200 ${user.equippedFrame ? NAVBAR_FRAME_STYLES[user.equippedFrame] ?? "" : ""}`}
  src={user.avatarUrl}
  alt=""
  aria-hidden="true"
  />
 <span className="font-semibold text-neutral-800 ">{user.username}</span>
 </Link>
 <SignOutButton className="w-full justify-start px-4" />
 </div>
 ) : (
 <div className="grid grid-cols-2 gap-3">
 <Link
 href="/login"
 className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-3 py-2 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 "
 >
 Đăng nhập
 </Link>
 <Link
 href="/register"
 className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
 >
 Đăng ký
 </Link>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </nav>
 </header>
 );
}
