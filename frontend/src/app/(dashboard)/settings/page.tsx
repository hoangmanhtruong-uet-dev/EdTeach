"use client";

import {
  User,
  Bell,
  Shield,
  Palette,
  Camera,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  Laptop,
  KeyRound,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, profile, refreshProfile } = useAuth();

  // Profile Form States
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Avatar Upload States
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password Change States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setSchool(profile.school || "");
    }
  }, [profile]);

  // Load theme preference on mount
  useEffect(() => {
    const saved = (localStorage.getItem("app_theme") as "light" | "dark" | "system") || "system";
    setCurrentTheme(saved);
  }, []);

  // Update theme helper
  function applyTheme(theme: "light" | "dark" | "system") {
    setCurrentTheme(theme);
    localStorage.setItem("app_theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }

  // Client-side image compression: Resize to 256x256, JPEG quality 0.8 (< 35KB)
  async function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Không thể xử lý ảnh"));
            return;
          }

          // Cắt vuông tâm ảnh (Center Crop)
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, dataUrl });
              } else {
                reject(new Error("Lỗi nén ảnh"));
              }
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = () => reject(new Error("Không thể đọc tệp ảnh"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Lỗi đọc file"));
      reader.readAsDataURL(file);
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Vui lòng chọn file định dạng hình ảnh (PNG, JPG, WEBP).");
      return;
    }

    setUploadingAvatar(true);
    setAvatarError(null);

    try {
      // 1. Nén ảnh ở client xuống kích thước chuẩn 256x256 (< 35KB)
      const { blob, dataUrl } = await compressImage(file);
      const supabase = createClient();
      let finalAvatarUrl = "";

      // 2. Cố gắng tải lên Supabase Storage bucket 'avatars'
      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: pubData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        finalAvatarUrl = `${pubData.publicUrl}?t=${Date.now()}`;
      } else {
        // Fallback: Nếu bucket chưa được tạo hoặc lỗi quyền RLS, sử dụng dataUrl đã nén siêu nhẹ (< 35KB)
        console.warn("Storage upload fallback to compressed dataUrl:", uploadError.message);
        finalAvatarUrl = dataUrl;
      }

      // 3. Cập nhật vào bảng public.users
      const { error: dbError } = await (supabase.from("users") as any)
        .update({
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (dbError) throw dbError;

      await refreshProfile();
      setSaveMessage({ type: "success", text: "Cập nhật ảnh đại diện thành công!" });
    } catch (err: any) {
      setAvatarError(err.message || "Không thể tải ảnh lên.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const supabase = createClient();
      const { error } = await (supabase.from("users") as any)
        .update({
          name: name.trim(),
          school: school.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      setSaveMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
    } catch (err: any) {
      setSaveMessage({ type: "error", text: `Lỗi: ${err.message || "Không thể lưu"}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 8 ký tự để đảm bảo an toàn bảo mật." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Xác nhận mật khẩu mới không khớp." });
      return;
    }

    setPasswordUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công! Hãy sử dụng mật khẩu mới cho lần đăng nhập sau." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Không thể đổi mật khẩu." });
    } finally {
      setPasswordUpdating(false);
    }
  }

  const isOAuthUser = user?.app_metadata?.provider === "google";

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GV";

  const tabs = [
    { id: "profile", label: "Hồ sơ", icon: User },
    { id: "notifications", label: "Thông báo", icon: Bell },
    { id: "security", label: "Bảo mật", icon: Shield },
    { id: "appearance", label: "Giao diện", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar tabs */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* TAB 1: HỒ SƠ */}
          {activeTab === "profile" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <h2 className="mb-6 text-lg font-semibold">Thông tin cá nhân</h2>

              {saveMessage && (
                <div
                  className={`mb-4 rounded-lg p-3 text-sm flex items-center gap-2 ${
                    saveMessage.type === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {saveMessage.type === "error" ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{saveMessage.text}</span>
                </div>
              )}

              {avatarError && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{avatarError}</span>
                </div>
              )}

              {/* Avatar section */}
              <div className="mb-6 flex items-center gap-4 border-b border-border pb-6">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full object-cover border-2 border-primary shadow-xs"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                      {initials}
                    </div>
                  )}

                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    {uploadingAvatar ? "Đang xử lý..." : "Thay ảnh đại diện"}
                  </button>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Ảnh tự động nén tối ưu (256x256, &lt;35KB) lưu trữ an toàn trên CDN, không lo đầy dung lượng.
                  </p>
                </div>
              </div>

              {/* Form profile */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">Họ và tên</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Email tài khoản</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="mt-1 block w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">Trường học / Đơn vị công tác</label>
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="VD: THPT Chuyên Hà Nội - Amsterdam"
                      className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Hạng tài khoản</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={profile?.tier === "pro" ? "Gói Giáo Viên PRO (VIP)" : "Gói Miễn Phí (Free)"}
                        disabled
                        className="block w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer"
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: THÔNG BÁO */}
          {activeTab === "notifications" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Cài đặt thông báo</h2>
                <span className="rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5">
                  Dự kiến phiên bản 1.1
                </span>
              </div>

              <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Hệ thống đang hoàn tất tích hợp dịch vụ gửi Email thông báo tự động (khi AI tạo xong đề thi và khi học sinh nộp bài qua QR).
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { title: "Email thông báo đề thi hoàn thành", desc: "Nhận email khi AI hoàn thành trích xuất hoặc tạo đề thi" },
                  { title: "Thông báo học sinh nộp bài", desc: "Nhận thông báo tức thì khi có học sinh nộp bài qua link QR" },
                  { title: "Cảnh báo số dư credits", desc: "Nhận cảnh báo khi ví còn dưới 20 credits" },
                  { title: "Cập nhật tính năng & mẫu đề mới", desc: "Nhận thông tin về các cập nhật chuẩn đề Bộ GD&ĐT 2025" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BẢO MẬT */}
          {activeTab === "security" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <h2 className="mb-6 text-lg font-semibold">Bảo mật tài khoản</h2>

              <div className="space-y-6">
                {/* Đổi mật khẩu */}
                <div>
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">Đổi mật khẩu đăng nhập</h3>
                  </div>

                  {isOAuthUser ? (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-800">
                      Tài khoản của bạn đang đăng nhập an toàn thông qua <strong>Google OAuth</strong>. Bạn không cần đổi mật khẩu tại đây. Mật khẩu của bạn được quản lý trực tiếp bởi tài khoản Google.
                    </div>
                  ) : (
                    <form onSubmit={handleUpdatePassword} className="mt-3 space-y-3 max-w-md">
                      {passwordMessage && (
                        <div
                          className={`rounded-lg p-3 text-xs flex items-center gap-2 ${
                            passwordMessage.type === "error"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {passwordMessage.type === "error" ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          )}
                          <span>{passwordMessage.text}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Xác nhận mật khẩu mới</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={passwordUpdating}
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer"
                      >
                        {passwordUpdating ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                      </button>
                    </form>
                  )}
                </div>

                <hr className="border-border" />

                {/* Xóa tài khoản */}
                <div>
                  <div className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">Xóa tài khoản</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hành động này sẽ xóa vĩnh viễn dữ liệu giáo án, đề thi và điểm số học sinh của bạn.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer"
                  >
                    Xóa tài khoản vĩnh viễn
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GIAO DIỆN */}
          {activeTab === "appearance" && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <h2 className="mb-2 text-lg font-semibold">Tùy chỉnh giao diện</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Lựa chọn chế độ hiển thị phù hợp với điều kiện ánh sáng và mắt của bạn.
              </p>

              <div>
                <p className="text-sm font-medium mb-3">Chế độ màu hiển thị</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "light" as const, label: "Giao diện Sáng", desc: "Nền xanh nhạt dịu mắt chuẩn", icon: Sun },
                    { value: "dark" as const, label: "Giao diện Tối", desc: "Độ tương phản cao ban đêm", icon: Moon },
                    { value: "system" as const, label: "Theo hệ thống", desc: "Tự động đổi theo thiết bị", icon: Laptop },
                  ].map((theme) => {
                    const isSelected = currentTheme === theme.value;
                    const Icon = theme.icon;
                    return (
                      <button
                        key={theme.value}
                        type="button"
                        onClick={() => applyTheme(theme.value)}
                        className={`rounded-xl border p-4 text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 rounded-full bg-primary p-0.5 text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="text-sm font-bold">{theme.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{theme.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Cảnh báo Xóa tài khoản */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 relative text-left">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 mb-1">
              Yêu cầu hủy tài khoản
            </h3>

            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Theo quy định bảo vệ dữ liệu giáo án và điểm thi học sinh của Bộ GD&ĐT, việc xóa vĩnh viễn tài khoản cần được xác thực danh tính để tránh mất mát dữ liệu ngoài ý muốn.
            </p>

            <div className="rounded-xl bg-neutral-50 p-3.5 border border-neutral-200 text-xs text-neutral-700 space-y-1.5 mb-5">
              <p className="font-semibold text-neutral-900">Quy trình xóa tài khoản an toàn:</p>
              <p>• Vui lòng gửi email từ địa chỉ <strong>{user?.email}</strong> đến hòm thư hỗ trợ:</p>
              <p className="font-mono text-primary font-bold">lienhe@soandethi.com</p>
              <p>• Ban quản trị sẽ tiến hành xóa sạch tài khoản và dữ liệu liên quan trong vòng 24 giờ làm việc.</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
