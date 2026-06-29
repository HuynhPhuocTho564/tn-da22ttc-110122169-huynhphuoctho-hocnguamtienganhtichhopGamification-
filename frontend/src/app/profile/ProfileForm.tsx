"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type User = {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  level: number;
  xp: number;
};

type Props = {
  user: User;
};

export default function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "danger">("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile form state
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Cập nhật thất bại");
      }

      setMessage({ type: "success", text: "Cập nhật thành công!" });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Đổi mật khẩu thất bại");
      }

      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user.username) {
      setMessage({ type: "error", text: "Tên người dùng không khớp" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/delete", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Xóa tài khoản thất bại");
      }

      // Redirect to login after delete
      window.location.href = "/login?message=account-deleted";
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 border-b border-neutral-200">
        <nav className="flex gap-4" aria-label="Profile tabs">
          <button
            onClick={() => setActiveTab("profile")}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "profile"
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
            }`}
          >
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "password"
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
            }`}
          >
            Đổi mật khẩu
          </button>
          <button
            onClick={() => setActiveTab("danger")}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "danger"
                ? "border-error-600 text-error-700"
                : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
            }`}
          >
            Xóa tài khoản
          </button>
        </nav>
      </div>

      {/* Message alert */}
      {message && (
        <div
          className={`mb-6 rounded-lg border-2 p-4 ${
            message.type === "success"
              ? "border-success-300 bg-success-50 text-success-800"
              : "border-error-300 bg-error-50 text-error-800"
          }`}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card padding="lg">
          <div className="mb-6 flex items-center gap-4">
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-20 w-20 rounded-full bg-neutral-200"
            />
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{user.username}</h2>
              <p className="text-sm text-neutral-600">
                Cấp {user.level} • {user.xp.toLocaleString("vi-VN")} EXP
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-neutral-700">
                Tên người dùng
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700">Avatar</label>
              <p className="mt-2 text-sm text-neutral-600">
                Avatar được tự động tạo từ tên người dùng. Bạn có thể đổi tên để thay đổi avatar.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setUsername(user.username);
                  setEmail(user.email);
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <Card padding="lg">
          <h2 className="mb-6 text-2xl font-bold text-neutral-900">Đổi mật khẩu</h2>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-neutral-700">
                Mật khẩu hiện tại
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-neutral-700">
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
              />
              <p className="mt-1 text-sm text-neutral-600">Tối thiểu 6 ký tự</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700">
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
              />
            </div>

            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </form>
        </Card>
      )}

      {/* Danger Zone Tab */}
      {activeTab === "danger" && (
        <Card padding="lg">
          <div className="rounded-lg border-2 border-error-300 bg-error-50 p-6">
            <h2 className="mb-2 text-2xl font-bold text-error-900">Vùng nguy hiểm</h2>
            <p className="mb-6 text-error-800">
              Xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu của bạn. Hành động này không thể hoàn tác.
            </p>

            <Button variant="error" onClick={() => setShowDeleteModal(true)}>
              Xóa tài khoản
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Card
            className="max-w-md"
            padding="lg"
          >
            <h3 className="mb-4 text-2xl font-bold text-error-900">Xác nhận xóa tài khoản</h3>
            <p className="mb-4 text-neutral-700">
              Hành động này sẽ xóa vĩnh viễn tài khoản <strong>{user.username}</strong> và tất cả dữ liệu liên quan.
            </p>
            <p className="mb-6 text-sm text-neutral-600">
              Để xác nhận, vui lòng nhập tên người dùng của bạn:{" "}
              <strong className="text-neutral-900">{user.username}</strong>
            </p>

            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user.username}
              className="mb-4 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-error-500 focus:outline-none focus:ring-4 focus:ring-error-500/20"
            />

            <div className="flex gap-3">
              <Button
                variant="error"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== user.username || isLoading}
              >
                {isLoading ? "Đang xóa..." : "Xóa vĩnh viễn"}
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
            </div>
          </Card>
          </div>
        </div>
      )}
    </>
  );
}
