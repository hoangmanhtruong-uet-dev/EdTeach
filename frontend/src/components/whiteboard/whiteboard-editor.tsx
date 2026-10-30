"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CloudUpload,
  CloudOff,
  Sparkles,
  Star,
  Crown,
  Lock,
  Plus
} from "lucide-react";
import { Whiteboard } from "@/types/whiteboard";
import { updateWhiteboard } from "@/lib/api/whiteboard";
import { STEM_LIBRARY_ITEMS, ExcalidrawLibraryItem } from "@/lib/whiteboard/stem-libraries";

type ExcalidrawEditorAPI = {
  getSceneElements: () => Record<string, unknown>[];
  updateScene: (sceneData: { elements?: Record<string, unknown>[]; appState?: Record<string, unknown> }) => void;
};


/**
 * Xuất ảnh WebP thu nhỏ 360x225px nhẹ (~10-15KB) làm Thumbnail thật cho thẻ bảng vẽ
 */
async function generateThumbnailWebP(
  elements: Record<string, unknown>[],
  appState: Record<string, unknown>
): Promise<string | null> {
  if (!elements || elements.length === 0) return null;
  try {
    const { exportToBlob } = await import("@excalidraw/excalidraw");
    const blob = await exportToBlob({
      elements: elements as any,
      appState: {
        ...appState,
        exportWithDarkMode: false,
        exportBackground: true,
        viewBackgroundColor: (appState?.viewBackgroundColor as string) || "#ffffff",
      } as any,
      files: null,
      mimeType: "image/webp",
      quality: 0.55,
      maxWidthOrHeight: 360,
    });
    if (!blob) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Lỗi sinh thumbnail WebP:", err);
    return null;
  }
}

// Dynamic import Canvas with ssr: false
const WhiteboardCanvas = dynamic(
  () => import("@/components/whiteboard/whiteboard-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-65px)] w-full items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Đang tải không gian Bảng trắng Excalidraw...</p>
        </div>
      </div>
    ),
  }
);

interface WhiteboardEditorProps {
  initialBoard: Whiteboard;
  isPro: boolean;
}

export default function WhiteboardEditor({
  initialBoard,
  isPro,
}: WhiteboardEditorProps) {
  const [board] = useState<Whiteboard>(initialBoard);
  const [title, setTitle] = useState(initialBoard.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [isFavorite, setIsFavorite] = useState(initialBoard.is_favorite);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawEditorAPI | null>(null);
  const [showStemMenu, setShowStemMenu] = useState(false);

  // References for debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestDataRef = useRef<{ elements: Record<string, unknown>[]; appState: Record<string, unknown> }>({
    elements: initialBoard.elements || [],
    appState: initialBoard.app_state || {},
  });

  // LocalStorage Key for offline redundancy
  const localCacheKey = `edteach_wb_${initialBoard.id}`;
  const lastThumbHashRef = useRef<number>(initialBoard.elements?.length || 0);
  const currentThumbUrlRef = useRef<string | null>(initialBoard.thumbnail_url);

  // Auto-save logic với tự động sinh Thumbnail ngầm (Sprint W-1)
  const performSave = useCallback(
    async (elements: Record<string, unknown>[], appState: Record<string, unknown>, newTitle?: string) => {
      setSaveStatus("saving");
      try {
        // 1. Lưu LocalStorage tức thì
        if (typeof window !== "undefined") {
          localStorage.setItem(
            localCacheKey,
            JSON.stringify({
              elements,
              appState,
              title: newTitle || title,
              savedAt: Date.now(),
            })
          );
        }

        // 2. Tự động sinh Thumbnail WebP nếu nét vẽ thay đổi
        let nextThumbnailUrl = currentThumbUrlRef.current;
        if (elements.length > 0 && elements.length !== lastThumbHashRef.current) {
          const generatedThumb = await generateThumbnailWebP(elements, appState);
          if (generatedThumb) {
            nextThumbnailUrl = generatedThumb;
            currentThumbUrlRef.current = generatedThumb;
            lastThumbHashRef.current = elements.length;
          }
        }

        // 3. Lưu lên Supabase
        const updatePayload: any = {
          title: newTitle || title,
          elements,
          app_state: {
            viewBackgroundColor: (appState?.viewBackgroundColor as string) || "#ffffff",
            currentItemStrokeColor: (appState?.currentItemStrokeColor as string) || "#1e1e1e",
            gridSize: (appState?.gridSize as number) ?? 20,
          },
        };

        if (nextThumbnailUrl) {
          updatePayload.thumbnail_url = nextThumbnailUrl;
        }

        const { success, error } = await updateWhiteboard(board.id, updatePayload);

        if (success) {
          setSaveStatus("saved");
        } else {
          console.error("Auto-save failed:", error);
          setSaveStatus("unsaved");
        }
      } catch (err) {
        console.error("Auto-save exception:", err);
        setSaveStatus("unsaved");
      }
    },
    [board.id, title, localCacheKey]
  );

  // Lưu trước khi người dùng chuyển trang hoặc unmount
  useEffect(() => {
    return () => {
      if (latestDataRef.current?.elements?.length) {
        performSave(latestDataRef.current.elements, latestDataRef.current.appState);
      }
    };
  }, [performSave]);

  const handleCanvasChange = (elements: readonly Record<string, unknown>[], appState: Record<string, unknown>) => {
    latestDataRef.current = {
      elements: [...elements],
      appState: { ...appState },
    };
    setSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave(latestDataRef.current.elements, latestDataRef.current.appState);
    }, 2500); // 2.5s debounce
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() !== board.title) {
      const cleanTitle = title.trim() || "Bảng vẽ chưa đặt tên";
      setTitle(cleanTitle);
      performSave(latestDataRef.current.elements, latestDataRef.current.appState, cleanTitle);
    }
  };

  const handleToggleFavorite = async () => {
    const nextVal = !isFavorite;
    setIsFavorite(nextVal);
    await updateWhiteboard(board.id, { is_favorite: nextVal });
  };

  const handleInsertStemItem = (item: ExcalidrawLibraryItem) => {
    if (!excalidrawAPI) return;
    if (!isPro) {
      alert("Tính năng chèn nhanh hình mẫu STEM thuộc gói Pro. Vui lòng nâng cấp để sử dụng!");
      return;
    }

    // Add elements with offset
    const currentElements = excalidrawAPI.getSceneElements();
    const newElements = item.elements.map((el) => ({
      ...el,
      id: `${(el as any).type || "item"}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: ((el as any).x || 0) + 100,
      y: ((el as any).y || 0) + 100,
    }));

    excalidrawAPI.updateScene({
      elements: [...currentElements, ...newElements],
    });
    setShowStemMenu(false);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <header className="flex h-[60px] w-full items-center justify-between border-b bg-card px-4 z-20">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/whiteboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Quay lại danh sách bảng vẽ"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                autoFocus
                className="rounded-md border border-primary px-2.5 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-foreground hover:bg-muted transition"
                title="Bấm để đổi tên bảng vẽ"
              >
                <span>{title}</span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                  (sửa)
                </span>
              </button>
            )}

            <button
              onClick={handleToggleFavorite}
              className={`rounded-md p-1.5 transition ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title={isFavorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
            >
              <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Center: Save Status */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-primary">
              <CloudUpload className="h-4 w-4 animate-pulse" />
              Đang lưu đám mây...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Check className="h-4 w-4" />
              Đã lưu an toàn
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="flex items-center gap-1.5 text-amber-500">
              <CloudOff className="h-4 w-4" />
              Chưa lưu thay đổi
            </span>
          )}
        </div>

        {/* Right: Actions & Pro Utilities */}
        <div className="flex items-center gap-2">
          {/* STEM Library Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStemMenu(!showStemMenu)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isPro
                  ? "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                  : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              <span>Mẫu vẽ STEM</span>
              {isPro ? (
                <span className="rounded bg-violet-600 px-1 py-0.2 text-[10px] text-white">PRO</span>
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </button>

            {/* Dropdown Menu */}
            {showStemMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="mb-2 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <span>Thư viện Giáo dục & Vật lý</span>
                  </div>
                  {!isPro && (
                    <Link
                      href="/wallet"
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Nâng cấp Pro
                    </Link>
                  )}
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {STEM_LIBRARY_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleInsertStemItem(item)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-muted group"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Tier Badge */}
          {isPro ? (
            <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 border border-amber-500/20">
              <Crown className="h-3.5 w-3.5 fill-amber-500" />
              <span>Gói Pro</span>
            </div>
          ) : (
            <Link
              href="/wallet"
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground transition"
            >
              <span>Gói Free</span>
              <span className="text-primary hover:text-white font-semibold">↑ Nâng cấp</span>
            </Link>
          )}
        </div>
      </header>

      {/* Excalidraw Canvas Area */}
      <main className="flex-1 w-full h-[calc(100vh-60px)] relative">
        <WhiteboardCanvas
          initialElements={board.elements}
          initialAppState={board.app_state}
          isPro={isPro}
          onChange={handleCanvasChange}
          onApiReady={(api) => setExcalidrawAPI(api as unknown as ExcalidrawEditorAPI)}
        />
      </main>
    </div>
  );
}
