import IPAChart from "@/components/ipa/IPAChart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Luyện Tập Phát Âm | LinguaEcho',
  description: 'Bảng IPA và các bài tập luyện phát âm tiếng Anh',
}

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">
            Luyện Tập Phát Âm
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-neutral-600 sm:mt-4">
            Khám phá 44 âm vị tiếng Anh. Nhấn vào từng âm để nghe mẫu.
          </p>
        </div>

        {/* IPA Chart Section */}
        <section aria-label="Bảng IPA Tiếng Anh">
          <IPAChart />
        </section>
        
      </main>
    </div>
  );
}
