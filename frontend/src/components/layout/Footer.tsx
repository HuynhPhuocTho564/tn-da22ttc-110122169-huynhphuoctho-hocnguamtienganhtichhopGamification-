"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password";
  const isExerciseRoute = pathname.startsWith("/exercises/");

  if (isAuthPage || isExerciseRoute) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Về LinguaEcho</h2>
            <p className="text-sm leading-relaxed text-neutral-600">
              LinguaEcho là nền tảng luyện phát âm tiếng Anh dành cho người Việt, ứng dụng công nghệ nhận dạng giọng nói (AI) và phương pháp học tập qua trò chơi (gamification) để giúp bạn cải thiện phát âm một cách chủ động và thú vị.
            </p>
          </div>

          <nav aria-label="Liên kết footer">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-900">Liên kết</h2>
            <ul className="space-y-3">
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
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-8">
          <p className="text-center text-sm text-neutral-500">
            © 2026 LinguaEcho. Tuân thủ WCAG 2.1 AA.
          </p>
          <p className="text-center text-xs text-neutral-400 mt-2">
            Icons made by <a href="https://www.flaticon.com/" title="Flaticon" className="hover:text-neutral-600 transition-colors">Flaticon</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
