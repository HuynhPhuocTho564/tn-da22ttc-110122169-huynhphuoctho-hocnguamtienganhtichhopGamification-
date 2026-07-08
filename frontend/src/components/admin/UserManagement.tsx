"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { AdminErrorBlock } from "@/components/admin/ui";
import AdminSearchInput from "./layout/AdminSearchInput";
import Pagination, { PAGE_SIZE } from "./layout/Pagination";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

function statusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "BANNED") return "error" as const;
  return "default" as const;
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "Đang hoạt động";
  if (status === "INACTIVE") return "Tạm ngưng";
  if (status === "BANNED") return "Bị khóa";
  return status;
}

type UserDetail = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  xp: number;
  level: number;
  streakCount: number;
  longestStreak: number;
  gems: number;
  streakFreezes: number;
  totalCheckIns: number;
  currentTier: string;
  attemptCount: number;
  badgeCount: number;
};

export default function UserManagement({ users: initialUsers }: { users: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Detail modal state
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Edit modal state
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editStatus, setEditStatus] = useState<string>("ACTIVE");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return users.filter((user) => user.username.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword));
  }, [searchTerm, users]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleViewDetail = async (user: AdminUser) => {
    setDetailError(null);
    setDetailLoading(true);
    setDetailUser(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/detail`);
      const data = await res.json();
      if (!data.success) { setDetailError(data.error?.message || "Lỗi"); return; }
      setDetailUser(data.data.user);
    } catch {
      setDetailError("Không thể kết nối server");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditStatus(user.status);
    setEditError(null);
  };

  const handleSaveStatus = async () => {
    if (!editUser) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        setEditError(data.error?.message || "Cập nhật thất bại");
        return;
      }
      // Update local state
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, status: editStatus } : u));
      setEditUser(null);
    } catch {
      setEditError("Không thể kết nối server");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-600">Tổng số: {users.length} người dùng (trang {page}/{totalPages || 1})</p>
            </div>
          </div>

          <AdminSearchInput id="admin-user-search" aria-label="Tìm kiếm người dùng" value={searchTerm} onChange={(v) => { setSearchTerm(v); setPage(1); }} placeholder="Tìm kiếm theo tên hoặc email..." className="mb-6" />

          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Danh sách người dùng trong hệ thống</caption>
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Tên người dùng</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vai trò</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.role}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(user.status)} size="sm">{statusLabel(user.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleViewDetail(user)} className="text-sm font-semibold text-emerald-600 hover:underline">Xem</button>
                        <button type="button" onClick={() => handleOpenEdit(user)} className="text-sm font-semibold text-blue-600 hover:underline">Sửa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p>Không tìm thấy người dùng nào</p>
            </div>
          )}
        </div>
      </Card>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal xem chi tiết user */}
      {detailUser !== null || detailLoading || detailError ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => { setDetailUser(null); setDetailError(null); }}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết người dùng</h3>
              <button type="button" onClick={() => { setDetailUser(null); setDetailError(null); }} className="text-slate-400 hover:text-slate-600" aria-label="Đóng">×</button>
            </div>

            {detailLoading && <p className="py-8 text-center text-slate-500">Đang tải...</p>}
            {detailError && <AdminErrorBlock message={detailError} />}
            {detailUser && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">Tên đăng nhập</dt><dd className="font-semibold text-slate-900">{detailUser.username}</dd></div>
                <div><dt className="text-slate-500">Email</dt><dd className="font-semibold text-slate-900">{detailUser.email}</dd></div>
                <div><dt className="text-slate-500">Vai trò</dt><dd className="font-semibold text-slate-900">{detailUser.role}</dd></div>
                <div><dt className="text-slate-500">Trạng thái</dt><dd><Badge variant={statusVariant(detailUser.status)} size="sm">{statusLabel(detailUser.status)}</Badge></dd></div>
                <div><dt className="text-slate-500">XP</dt><dd className="font-semibold text-slate-900">{detailUser.xp}</dd></div>
                <div><dt className="text-slate-500">Cấp độ</dt><dd className="font-semibold text-slate-900">{detailUser.level}</dd></div>
                <div><dt className="text-slate-500">Streak hiện tại</dt><dd className="font-semibold text-slate-900">{detailUser.streakCount} ngày</dd></div>
                <div><dt className="text-slate-500">Streak dài nhất</dt><dd className="font-semibold text-slate-900">{detailUser.longestStreak} ngày</dd></div>
                <div><dt className="text-slate-500">Gems</dt><dd className="font-semibold text-slate-900">{detailUser.gems}</dd></div>
                <div><dt className="text-slate-500">Bùa đóng băng</dt><dd className="font-semibold text-slate-900">{detailUser.streakFreezes}</dd></div>
                <div><dt className="text-slate-500">Tổng check-in</dt><dd className="font-semibold text-slate-900">{detailUser.totalCheckIns}</dd></div>
                <div><dt className="text-slate-500">Hạng</dt><dd className="font-semibold text-slate-900 capitalize">{detailUser.currentTier}</dd></div>
                <div><dt className="text-slate-500">Lượt làm bài</dt><dd className="font-semibold text-slate-900">{detailUser.attemptCount}</dd></div>
                <div><dt className="text-slate-500">Huy hiệu</dt><dd className="font-semibold text-slate-900">{detailUser.badgeCount}</dd></div>
                <div className="col-span-2"><dt className="text-slate-500">Ngày tạo</dt><dd className="font-semibold text-slate-900">{new Date(detailUser.createdAt).toLocaleString("vi-VN")}</dd></div>
              </dl>
            )}
          </div>
        </div>
      ) : null}

      {/* Modal sửa trạng thái user */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setEditUser(null)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Sửa trạng thái</h3>
              <button type="button" onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600" aria-label="Đóng">×</button>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              <span className="font-semibold">{editUser.username}</span> ({editUser.email})
            </p>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Trạng thái</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm ngưng</option>
                <option value="BANNED">Bị khóa</option>
              </select>
            </div>
            {editError && <p className="mb-3 text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditUser(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Hủy</button>
              <button type="button" onClick={handleSaveStatus} disabled={editSaving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {editSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
