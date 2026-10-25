"use client";

import Link from "next/link";
import { BookOpen, LogIn, Menu, X, LayoutDashboard } from "lucide-react";
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
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            Edu<span className="text-primary">Test</span> AI
          </span>
        </Link>

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