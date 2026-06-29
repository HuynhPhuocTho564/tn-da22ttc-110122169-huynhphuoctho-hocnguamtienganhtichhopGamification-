/**
 * Tab metadata (title + description) for each AdminTab.
 *
 * Shared between PageHeader (renders title + description) and the main
 * AdminDashboardClient render (uses title for the <section> aria-label).
 */

import type { AdminTab } from "./types";
import type { TabMeta } from "./types";

export const tabMeta: Record<AdminTab, TabMeta> = {
  overview: {
    title: "Dashboard",
    description: "Theo dõi nhanh người dùng, lượt luyện tập, nội dung và trạng thái dữ liệu thật.",
  },
  users: {
    title: "Người dùng",
    description: "Quản trị tài khoản thật trong hệ thống, role và trạng thái hoạt động.",
  },
  exercises: {
    title: "Bài tập",
    description: "Quản lý bài luyện phát âm, câu hỏi gắn kèm và ngân hàng câu hỏi.",
  },
  topics: {
    title: "Nội dung học tập",
    description: "Tổ chức chủ đề, bản đồ học tập, âm IPA, nhóm âm, từ vựng và câu luyện đọc.",
  },
  phonemes: {
    title: "Phoneme",
    description: "Chuẩn hóa âm vị, mô tả, lỗi thường gặp và hướng dẫn khẩu hình.",
  },
  words: {
    title: "Từ vựng",
    description: "Quản lý từ, IPA, độ khó, nghĩa tiếng Việt và trạng thái review.",
  },
  soundgroups: {
    title: "Nhóm âm",
    description: "Gom phoneme, minimal pair và câu luyện đọc theo mục tiêu phát âm.",
  },
  questions: {
    title: "Ngân hàng câu hỏi",
    description: "Kiểm soát prompt, answer, loại câu hỏi và trạng thái nội dung.",
  },
  minimalpairs: {
    title: "Minimal Pairs",
    description: "Quản lý cặp từ đối lập để luyện phân biệt âm gần nhau.",
  },
  sentences: {
    title: "Câu luyện đọc",
    description: "Quản lý sentence item, độ khó và ghi chú review.",
  },
  audio: {
    title: "Âm thanh",
    description: "Kiểm tra file audio, giới hạn phát và nơi đang được dùng.",
  },
  badges: {
    title: "Huy hiệu",
    description: "Quản trị huy hiệu, điều kiện nhận và phần thưởng tạo động lực học.",
  },
  xp_level: {
    title: "XP & Cấp độ",
    description: "Cấu hình công thức XP, ngưỡng lên cấp và hệ số nhân.",
  },
  gems_streak: {
    title: "Gems & Streak",
    description: "Cấu hình phần thưởng Gems, bùa đóng băng streak và chu kỳ check-in.",
  },
  daily_quest: {
    title: "Daily Quest",
    description: "Cấu hình nhiệm vụ hàng ngày, mục tiêu và phần thưởng.",
  },
  lucky_wheel: {
    title: "Vòng quay may mắn",
    description: "Cấu hình vòng quay, các ô phần thưởng và xác suất trúng.",
  },
  reports: {
    title: "Báo cáo",
    description: "Xem thống kê học tập, điểm trung bình và bài tập được làm nhiều.",
  },
};
