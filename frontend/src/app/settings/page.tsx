import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg mb-6"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          Quay lại Dashboard
        </Link>

        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-neutral-900 mb-6">Cài đặt</h1>

          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-center text-neutral-600">
                Trang Cài đặt đang được phát triển...
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-neutral-800">Các tính năng sắp có:</h2>
              <ul className="list-disc list-inside space-y-2 text-neutral-700">
                <li>Ngôn ngữ giao diện</li>
                <li>Thông báo</li>
                <li>Âm thanh và hiệu ứng</li>
                <li>Chế độ tối (Dark mode)</li>
                <li>Quyền riêng tư</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
