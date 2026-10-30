"use client";

import Link from "next/link";
import { BookOpen, LogIn, Menu, X, LayoutDashboard, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              Edu<span className="text-primary">Test</span> AI
            </span>
          </Link>
          <Link
            href="/updates"
            title="Khám phá lộ trình bản v2.0.0"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-700/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 hover:text-white hover:border-blue-400 transition-all shadow-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            v1.0 ➔ v2.0
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Tính năng
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Bảng giá
          </Link>
          <Link
            href="/updates"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full transition-all shadow-xs hover:border-blue-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Lộ trình v2.0</span>
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{profile?.name || "Vào Dashboard"}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Dùng thử miễn phí
              </Link>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border transition-all duration-200 md:hidden",
          mobileOpen ? "max-h-60" : "max-h-0 border-t-0"
        )}
      >
        <div className="flex flex-col gap-3 px-4 py-4">
          <Link href="#features" className="text-sm font-medium text-muted-foreground">
            Tính năng
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-muted-foreground">
            Bảng giá
          </Link>
          <Link
            href="/updates"
            className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
          >
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>Khám phá Lộ trình v2.0 (Chính thức)</span>
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Vào Dashboard ({profile?.name || user.email})</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-md border border-border text-sm font-medium"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground"
              >
                Dùng thử miễn phí
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}