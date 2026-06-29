"use client";

/**
 * Loading skeleton cho /learning_map.
 * Hiển thị trong khi page.tsx (server component) đang fetch data từ Prisma.
 * Cấu trúc skeleton khớp với layout thật để tránh CLS (Cumulative Layout Shift).
 *
 * UX (nielsen H1): User thấy "system status" ngay — đang tải, không phải treo app.
 * Animation: animate-pulse (có sẵn trong Tailwind).
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Đang tải lộ trình học tập">
      <main className="mx-auto max-w-6xl">
        {/* ─── Header skeleton ─── */}
        <section className="mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="mt-3 h-10 w-80 animate-pulse rounded bg-neutral-200" />
              <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-neutral-200" />
            </div>
            <div className="grid w-full grid-cols-3 gap-3 lg:w-[360px]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="mx-auto h-5 w-5 animate-pulse rounded-full bg-neutral-200" />
                  <div className="mx-auto mt-2 h-5 w-12 animate-pulse rounded bg-neutral-200" />
                  <div className="mx-auto mt-2 h-3 w-10 animate-pulse rounded bg-neutral-200" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Map skeleton ─── */}
        <div className="rounded-3xl border border-sky-200 bg-gradient-to-b from-sky-100 via-sky-50 to-blue-100 p-4 shadow-inner sm:p-6 md:p-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                {/* Image area placeholder */}
                <div className="flex min-h-[260px] items-center justify-center bg-neutral-100">
                  <div className="h-32 w-32 animate-pulse rounded-full bg-neutral-200" />
                </div>
                {/* Info bar placeholder */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex-1">
                    <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
                    <div className="mt-2 h-3 w-full max-w-[200px] animate-pulse rounded bg-neutral-200" />
                  </div>
                  <div className="ml-3 h-8 w-24 animate-pulse rounded-lg bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Footer hint ─── */}
        <p className="mt-6 text-center text-base font-normal text-neutral-900">
          Đang tải lộ trình học tập...
        </p>
      </main>
    </div>
  );
}
