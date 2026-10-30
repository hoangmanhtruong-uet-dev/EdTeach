"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Presentation,
  Plus,
  Star,
  Copy,
  Trash2,
  Calendar,
  Crown,
  Sparkles,
  ExternalLink,
  Search,
  Grid,
  List,
  PenTool
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  getUserWhiteboards,
  createWhiteboard,
  deleteWhiteboard,
  duplicateWhiteboard,
  updateWhiteboard,
  FREE_TIER_MAX_BOARDS,
} from "@/lib/api/whiteboard";
import { Whiteboard } from "@/types/whiteboard";

export default function WhiteboardDashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPro = profile?.tier === "pro" || profile?.tier === "school";

  const loadBoards = async () => {
    setIsLoading(true);
    try {
      const data = await getUserWhiteboards();
      setWhiteboards(data);
    } catch (err) {
      console.error("Lỗi tải bảng vẽ:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, [user]);

  const handleCreateBoard = async (templateTitle?: string) => {
    setErrorMessage(null);
    setIsCreating(true);
    try {
      const res = await createWhiteboard(templateTitle || "Bảng vẽ mới", isPro);
      if (res.data) {
        router.push(`/whiteboard/${res.data.id}`);
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tạo bảng vẽ mới.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBoard = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xoá bảng vẽ này?")) return;

    const ok = await deleteWhiteboard(id);
    if (ok) {
      setWhiteboards((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleDuplicateBoard = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const duplicated = await duplicateWhiteboard(id, isPro);
    if (duplicated) {
      setWhiteboards((prev) => [duplicated, ...prev]);
      showToast("Đã nhân bản bảng vẽ thành công!", "success");
    } else {
      showToast("Không thể nhân bản (đã đạt giới hạn số lượng bảng vẽ).", "warning");
    }
  };

  const handleToggleFavorite = async (board: Whiteboard, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextVal = !board.is_favorite;
    setWhiteboards((prev) =>
      prev.map((b) => (b.id === board.id ? { ...b, is_favorite: nextVal } : b))
    );
    await updateWhiteboard(board.id, { is_favorite: nextVal });
  };

  // Filter whiteboards
  const filteredBoards = whiteboards.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFav = filterFavorite ? b.is_favorite : true;
    return matchesSearch && matchesFav;
  });

  const usedCount = whiteboards.length;
  const isAtLimit = !isPro && usedCount >= FREE_TIER_MAX_BOARDS;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Presentation className="h-3.5 w-3.5" />
              <span>Bảng Trắng Giảng Dạy Excalidraw</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Không Gian Bảng Trắng Tương Tác
            </h1>
            <p className="mt-2 text-sm text-blue-100 sm:text-base">
              Vẽ tay, phác thảo sơ đồ tư duy, chèn công thức, mô phỏng cơ học và điện học trực tiếp.
              Tự động lưu đám mây an toàn, phục vụ giảng dạy và thuyết trình trực quan.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => handleCreateBoard()}
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-600 shadow-lg transition hover:bg-blue-50 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>{isCreating ? "Đang tạo..." : "Tạo bảng vẽ mới"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quota & Pro Status Banner */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          {isPro ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Crown className="h-5 w-5 fill-amber-500" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PenTool className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {isPro ? "Tài khoản Pro: Lưu trữ Không giới hạn" : `Gói Miễn phí: Đã dùng ${usedCount}/${FREE_TIER_MAX_BOARDS} bảng`}
              </p>
              {isPro && (
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isPro
                ? "Bạn có đầy đủ quyền truy cập kho thư viện hình vẽ STEM và xuất file vector chất lượng cao."
                : `Tài khoản Free lưu tối đa ${FREE_TIER_MAX_BOARDS} bảng vẽ trên đám mây.`}
            </p>
          </div>
        </div>

        {!isPro && (
          <Link
            href="/wallet"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow transition hover:from-amber-600 hover:to-orange-600"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nâng cấp Pro mở khoá không giới hạn</span>
          </Link>
        )}
      </div>

      {/* Error alert if exceeded quota */}
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <p className="font-semibold">{errorMessage}</p>
          <div className="mt-2 flex gap-3">
            <Link
              href="/wallet"
              className="text-xs font-bold underline hover:opacity-80"
            >
              Nâng cấp gói Pro ngay →
            </Link>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm bảng vẽ theo tên…"
            aria-label="Tìm kiếm bảng vẽ theo tên"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              filterFavorite
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${filterFavorite ? "fill-amber-500" : ""}`} />
            <span>Bảng yêu thích</span>
          </button>
        </div>
      </div>

      {/* Board Grid / List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm">Đang tải danh sách bảng vẽ…</p>
          </div>
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Presentation className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {searchQuery || filterFavorite
              ? "Không tìm thấy bảng vẽ phù hợp"
              : "Chưa có bảng vẽ nào"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {searchQuery || filterFavorite
              ? "Hãy thử thay đổi từ khoá tìm kiếm hoặc tắt bộ lọc yêu thích."
              : "Bắt đầu tạo bảng vẽ đầu tiên để phác thảo bài giảng, sơ đồ tư duy hoặc giải bài tập trực quan."}
          </p>
          {!searchQuery && !filterFavorite && (
            <button
              onClick={() => handleCreateBoard()}
              disabled={isCreating}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo bảng vẽ ngay</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Create New Card */}
          <button
            onClick={() => handleCreateBoard()}
            disabled={isCreating}
            className={`group flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition hover:border-primary hover:bg-primary/5 ${
              isAtLimit ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition">
              <Plus className="h-6 w-6" />
            </div>
            <h4 className="mt-3 text-sm font-semibold text-foreground">Tạo bảng vẽ mới</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {isAtLimit ? "Đã đạt giới hạn Free" : "Khởi tạo canvas trắng"}
            </p>
          </button>

          {/* Existing Boards */}
          {filteredBoards.map((b) => (
            <div
              key={b.id}
              onClick={() => router.push(`/whiteboard/${b.id}`)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md hover:border-primary/50 cursor-pointer"
            >
              {/* Preview Thumbnail Area */}
              <div className="relative flex h-36 w-full items-center justify-center bg-muted/30 border-b border-border/50 p-4 overflow-hidden">
                <Presentation className="h-10 w-10 text-muted-foreground/40 group-hover:scale-110 group-hover:text-primary transition duration-300" />
                
                {/* Element count tag */}
                <div className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm border">
                  {(b.elements as any[])?.length || 0} nét vẽ
                </div>

                {/* Favorite Star */}
                <button
                  onClick={(e) => handleToggleFavorite(b, e)}
                  className="absolute top-2 right-2 rounded-lg p-1.5 transition hover:bg-background/80"
                  title={b.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  <Star
                    className={`h-4 w-4 ${
                      b.is_favorite
                        ? "text-amber-500 fill-amber-500"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  />
                </button>
              </div>

              {/* Info & Actions */}
              <div className="p-4">
                <h4 className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition">
                  {b.title}
                </h4>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(b.updated_at).toLocaleDateString("vi-VN")}
                  </span>

                  {/* Actions Dropdown / Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => handleDuplicateBoard(b.id, e)}
                      className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Nhân bản"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteBoard(b.id, e)}
                      className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Xoá"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
