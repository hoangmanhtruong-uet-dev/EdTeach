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
  CheckCircle2,
  Circle,
  Shuffle,
  Printer,
  BookOpen,
  HelpCircle,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getUserExams, Exam } from "@/lib/api/exams";
import { getUserWallet } from "@/lib/api/wallet";
import { WelcomeOnboardingModal } from "@/components/modals/welcome-onboarding-modal";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [totalExams, setTotalExams] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Onboarding States
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hideChecklist, setHideChecklist] = useState(false);

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

    // Check if user has seen welcome onboarding modal
    const hasSeen = localStorage.getItem("has_seen_onboarding");
    if (!hasSeen) {
      setShowWelcomeModal(true);
    }
  }, []);

  const totalQuestions = exams.reduce((acc, curr) => acc + curr.question_count, 0);

  // Tính toán tiến độ Checklist tân thủ
  const hasCreatedExam = totalExams > 0;
  const checklistSteps = [
    {
      id: "step1",
      title: "Soạn đề thi đầu tiên với AI",
      desc: "Trải nghiệm tạo đề chuẩn Bộ GD&ĐT 2025 trong 30 giây",
      href: "/exams/create",
      completed: hasCreatedExam,
      icon: Sparkles,
    },
    {
      id: "step2",
      title: "Trộn 4 mã đề thi & xuất file Word",
      desc: "Tạo 4 mã đề hoán vị (101 - 104) kèm ma trận đáp án",
      href: "/exams/create",
      completed: hasCreatedExam,
      icon: Shuffle,
    },
    {
      id: "step3",
      title: "In phiếu trả lời trắc nghiệm chuẩn A4",
      desc: "In mẫu phiếu 20, 40 hoặc 50 câu cho học sinh tô bút chì 2B",
      href: "/grading",
      completed: false,
      icon: Printer,
    },
    {
      id: "step4",
      title: "Khám phá cẩm nang hướng dẫn sử dụng",
      desc: "Xem hướng dẫn chi tiết quy trình chấm thi AI và học sinh nộp bài QR",
      href: "/guide",
      completed: false,
      icon: BookOpen,
    },
  ];

  const completedCount = checklistSteps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / checklistSteps.length) * 100);

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
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Chào mừng Thầy/Cô đến với EduTest AI. Hãy xem tổng quan hoạt động và bắt đầu soạn đề.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWelcomeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold hover:bg-muted transition cursor-pointer shadow-2xs"
          >
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Xem giới thiệu</span>
          </button>

          <Link
            href="/exams/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>
      </div>

      {/* ONBOARDING CHECKLIST DÀNH CHO THẦY CÔ MỚI */}
      {!hideChecklist && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-blue-50/60 p-5 shadow-xs relative overflow-hidden animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-xs">
                {completedCount}/{checklistSteps.length}
              </span>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Lộ trình 4 bước bắt đầu với EduTest AI
                </h2>
                <p className="text-[11px] text-neutral-600">
                  Hoàn thành các bước để làm chủ trọn vẹn quy trình tạo đề và chấm thi tự động.
                </p>
              </div>
            </div>

            <button
              onClick={() => setHideChecklist(true)}
              className="text-neutral-400 hover:text-neutral-700 p-1 rounded-md hover:bg-white/60 transition cursor-pointer"
              title="Ẩn lộ trình"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-200/80 h-1.5 rounded-full overflow-hidden mb-4">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(progressPercent, 10)}%` }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {checklistSteps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              return (
                <Link
                  key={stepItem.id}
                  href={stepItem.href}
                  className={`group rounded-xl border p-3.5 transition-all text-left flex flex-col justify-between ${
                    stepItem.completed
                      ? "bg-white border-emerald-200 shadow-2xs"
                      : "bg-white/80 border-neutral-200/80 hover:border-primary/60 hover:bg-white shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                        <span className="text-primary font-black">0{index + 1}.</span>
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      {stepItem.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-neutral-300 group-hover:text-primary transition" />
                      )}
                    </div>
                    <p className={`text-xs font-bold leading-snug ${stepItem.completed ? "text-emerald-950 line-through opacity-75" : "text-neutral-900"}`}>
                      {stepItem.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1 leading-relaxed line-clamp-2">
                      {stepItem.desc}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>{stepItem.completed ? "Xem lại" : "Thực hiện"}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5 shadow-2xs"
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
        <div className="rounded-xl border border-border bg-card lg:col-span-2 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="font-semibold">Đề thi gần đây</h2>
            <Link
              href="/exams"
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : exams.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground space-y-2">
              <p>Thầy/Cô chưa có đề thi nào trong tài khoản.</p>
              <Link
                href="/exams/create"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" /> Bắt đầu tạo đề thi đầu tiên ngay!
              </Link>
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

        {/* Quick actions & Credits */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <h2 className="font-semibold mb-3">Thao tác nhanh</h2>
            <div className="space-y-2">
              <Link
                href="/exams/create"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Tạo đề bằng AI</p>
                  <p className="text-xs text-muted-foreground">
                    Chuẩn ma trận Bộ GD&ĐT 2025
                  </p>
                </div>
              </Link>
              <Link
                href="/grading"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <FileText className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">Chấm bài OMR AI</p>
                  <p className="text-xs text-muted-foreground">
                    Camera điện thoại & Nộp qua QR
                  </p>
                </div>
              </Link>
              <Link
                href="/guide"
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
              >
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium">Cẩm nang hướng dẫn</p>
                  <p className="text-xs text-muted-foreground">
                    Tài liệu sử dụng từ A - Z
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Credit balance card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <h2 className="font-semibold">Ví tài khoản</h2>
            <div className="mt-3">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-primary">
                  {credits !== null ? credits.toLocaleString() : "..."}
                </span>
                <span className="text-sm text-muted-foreground font-medium">credits</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Tặng 100 credits & 3 lượt tạo đề miễn phí mỗi ngày
              </p>
              <Link
                href="/wallet"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                Quản lý ví & Nạp qua PayOS <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Onboarding Modal */}
      <WelcomeOnboardingModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </div>
  );
}
