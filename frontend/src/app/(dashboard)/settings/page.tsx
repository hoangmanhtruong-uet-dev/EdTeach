"use client";

import { User, Bell, Shield, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, profile, refreshProfile } = useAuth();

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setSchool(profile.school || "");
    }
  }, [profile]);

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
      setSaveMessage("Cập nhật thông tin thành công!");
    } catch (err: any) {
      setSaveMessage(`Lỗi: ${err.message || "Không thể lưu"}`);
    } finally {
      setSaving(false);
    }
  }

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
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
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
          {activeTab === "profile" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 text-lg font-semibold">Thông tin cá nhân</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {saveMessage && (
                  <div
                    className={`rounded-lg p-3 text-sm ${
                      saveMessage.startsWith("Lỗi")
                        ? "bg-destructive/10 text-destructive"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                    {initials}
                  </div>
                  <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
                    Thay ảnh đại diện
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">Họ và tên</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="mt-1 block w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">Trường học</label>
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="THPT Nguyễn Huệ"
                      className="mt-1 block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Vai trò</label>
                    <input
                      type="text"
                      value={profile?.role === "teacher" ? "Giáo viên" : profile?.role || ""}
                      disabled
                      className="mt-1 block w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 text-lg font-semibold">Cài đặt thông báo</h2>
              <div className="space-y-4">
                {[
                  { title: "Email thông báo đề thi hoàn thành", desc: "Nhận email khi AI tạo đề xong" },
                  { title: "Thông báo credits sắp hết", desc: "Nhận cảnh báo khi credits còn dưới 10" },
                  { title: "Cập nhật tính năng mới", desc: "Nhận thông tin về tính năng mới" },
                  { title: "Mẹo sử dụng", desc: "Nhận gợi ý tối ưu việc tạo đề thi" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between rounded-lg border border-border p-4">
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

          {activeTab === "security" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 text-lg font-semibold">Bảo mật</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium">Đổi mật khẩu</h3>
                  <div className="mt-3 space-y-3">
                    <input type="password" placeholder="Mật khẩu hiện tại" className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    <input type="password" placeholder="Mật khẩu mới" className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                    <input type="password" placeholder="Xác nhận mật khẩu mới" className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <button className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    Cập nhật mật khẩu
                  </button>
                </div>
                <hr className="border-border" />
                <div>
                  <h3 className="text-sm font-medium text-red-600">Xóa tài khoản</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Hành động này không thể hoàn tác. Tất cả dữ liệu sẽ bị xóa vĩnh viễn.</p>
                  <button className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                    Xóa tài khoản
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 text-lg font-semibold">Giao diện</h2>
              <div>
                <p className="text-sm font-medium">Chế độ hiển thị</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "light", label: "Sáng" },
                    { value: "dark", label: "Tối" },
                    { value: "system", label: "Hệ thống" },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      className="rounded-lg border border-border p-4 text-center text-sm font-medium hover:bg-muted"
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}