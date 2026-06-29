"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import AdminErrorBlock from "./layout/AdminErrorBlock";
import AdminSearchInput from "./layout/AdminSearchInput";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Detail modal state
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Reset password modal state
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetUsername, setResetUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.toLowerCase();
    return users.filter((user) => user.username.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword));
  }, [searchTerm, users]);

  const handleEdit = (user: AdminUser) => {
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditingId(user.id);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole, status: editStatus }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error?.message || "Lỗi"); return; }
      const updated = data.data.user;
      setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...u, role: updated.role.name, status: updated.status } : u)));
      setEditingId(null);
    } catch { setError("Không thể kết nối server"); }
  };

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

  const openResetModal = (user: AdminUser) => {
    setResetUserId(user.id);
    setResetUsername(user.username);
    setNewPassword("");
    setResetError(null);
    setResetSuccess(null);
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    setResetError(null);
    setResetSuccess(null);
    setResetLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUserId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!data.success) { setResetError(data.error?.message || "Lỗi"); return; }
      setResetSuccess(data.data.message || "Đã đặt lại mật khẩu");
      setNewPassword("");
    } catch {
      setResetError("Không thể kết nối server");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quản lý người dùng</h2>
              <p className="mt-1 text-sm text-slate-600">Tổng số: {users.length} người dùng</p>
            </div>
          </div>

          {error && <AdminErrorBlock message={error} className="mb-4" />}

          <AdminSearchInput id="admin-user-search" aria-label="Tìm kiếm người dùng" value={searchTerm} onChange={setSearchTerm} placeholder="Tìm kiếm theo tên hoặc email..." className="mb-6" />

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
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {editingId === user.id ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm">
                          <option value="User">User</option>
                          <option value="Admin">Admin</option>
                        </select>
                      ) : user.role}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === user.id ? (
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm">
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="BANNED">BANNED</option>
                        </select>
                      ) : (
                        <Badge variant={statusVariant(user.status)} size="sm">{statusLabel(user.status)}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="px-4 py-3">
                      {editingId === user.id ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={handleSave} className="text-sm font-semibold text-blue-600 hover:underline">Lưu</button>
                          <button type="button" onClick={() => setEditingId(null)} className="text-sm text-slate-500 hover:underline">Hủy</button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleEdit(user)} className="text-sm font-semibold text-blue-600 hover:underline">Sửa</button>
                          <button type="button" onClick={() => handleViewDetail(user)} className="text-sm font-semibold text-emerald-600 hover:underline">Chi tiết</button>
                          <button type="button" onClick={() => openResetModal(user)} className="text-sm font-semibold text-amber-600 hover:underline">Reset MK</button>
                        </div>
                      )}
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

      {/* Modal reset mật khẩu */}
      {resetUserId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setResetUserId(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Đặt lại mật khẩu</h3>
              <button type="button" onClick={() => setResetUserId(null)} className="text-slate-400 hover:text-slate-600" aria-label="Đóng">×</button>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Đặt mật khẩu mới cho user <span className="font-semibold text-slate-900">{resetUsername}</span>. Mật khẩu phải có ít nhất 6 ký tự.
            </p>

            {resetError && <AdminErrorBlock message={resetError} className="mb-4" />}
            {resetSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{resetSuccess}</div>
            )}

            <label className="mb-1 block text-sm font-semibold text-slate-700">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nhập mật khẩu mới (≥ 6 ký tự)"
              minLength={6}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading || newPassword.length < 6}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resetLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </button>
              <button
                type="button"
                onClick={() => setResetUserId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
