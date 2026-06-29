/**
 * Sidebar section definition.
 *
 * Single "Quản trị" section listing all admin modules.
 */

import { AudioLines, Award, BarChart3, BookOpen, FolderTree, LayoutDashboard, Users } from "lucide-react";
import type { SidebarSection } from "./types";

export const sidebarSections: SidebarSection[] = [
  {
    label: "Quản trị",
    items: [
      { id: "overview", name: "Dashboard", description: "Tổng quan hệ thống", icon: LayoutDashboard },
      { id: "users", name: "Người dùng", description: "Tài khoản, role, trạng thái", icon: Users },
      { id: "topics", name: "Nội dung học tập", description: "Chủ đề, phoneme, từ vựng, nhóm âm", icon: FolderTree },
      { id: "exercises", name: "Bài tập", description: "Bài luyện và ngân hàng câu", icon: BookOpen },
      { id: "audio", name: "Âm thanh", description: "File audio dùng trong bài học", icon: AudioLines },
      { id: "badges", name: "Gamification", description: "Huy hiệu và điều kiện nhận", icon: Award },
      { id: "reports", name: "Báo cáo", description: "Hiệu suất 7 ngày gần nhất", icon: BarChart3 },
    ],
  },
];
