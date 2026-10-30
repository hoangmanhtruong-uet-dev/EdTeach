"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Loader2,
  BookOpen,
  Share2,
  Crown,
  Copy,
  Check,
  X,
  QrCode,
  Sparkles,
  Presentation,
} from "lucide-react";
import Link from "next/link";
import { getUserExams, deleteExam, Exam, getExamById } from "@/lib/api/exams";
import { useAuth } from "@/context/auth-context";
import { isMaxUser, isProUser, PricingPlan } from "@/lib/payment/plans";
import { exportDualTeachingDocx } from "@/lib/export/docx-exporter";
import { UpgradeTierModal } from "@/components/modals/upgrade-tier-modal";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const { user, profile } = useAuth();
  const [magicLinkExam, setMagicLinkExam] = useState<Exam | null>(null);
  const [copiedMagicLink, setCopiedMagicLink] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<"pro" | "max" | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

  const handleExportDualTeaching = async (id: string) => {
    try {
      setExportingId(id);
      const fullExam = await getExamById(id);
      if (fullExam) {
        await exportDualTeachingDocx(fullExam, isProUser(profile) || isProUser(user));
      }
    } catch (e) {
      console.error("Export dual docx error:", e);
      alert("Lỗi khi xuất bộ đề giảng dạy.");
    } finally {
      setExportingId(null);
    }
  };

  const handleMagicLinkClick = (exam: Exam) => {
    if (!isMaxUser(profile)) {
      setUpgradeTier("max");
      return;
    }
    setMagicLinkExam(exam);
  };

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    setLoading(true);
    try {
      const res = await getUserExams();
      setExams(res.exams);
    } catch (err) {
      console.error("Failed to load exams", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này không?")) return;
    setDeletingId(id);
    try {
      await deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete exam", err);
      alert("Không thể xóa đề thi. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredExams = exams.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đề thi của tôi</h1>
          <p className="text-sm text-muted-foreground">Quản lý và xuất bản các đề thi đã tạo</p>
        </div>
        <Link
          href="/exams/create"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Tạo đề mới
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            <Filter className="h-4 w-4 text-muted-foreground" /> Lọc
          </button>
        </div>
      </div>

      {/* Exam List */}
      <div className="rounded-xl border border-border bg-card shadow-xs">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">Chưa có đề thi nào</h3>
            <p className="mt-1 text-xs text-muted-foreground">Bắt đầu bằng cách tạo một đề thi mới ngay bây giờ!</p>
            <Link
              href="/exams/create"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Tạo đề đầu tiên
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-muted-foreground sm:grid">
              <div className="col-span-5 sm:col-span-5">Tên đề thi</div>
              <div className="hidden sm:col-span-2 sm:block">Môn / Lớp</div>
              <div className="hidden sm:col-span-1 sm:block">Số câu</div>
              <div className="hidden sm:col-span-2 sm:block">Ngày tạo</div>
              <div className="col-span-7 text-right sm:col-span-2">Thao tác</div>
            </div>
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="col-span-12 sm:col-span-5">
                  <div className="overflow-hidden">
                    <Link href={`/exams/${exam.id}`} className="truncate font-medium hover:text-primary">
                      {exam.name}
                    </Link>
                    <span
                      className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium sm:hidden ${
                        exam.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : exam.status === "generating"
                          ? "bg-blue-100 text-blue-700"
                          : exam.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {exam.status === "completed"
                        ? "Hoàn thành"
                        : exam.status === "generating"
                        ? "Đang tạo"
                        : exam.status === "failed"
                        ? "Thất bại"
                        : "Nháp"}
                    </span>
                  </div>
                </div>
                <div className="hidden text-sm text-muted-foreground sm:col-span-2 sm:block">
                  {exam.subject} - Lớp {exam.grade}
                </div>
                <div className="hidden text-sm sm:col-span-1 sm:block">{exam.question_count} câu</div>
                <div className="hidden text-sm text-muted-foreground sm:col-span-2 sm:block">
                  {new Date(exam.created_at).toLocaleDateString("vi-VN")}
                </div>
                <div className="flex items-center justify-end gap-1.5 sm:col-span-2">
                  <Link
                    href={`/teach/${exam.id}`}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 transition cursor-pointer shadow-2xs"
                    title="Bục Giảng Số: Trình chiếu chữa đề kết hợp Bảng nháp Excalidraw (Gói PRO)"
                  >
                    <Presentation className="h-3.5 w-3.5 text-amber-600" />
                    <span className="hidden md:inline">Bục giảng</span>
                  </Link>

                  <Link
                    href={`/exams/${exam.id}`}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Xem & Chỉnh sửa"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleExportDualTeaching(exam.id)}
                    disabled={exportingId === exam.id}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-50 transition cursor-pointer"
                    title="Tải Bộ Đề Kép: 1 Bản Học Sinh (có dòng chấm chép bài) & 1 Bản Giáo Viên (kèm lời giải chi tiết)"
                  >
                    {exportingId === exam.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <Download className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleMagicLinkClick(exam)}
                    className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    title="Giao đề Online qua Magic Link (Đặc quyền MAX)"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    disabled={deletingId === exam.id}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Xóa"
                  >
                    {deletingId === exam.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Magic Link Giao đề Online (Gói MAX) */}
      {magicLinkExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative text-left">
            <button
              onClick={() => setMagicLinkExam(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Giao đề Online qua Magic Link
                </h3>
                <p className="text-xs text-muted-foreground">
                  Đề thi: <strong>{magicLinkExam.name}</strong> ({magicLinkExam.subject} - Lớp {magicLinkExam.grade})
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
              Học sinh chỉ cần mở liên kết hoặc quét mã QR dưới đây trên điện thoại để làm bài trực tuyến. Không cần đăng nhập, hệ thống tự động ghi nhận điểm số và lập bảng xếp hạng.
            </p>

            <div className="rounded-xl border border-border bg-neutral-50 dark:bg-muted/40 p-3.5 mb-4">
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Đường dẫn làm bài trực tuyến:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/grading/submit/${magicLinkExam.id}?name=${encodeURIComponent(
                          magicLinkExam.name
                        )}`
                      : `https://eduteast.vn/grading/submit/${magicLinkExam.id}`
                  }
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const link =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/grading/submit/${magicLinkExam.id}?name=${encodeURIComponent(
                            magicLinkExam.name
                          )}`
                        : `https://eduteast.vn/grading/submit/${magicLinkExam.id}`;
                    navigator.clipboard.writeText(link);
                    setCopiedMagicLink(true);
                    setTimeout(() => setCopiedMagicLink(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer shrink-0"
                >
                  {copiedMagicLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMagicLink ? "Đã sao chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMagicLinkExam(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Tier Modal */}
      <UpgradeTierModal
        isOpen={!!upgradeTier}
        onClose={() => setUpgradeTier(null)}
        requiredTier={upgradeTier || "max"}
        featureTitle="Giao đề Online qua Magic Link (Không cần tài khoản)"
        featureDesc="Đặc quyền Gói Luyện Thi MAX: Biến mọi đề thi trong kho của bạn thành liên kết và mã QR trực tuyến gửi qua Zalo. Học sinh làm bài tức thì trên điện thoại, hệ thống tự động chấm điểm và xếp hạng cả lớp."
        onSelectPlan={(plan) => setCheckoutPlan(plan)}
      />

      {/* PayOS Checkout Modal */}
      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={() => {
            setCheckoutPlan(null);
            setUpgradeTier(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
