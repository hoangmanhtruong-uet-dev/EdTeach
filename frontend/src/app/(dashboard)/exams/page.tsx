"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter, Download, Eye, Trash2, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import { getUserExams, deleteExam, Exam } from "@/lib/api/exams";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      alert("Xóa thất bại!");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đề thi của tôi</h1>
          <p className="text-muted-foreground">Quản lý tất cả đề thi đã tạo.</p>
        </div>
        <Link
          href="/exams/create"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Tạo đề mới
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm đề thi theo tên hoặc môn học..."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm hover:bg-muted">
          <Filter className="h-4 w-4" /> Bộ lọc
        </button>
      </div>

      {/* Exam list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="hidden border-b border-border px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
          <span className="col-span-5 text-xs font-medium uppercase text-muted-foreground">Tên đề thi</span>
          <span className="col-span-2 text-xs font-medium uppercase text-muted-foreground">Môn / Lớp</span>
          <span className="col-span-1 text-xs font-medium uppercase text-muted-foreground">Số câu</span>
          <span className="col-span-2 text-xs font-medium uppercase text-muted-foreground">Ngày tạo</span>
          <span className="col-span-2 text-right text-xs font-medium uppercase text-muted-foreground">Thao tác</span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">Chưa có đề thi nào</p>
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
            {filteredExams.map((exam) => (
              <div key={exam.id} className="grid items-center gap-4 px-6 py-4 sm:grid-cols-12">
                <div className="flex items-center gap-3 sm:col-span-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {exam.subject.charAt(0)}
                  </div>
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
                <div className="flex justify-end gap-1 sm:col-span-2">
                  <Link
                    href={`/exams/${exam.id}`}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Xem"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Tải xuống"
                  >
                    <Download className="h-4 w-4" />
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
    </div>
  );
}