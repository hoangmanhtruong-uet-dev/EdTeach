"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  Store,
  ScanLine,
  Sparkles,
  HelpCircle,
  FlaskConical,
  Presentation,
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/auth-context";
import { getUserWallet } from "@/lib/api/wallet";

const sidebarLinks = [
  { href: "/dashboard", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/exams/create", label: "Soạn đề", icon: FilePlus },
  { href: "/exams", label: "Đề thi của tôi", icon: FolderOpen },
  { href: "/grading", label: "Chấm trắc nghiệm", icon: ScanLine },
  { href: "/labs", label: "Phòng TN 3D", icon: FlaskConical },
  { href: "/whiteboard", label: "Bảng trắng", icon: Presentation },
  { href: "/marketplace", label: "Đề thi cộng đồng", icon: Store },
  { href: "/wallet", label: "Nạp điểm", icon: Wallet },
  { href: "/guide", label: "Hướng dẫn", icon: HelpCircle },
  { href: "/settings", label: "Cài đặt", icon: User },
];

function NavLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {sidebarLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <link.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    async function loadWallet() {
      try {
        const wallet = await getUserWallet();
        if (wallet) {
          setCredits(wallet.balance);
        }
      } catch (err) {
        console.error("Failed to load wallet balance", err);
      }
    }
    if (user) {
      loadWallet();
    }

    // Khởi tạo theme từ localStorage
    try {
      const savedTheme = localStorage.getItem("app_theme") || "system";
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {
      // ignore
    }
  }, [user]);

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GV";

  const pathname = usePathname();
  const isEditorRoute =
    pathname === "/exams/create" ||
    (pathname.startsWith("/exams/") && pathname !== "/exams");

  if (isEditorRoute) {
    return <div className="h-screen w-screen overflow-hidden bg-white">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold">
              Edu<span className="text-primary">Test</span> AI
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 hover:bg-muted lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links wrapped in Suspense */}
        <Suspense fallback={<div className="flex-1 p-3" />}>
          <NavLinks onClose={() => setSidebarOpen(false)} />
        </Suspense>

        {/* User section (at bottom of sidebar, clear from Next dev badge) */}
        <div className="mt-auto border-t border-border p-3 pb-6 bg-card/50">
          <div className="flex items-center gap-3 rounded-lg px-2.5 py-2 min-w-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover border border-primary/30 shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <p
                  className="truncate text-sm font-medium text-foreground"
                  title={profile?.name || user?.email || "Giáo viên"}
                >
                  {profile?.name || user?.email || "Giáo viên"}
                </p>
                {profile?.tier === "pro" || profile?.tier === "school" ? (
                  <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-500/20">
                    PRO
                  </span>
                ) : (
                  <span className="shrink-0 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Free
                  </span>
                )}
              </div>
              <p
                className="truncate text-xs text-muted-foreground"
                title={user?.email || ""}
              >
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            aria-label="Đăng xuất khỏi tài khoản"
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          {/* PRO status badge or upgrade pill */}
          {profile?.tier === "pro" || profile?.tier === "school" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>GÓI PRO</span>
            </span>
          ) : (
            <Link
              href="/wallet?plan=pro"
              className="flex items-center gap-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 text-xs font-bold transition shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Nâng cấp PRO</span>
            </Link>
          )}

          {/* Credits badge */}
          <Link
            href="/wallet"
            className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/20"
          >
            <Wallet className="h-4 w-4" />
            <span>{credits !== null ? `${credits.toLocaleString()} credits` : "Đang tải..."}</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#ebf3fb]" />}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
