"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";

  if (isAuthPage) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Về chúng tôi</h2>
            <p className="text-sm text-neutral-600">
              Web hỗ trợ phát âm tiếng Anh cho người Việt, sử dụng AI và gamification.
            </p>
          </div>

          <nav aria-label="Liên kết footer">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Liên kết</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/practice" className="text-sm text-neutral-600 transition-colors hover:text-primary-700">
                  Luyện tập
                </Link>
              </li>
              <li>
                <Link href="/learning_map" className="text-sm text-neutral-600 transition-colors hover:text-primary-700">
                  Lộ trình học tập
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-sm text-neutral-600 transition-colors hover:text-primary-700">
                  Bảng xếp hạng
                </Link>
              </li>
              <li>
                <Link href="/badges" className="text-sm text-neutral-600 transition-colors hover:text-primary-700">
                  Huy hiệu
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Liên hệ</h2>
            <p className="text-sm text-neutral-600">Email: support@gmail.com</p>
            <p className="mt-2 text-sm text-neutral-600">Đồ án tốt nghiệp 2026</p>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-8">
          <p className="text-center text-sm text-neutral-500">
            © 2026 LinguaEcho. Tuân thủ WCAG 2.1 AA.
          </p>
        </div>
      </div>
    </footer>
  );
}
