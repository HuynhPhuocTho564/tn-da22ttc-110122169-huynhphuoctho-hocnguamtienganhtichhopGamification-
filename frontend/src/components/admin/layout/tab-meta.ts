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
  reports: {
    title: "Báo cáo",
    description: "Xem thống kê học tập, điểm trung bình và bài tập được làm nhiều.",
  },
  
  // Maps (4 tabs - horizontal navigation; stress_linking has nested sub-tabs)
  map_vowels: {
    title: "Nguyên âm",
    description: "Quản lý sound group và bài tập thuộc chủ đề Nguyên âm.",
  },
  map_consonants: {
    title: "Phụ âm",
    description: "Quản lý map phụ âm, topics và exercises liên quan.",
  },
  map_minimal_pairs: {
    title: "Minimal Pairs Khó",
    description: "Quản lý map minimal pairs khó, topics và exercises liên quan.",
  },
  map_stress_linking: {
    title: "Trọng âm & Nối âm",
    description: "Quản lý bài tập về trọng âm và nối âm.",
  },
  
  // Gamification (6 dropdown items)
  badges: {
    title: "Huy hiệu",
    description: "Quản trị huy hiệu, rarity, điều kiện unlock và rewards.",
  },
  xp_levels: {
    title: "XP & Cấp độ",
    description: "Cấu hình công thức XP, level progression, milestones và XP sources.",
  },
  gems_economy: {
    title: "Gems & Economy",
    description: "Theo dõi gems circulation, sources/sinks balance và economy health.",
  },
  shop_items: {
    title: "Cửa hàng",
    description: "Quản lý shop items, inventory, power-ups và lucky wheel (future).",
  },
  streaks_quests: {
    title: "Streak & Daily Quests",
    description: "Cấu hình streak mechanics, daily quest templates và rewards.",
  },
  leaderboard: {
    title: "Bảng xếp hạng",
    description: "Xem weekly leaderboard snapshots và export history.",
  },
  
  // Legacy tabs (to be migrated/removed)
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
  lucky_wheel: {
    title: "Spin Wheel",
    description: "Cấu hình 8 ô prize + trọng số, xem lịch sử quay (SpinWheelLog).",
  },
};
