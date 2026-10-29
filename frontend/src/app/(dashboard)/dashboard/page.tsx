"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  TrendingUp,
  Wallet,
  Clock,
  ArrowRight,
  Sparkles,
  Plus,
  BookOpen,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getUserExams, Exam } from "@/lib/api/exams";
import { getUserWallet } from "@/lib/api/wallet";

// Helper chuyển đổi ngày sang định dạng tương đối tiếng Việt thân thiện
function formatRelativeTime(dateString: string): { relative: string; full: string } {
  try {
    const date = new Date(dateString);
    const full =
      date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
      " • " +
      date.toLocaleDateString("vi-VN");
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return { relative: "Vừa xong", full };
    if (diffMinutes < 60) return { relative: `${diffMinutes} phút trước`, full };
    if (diffHours < 24) return { relative: `${diffHours} giờ trước`, full };
    if (diffDays === 1) return { relative: "Hôm qua", full };
    if (diffDays < 7) return { relative: `${diffDays} ngày trước`, full };
    return { relative: date.toLocaleDateString("vi-VN"), full };
  } catch {
    return { relative: dateString, full: dateString };
  }
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [totalExams, setTotalExams] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [examsRes, walletRes] = await Promise.all([
          getUserExams(5, 0),
          getUserWallet(),
        ]);
        setExams(examsRes.exams);
        setTotalExams(examsRes.totalCount);
        if (walletRes) setCredits(walletRes.balance);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const totalQuestions = exams.reduce((acc, curr) => acc + curr.question_count, 0);
  const latestExam = exams.length > 0 ? exams[0] : null;

  const stats = [
    {
      label: "Tổng đề thi",
      value: loading ? "—" : totalExams.toString(),
      change: "Đã lưu trong tài khoản",
      icon: FileText,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40",
    },
    {
      label: "Câu hỏi gần đây",
      value: loading ? "—" : totalQuestions.toString(),
      change: exams.length > 0 ? `${exams.length} đề thi gần nhất` : "Chưa có đề nào",
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40",
    },
    {
      label: "Credits còn lại",
      value: loading ? "—" : credits !== null ? credits.toLocaleString() : "0",
      change: "Số dư ví tài khoản",
      icon: Wallet,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40",
    },
    {
      label: "Đề gần nhất",
      value: loading
        ? "—"
        : latestExam
        ? `${latestExam.subject} • Lớp ${latestExam.grade}`
        : "Chưa có",
      change: latestExam ? latestExam.name : "Hãy bấm tạo đề ngay",
      icon: Clock,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40",
      tooltip: latestExam ? latestExam.name : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Xin chào, {profile?.name || user?.email?.split("@")[0] || "Thầy Cô"}! 👋
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Chào mừng Thầy/Cô đến với EduTest AI. Hãy xem tổng quan hoạt động và bắt đầu soạn đề.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/exams/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards (With Skeleton to prevent Layout Shift) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 shadow-2xs animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 bg-muted rounded" />
                  <div className="h-8 w-8 bg-muted rounded-lg" />
                </div>
                <div className="h-7 w-16 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))
          : stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-5 shadow-2xs transition-all hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground truncate">
                  {stat.value}
                </p>
                <p
                  className="mt-1 truncate text-xs text-muted-foreground"
                  title={stat.tooltip || stat.change}
                >
                  {stat.change}
                </p>
              </div>
            ))}
      </div>

      {/* Main Grid: Đề thi gần đây & Thao tác nhanh (Aligned with items-start) */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Recent exams (col-span-2) */}
        <div className="rounded-xl border border-border bg-card lg:col-span-2 shadow-2xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-border p-5 bg-card/60">
            <div>
              <h2 className="font-semibold text-foreground text-sm sm:text-base">
                Đề thi gần đây
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Các đề thi bạn vừa tạo hoặc xuất bản gần nhất
              </p>
            </div>
            <Link
              href="/exams"
              aria-label="Xem tất cả đề thi"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
            >
              Xem tất cả{" "}
              <ArrowRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border p-2 animate-pulse space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-6 w-20 bg-muted rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <FileText className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="font-medium text-foreground">
                Thầy/Cô chưa có đề thi nào trong tài khoản.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Bắt đầu tạo đề thi trắc nghiệm bằng AI chuẩn cấu trúc Bộ Giáo Dục 2025 ngay chỉ với 1 cú click.
              </p>
              <Link
                href="/exams/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Tạo đề thi đầu tiên
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {exams.map((exam) => {
                const timeInfo = formatRelativeTime(exam.created_at);
                return (
                  <Link
                    key={exam.id}
                    href={`/exams/${exam.id}`}
                    title={exam.name}
                    className="group flex items-center gap-4 p-4 sm:p-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                      {exam.subject.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="truncate font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {exam.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground/80">{exam.subject}</span>{" "}
                        • Lớp {exam.grade} • {exam.question_count} câu
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {/* Badge trạng thái với độ tương phản WCAG AA cao */}
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          exam.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/40"
                            : exam.status === "generating"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300/40"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/40"
                        }`}
                      >
                        {exam.status === "completed"
                          ? "Hoàn thành"
                          : exam.status === "generating"
                          ? "Đang tạo"
                          : "Bản nháp"}
                      </span>
                      <p
                        className="mt-1 text-xs text-muted-foreground flex items-center justify-end gap-1"
                        title={`Thời gian tạo: ${timeInfo.full}`}
                      >
                        <Calendar className="w-3 h-3 opacity-60" aria-hidden="true" />
                        <span>{timeInfo.relative}</span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer Card */}
          {exams.length > 0 && (
            <div className="p-3 bg-muted/20 border-t border-border flex justify-center">
              <Link
                href="/exams"
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 py-1 px-3 rounded hover:bg-muted/50"
              >
                Xem toàn bộ {totalExams} đề thi trong thư viện{" "}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions & Credits (Aside column) */}
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <h2 className="font-semibold text-sm sm:text-base mb-3 text-foreground">
              Thao tác nhanh
            </h2>
            <div className="space-y-2">
              <Link
                href="/exams/create"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    Tạo đề bằng AI
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chuẩn ma trận Bộ GD&ĐT 2025
                  </p>
                </div>
              </Link>

              <Link
                href="/grading"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-emerald-600 transition-colors">
                    Chấm bài OMR OpenCV
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quét camera & Chấm hàng loạt 0đ
                  </p>
                </div>
              </Link>

              <Link
                href="/guide"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-indigo-600 transition-colors">
                    Cẩm nang hướng dẫn
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tài liệu sử dụng từ A - Z
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Credit balance card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm sm:text-base text-foreground">
                Ví tài khoản
              </h2>
              <Link
                href="/wallet"
                aria-label="Nâng cấp gói tài khoản hoặc nạp credits"
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
              >
                Nâng cấp PRO
              </Link>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-primary">
                  {loading ? "..." : credits !== null ? credits.toLocaleString() : "0"}
                </span>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  credits
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Tặng 100 credits & 3 lượt tạo đề miễn phí mỗi ngày. Chấm OMR OpenCV hoàn toàn miễn phí.
              </p>
              <Link
                href="/wallet"
                aria-label="Quản lý ví và nạp credits qua PayOS"
                className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group"
              >
                <span>Quản lý ví & Nạp qua PayOS</span>
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
