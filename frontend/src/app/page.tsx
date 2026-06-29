import Link from "next/link";
import Button from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            {/* Task 1.3.2 (ui-ux roadmap): ẩn badge "Đồ án tốt nghiệp 2026" —
                không phục vụ user goal học phát âm, chỉ tăng extraneous cognitive load (Nielsen H8).
                Giữ comment để dễ khôi phục nếu cần cho mục đích khác. */}
            {/* <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Đồ án tốt nghiệp 2026
            </div> */}

            <h1 className="mb-6 text-5xl font-bold leading-tight text-neutral-900 sm:text-6xl lg:text-7xl">
              Chinh phục phát âm
              <br />
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                tiếng Anh chuẩn
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-3xl text-xl text-neutral-600">
              Học 44 âm vị IPA với công nghệ AI, nhận phản hồi tức thì và theo dõi tiến độ qua gamification.
              Dành riêng cho người Việt.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  }
                >
                  Bắt đầu miễn phí
                </Button>
              </Link>
              <Link href="/practice">
                <Button variant="secondary" size="lg">
                  Xem bảng IPA
                </Button>
              </Link>
            </div>

            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-primary-600">44</div>
                <div className="mt-1 text-sm text-neutral-600">Âm vị IPA</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent-600">AI</div>
                <div className="mt-1 text-sm text-neutral-600">Chấm điểm tự động</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-success-600">100%</div>
                <div className="mt-1 text-sm text-neutral-600">Miễn phí</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute right-0 top-0 h-96 w-96 rounded-full bg-accent-200 opacity-20 mix-blend-multiply blur-3xl filter"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary-200 opacity-20 mix-blend-multiply blur-3xl filter"
          aria-hidden="true"
        />
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-neutral-900">Tính năng nổi bật</h2>
            <p className="text-lg text-neutral-600">Học phát âm hiệu quả với công nghệ hiện đại</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 p-8 transition-all hover:border-primary-300 hover:shadow-lg">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-100">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-neutral-900">Ghi âm & phân tích</h3>
              <p className="text-neutral-600">
                Ghi âm giọng nói của bạn và nhận phản hồi tức thì về độ chính xác phát âm từng âm vị.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-8 transition-all hover:border-accent-300 hover:shadow-lg">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-accent-100">
                <svg className="h-8 w-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-neutral-900">Theo dõi tiến độ</h3>
              <p className="text-neutral-600">
                Xem biểu đồ tiến độ, điểm EXP và chuỗi ngày luyện tập để duy trì động lực học tập.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-8 transition-all hover:border-success-300 hover:shadow-lg">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-success-100">
                <svg className="h-8 w-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-bold text-neutral-900">Gamification</h3>
              <p className="text-neutral-600">
                Thu thập huy hiệu, tăng cấp và cạnh tranh trên bảng xếp hạng với các học viên khác.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-4xl font-bold text-white">Sẵn sàng cải thiện phát âm?</h2>
          <p className="mb-8 text-xl text-primary-100">
            Tham gia ngay hôm nay và bắt đầu hành trình chinh phục 44 âm vị tiếng Anh
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-neutral-50">
              Đăng ký miễn phí
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
