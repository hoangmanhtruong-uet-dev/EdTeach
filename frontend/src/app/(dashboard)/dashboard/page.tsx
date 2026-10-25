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
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getUserExams, Exam } from "@/lib/api/exams";
import { getUserWallet } from "@/lib/api/wallet";

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

  const stats = [
    {
      label: "Tổng đề thi",
      value: totalExams.toString(),
      change: "Đã tạo",
      icon: FileText,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40",
    },
    {
      label: "Câu hỏi gần đây",
      value: totalQuestions.toString(),
      change: "5 đề gần nhất",
      icon: TrendingUp,
      color: "text-green-600 bg-green-100 dark:bg-green-950/40",
    },
    {
      label: "Credits còn lại",
      value: credits !== null ? credits.toLocaleString() : "...",
      change: "Ví tài khoản",
      icon: Wallet,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40",
    },
    {
      label: "Đề gần nhất",
      value: exams.length > 0 ? exams[0].subject : "Chưa có",
      change: exams.length > 0 ? exams[0].name : "Hãy tạo ngay",
      icon: Clock,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-950/40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Xin chào, {profile?.name || user?.email?.split("@")[0] || "Thầy Cô"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Đây là tổng quan hoạt động và số dư đề thi của bạn.
          </p>
        </div>
        <Link
          href="/exams/create"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Tạo đề thi mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{stat.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent exams */}
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="font-semibold">Đề thi gần đây</h2>
            <Link
              href="/exams"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : exams.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Bạn chưa tạo đề thi nào. Nhấn "Tạo đề thi mới" để bắt đầu!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {exams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/exams/${exam.id}`}
                  className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {exam.subject.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate font-medium">{exam.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.subject} - Lớp {exam.grade} • {exam.question_count} câu
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        exam.status === "completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : exam.status === "generating"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                      }`}
                    >
                      {exam.status === "completed"
                        ? "Hoàn thành"
                        : exam.status === "generating"
                        ? "Đang tạo"
                        : "Bản nháp"}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(exam.created_at).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Thao tác nhanh</h2>
            <div className="mt-4 space-y-2">
              <Link
                href="/exams/create"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Tạo đề bằng AI</p>
                  <p className="text-xs text-muted-foreground">
                    Tự động sinh câu hỏi
                  </p>
                </div>
              </Link>
              <Link
                href="/grading"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Chấm bài AI</p>
                  <p className="text-xs text-muted-foreground">
                    Scan & chấm tự động
                  </p>
                </div>
              </Link>
              <Link
                href="/marketplace"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Marketplace</p>
                  <p className="text-xs text-muted-foreground">
                    Mua bán đề thi
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Credit balance card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Sở hữu credits</h2>
            <div className="mt-4">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-primary">
                  {credits !== null ? credits.toLocaleString() : "..."}
                </span>
                <span className="text-sm text-muted-foreground">credits</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Tặng 5,000 credits khi đăng ký tài khoản mới
              </p>
              <Link
                href="/wallet"
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Nạp thêm credits <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}