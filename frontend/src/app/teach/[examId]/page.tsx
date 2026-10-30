"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Lightbulb,
  FileCode2,
  CheckCircle2,
  Sparkles,
  Camera,
  Trash2,
  Crown,
  Type,
  Eye,
  EyeOff,
  Layers,
  BookOpen,
  PanelLeftClose,
  PanelRightClose,
  Columns2,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { getExamById, ExamWithQuestions, Question } from "@/lib/api/exams";
import { useAuth } from "@/context/auth-context";
import { isProUser, isMaxUser } from "@/lib/payment/plans";
import { LatexRenderer } from "@/components/ui/latex-renderer";

// Dynamic import Excalidraw Canvas (Client-only)
const WhiteboardCanvas = dynamic(
  () => import("@/components/whiteboard/whiteboard-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs font-semibold">Đang chuẩn bị Bảng nháp Excalidraw...</p>
        </div>
      </div>
    ),
  }
);

type ExcalidrawAPI = {
  getSceneElements: () => unknown[];
  updateScene: (sceneData: { elements?: unknown[]; appState?: Record<string, unknown> }) => void;
};

function TeachingStudioContent() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const { user, profile } = useAuth();

  const isPro = isProUser(profile) || isProUser(user);
  const isMax = isMaxUser(profile) || isMaxUser(user);

  const [exam, setExam] = useState<ExamWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Question State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Layout & Font Size for Projector
  // ratio: 50 = 50:50, 70 = 70:30 (more Question), 30 = 30:70 (more Board), 100 = 100% Question, 0 = 100% Board
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [fontSize, setFontSize] = useState<"md" | "lg" | "xl">("lg");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Per-Question Drawing Storage
  const [drawingsMap, setDrawingsMap] = useState<Record<string, unknown[]>>({});
  const excalidrawApiRef = useRef<ExcalidrawAPI | null>(null);
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;

  // Load Exam
  useEffect(() => {
    async function loadData() {
      if (!examId) return;
      try {
        setLoading(true);
        const data: any = await getExamById(examId);
        if (!data) {
          setError("Không tìm thấy đề thi hoặc đề thi đã bị xóa.");
        } else {
          // Sắp xếp câu hỏi theo order_index
          if (data.questions && Array.isArray(data.questions)) {
            data.questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
          }
          setExam(data);
        }
      } catch (err: any) {
        setError(err.message || "Lỗi tải đề thi.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [examId]);

  // Helper save current drawing
  const saveCurrentQuestionDrawing = useCallback(() => {
    if (!excalidrawApiRef.current || !exam?.questions) return;
    const currentQ = exam.questions[currentIdxRef.current];
    if (!currentQ) return;

    try {
      const elements = excalidrawApiRef.current.getSceneElements();
      setDrawingsMap((prev) => ({
        ...prev,
        [currentQ.id]: elements,
      }));
    } catch {
      // ignore
    }
  }, [exam]);

  // Switch to question index
  const goToQuestion = useCallback(
    (newIdx: number) => {
      if (!exam?.questions || newIdx < 0 || newIdx >= exam.questions.length) return;

      // 1. Save current drawing first
      saveCurrentQuestionDrawing();

      // 2. Reset layer toggles for the next question
      setShowHint(false);
      setShowFormula(false);
      setShowSolution(false);
      setSelectedOption(null);

      // 3. Update index
      setCurrentIdx(newIdx);

      // 4. Restore drawings for the new question
      const nextQ = exam.questions[newIdx];
      if (nextQ && excalidrawApiRef.current) {
        const savedElements = drawingsMap[nextQ.id] || [];
        try {
          excalidrawApiRef.current.updateScene({ elements: savedElements });
        } catch {
          // ignore
        }
      }
    },
    [exam, drawingsMap, saveCurrentQuestionDrawing]
  );

  // Keyboard navigation: ArrowLeft/ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if typing inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToQuestion(currentIdx - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToQuestion(currentIdx + 1);
      } else if (e.key === "1") {
        setShowHint((prev) => !prev);
      } else if (e.key === "2") {
        setShowFormula((prev) => !prev);
      } else if (e.key === "3") {
        setShowSolution((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, goToQuestion]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Clear drawing for current question
  const handleClearCurrentDrawing = () => {
    if (!excalidrawApiRef.current || !exam?.questions) return;
    const currentQ = exam.questions[currentIdx];
    if (!currentQ) return;

    if (confirm("Thầy/Cô có chắc chắn muốn xóa sạch nháp của câu này?")) {
      excalidrawApiRef.current.updateScene({ elements: [] });
      setDrawingsMap((prev) => ({
        ...prev,
        [currentQ.id]: [],
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-amber-400" />
          <p className="text-sm font-semibold tracking-wide">Đang khởi tạo Bục Giảng Số...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
        <h2 className="text-xl font-bold text-red-400">Không thể mở Bục Giảng Số</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md">{error || "Đề thi không tồn tại."}</p>
        <button
          onClick={() => router.push("/exams")}
          className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md cursor-pointer hover:bg-primary/90"
        >
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

  const currentQ: Question | undefined = exam.questions?.[currentIdx];
  const totalQuestions = exam.questions?.length || 0;

  // Options parsing helper
  let parsedOptions: string[] = [];
  if (currentQ?.options) {
    if (Array.isArray(currentQ.options)) {
      parsedOptions = currentQ.options as string[];
    } else if (typeof currentQ.options === "object") {
      parsedOptions = Object.values(currentQ.options as Record<string, string>);
    }
  }

  // Text size classes
  const contentFontSizeClass =
    fontSize === "xl" ? "text-2xl leading-relaxed" : fontSize === "lg" ? "text-xl leading-relaxed" : "text-base leading-normal";
  const optionFontSizeClass =
    fontSize === "xl" ? "text-xl" : fontSize === "lg" ? "text-lg" : "text-sm";

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 1. TOP BAR: Header Bục Giảng Số */}
      <header className="flex h-14 flex-none items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-md z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/exams"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            title="Thoát Bục Giảng & Quay lại đề thi"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Thoát</span>
          </Link>

          <span className="h-4 w-px bg-slate-700 hidden sm:inline" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider shrink-0">
              <Crown className="w-3 h-3 text-amber-400" /> Bục Giảng Số PRO
            </span>
            <h1 className="truncate text-sm font-bold text-white max-w-xs md:max-w-md" title={exam.name}>
              {exam.name}
            </h1>
          </div>
        </div>

        {/* Center: Split View Controls */}
        <div className="hidden md:flex items-center gap-1 rounded-xl bg-slate-800 p-1 border border-slate-700/80 text-xs">
          <button
            onClick={() => setSplitRatio(100)}
            title="Chỉ xem Đề thi (100% Câu hỏi)"
            className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 100 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            Chỉ xem Đề
          </button>
          <button
            onClick={() => setSplitRatio(50)}
            title="Chia đôi màn hình (50% Đề - 50% Bảng nháp)"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 50 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" /> 50:50
          </button>
          <button
            onClick={() => setSplitRatio(70)}
            title="Ưu tiên Đề thi (70% Đề - 30% Bảng nháp)"
            className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 70 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            70% Đề
          </button>
          <button
            onClick={() => setSplitRatio(0)}
            title="Bung toàn màn hình Bảng trắng Excalidraw"
            className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 0 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            Chỉ vẽ Bảng
          </button>
        </div>

        {/* Right Tools: Font Size, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Cỡ chữ máy chiếu */}
          <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700 px-1 py-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-1.5 hidden sm:inline">Cỡ chữ:</span>
            <button
              onClick={() => setFontSize("md")}
              className={`rounded px-1.5 py-0.5 font-bold cursor-pointer ${
                fontSize === "md" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize("lg")}
              className={`rounded px-1.5 py-0.5 font-bold cursor-pointer text-sm ${
                fontSize === "lg" ? "bg-slate-700 text-amber-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize("xl")}
              className={`rounded px-1.5 py-0.5 font-bold cursor-pointer text-base ${
                fontSize === "xl" ? "bg-slate-700 text-amber-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              A++
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toàn màn hình trình chiếu (F11)"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 2. BODY: SPLIT VIEW (LEFT QUESTION, RIGHT EXCALIDRAW) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ================= LEFT PANE: CÂU HỎI & MỞ TỪNG LỚP ĐÁP ÁN ================= */}
        {splitRatio > 0 && (
          <div
            className="flex flex-col border-r border-slate-800 bg-slate-900 overflow-y-auto"
            style={{ width: splitRatio === 100 ? "100%" : `${splitRatio}%` }}
          >
            {currentQ ? (
              <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto w-full">
                <div className="space-y-6">
                  {/* Question Meta Badge */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-3.5 py-1 text-sm font-black text-white shadow-xs">
                        CÂU {currentIdx + 1}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        / {totalQuestions} câu
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-300 capitalize font-medium">
                        {currentQ.difficulty === "easy"
                          ? "Mức độ: Nhận biết"
                          : currentQ.difficulty === "medium"
                          ? "Mức độ: Thông hiểu"
                          : currentQ.difficulty === "hard"
                          ? "Mức độ: Vận dụng"
                          : "Mức độ: Vận dụng cao"}
                      </span>
                      {drawingsMap[currentQ.id]?.length ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          ✏️ Đã có nháp
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Question Content (Large Projector Typography + LaTeX) */}
                  <div className={`font-semibold text-slate-100 ${contentFontSizeClass}`}>
                    <LatexRenderer content={currentQ.content} />
                  </div>

                  {/* Options (If multiple choice) */}
                  {parsedOptions.length > 0 && (
                    <div className="grid gap-3 pt-2 sm:grid-cols-2">
                      {parsedOptions.map((opt, oIdx) => {
                        const optKey = ["A", "B", "C", "D", "E"][oIdx] || `P${oIdx + 1}`;
                        const isCorrectOption =
                          showSolution &&
                          currentQ.correct_answer &&
                          currentQ.correct_answer.trim().toUpperCase().startsWith(optKey);
                        const isUserClicked = selectedOption === optKey;

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => setSelectedOption(optKey)}
                            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition cursor-pointer shadow-xs ${
                              isCorrectOption
                                ? "border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-2 ring-emerald-500"
                                : isUserClicked
                                ? "border-blue-500 bg-blue-950/40 text-blue-200 ring-1 ring-blue-500"
                                : "border-slate-800 bg-slate-800/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                                isCorrectOption
                                  ? "bg-emerald-500 text-white"
                                  : isUserClicked
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-700 text-slate-200"
                              }`}
                            >
                              {optKey}
                            </span>
                            <div className={`pt-0.5 font-medium ${optionFontSizeClass}`}>
                              <LatexRenderer content={opt.replace(/^[A-D]\.\s*/, "")} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ================= 3 PROGRESSIVE DISCLOSURE LAYERS ================= */}
                  <div className="space-y-3 pt-4">
                    {/* Layer 1: Gợi ý tư duy */}
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 transition-all">
                      <button
                        onClick={() => setShowHint((v) => !v)}
                        className="flex w-full items-center justify-between text-xs font-bold text-amber-300 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>LỚP 1: GỢI Ý PHƯƠNG PHÁP TƯ DUY (Phím tắt: 1)</span>
                        </span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px]">
                          {showHint ? "Ẩn gợi ý" : "Hiện gợi ý"}
                        </span>
                      </button>

                      {showHint && (
                        <div className="mt-3 text-sm text-amber-200/90 leading-relaxed pt-2 border-t border-amber-500/20">
                          {currentQ.explanation ? (
                            <LatexRenderer
                              content={
                                currentQ.explanation.split("\n")[0] ||
                                "Xác định các đại lượng đã biết, phân tích mối liên hệ và áp dụng công thức tương ứng."
                              }
                            />
                          ) : (
                            <p>Xác định giả thiết bài toán, phân tích câu hỏi và áp dụng định lý cơ bản.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Layer 2: Công thức trọng tâm */}
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4 transition-all">
                      <button
                        onClick={() => setShowFormula((v) => !v)}
                        className="flex w-full items-center justify-between text-xs font-bold text-blue-300 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileCode2 className="w-4 h-4 text-blue-400" />
                          <span>LỚP 2: CÔNG THỨC & KIẾN THỨC CỐT LÕI (Phím tắt: 2)</span>
                        </span>
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px]">
                          {showFormula ? "Ẩn công thức" : "Hiện công thức"}
                        </span>
                      </button>

                      {showFormula && (
                        <div className="mt-3 text-sm text-blue-200/90 leading-relaxed pt-2 border-t border-blue-500/20">
                          {currentQ.explanation && currentQ.explanation.includes("$") ? (
                            <LatexRenderer content={currentQ.explanation} />
                          ) : (
                            <p>Áp dụng hệ quả và công thức biến đổi tương đương theo chương trình GDPT 2025.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Layer 3: Đáp án đúng & Lời giải chi tiết */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 transition-all">
                      <button
                        onClick={() => setShowSolution((v) => !v)}
                        className="flex w-full items-center justify-between text-xs font-bold text-emerald-300 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>LỚP 3: ĐÁP ÁN ĐÚNG & LỜI GIẢI CHI TIẾT (Phím tắt: 3)</span>
                        </span>
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px]">
                          {showSolution ? "Ẩn lời giải" : "Xem toàn bộ lời giải"}
                        </span>
                      </button>

                      {showSolution && (
                        <div className="mt-3 space-y-2.5 text-sm text-emerald-200 leading-relaxed pt-2 border-t border-emerald-500/20">
                          {currentQ.correct_answer && (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-400">Đáp án chuẩn:</span>
                              <span className="inline-block rounded-lg bg-emerald-500 px-3 py-1 font-black text-white shadow-xs">
                                {currentQ.correct_answer}
                              </span>
                            </div>
                          )}
                          <div className="pt-2 text-slate-200">
                            {currentQ.explanation ? (
                              <LatexRenderer content={currentQ.explanation} />
                            ) : (
                              <p className="italic text-slate-400">Chưa có bản ghi lời giải chi tiết cho câu hỏi này.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Navigation Bar (Bottom of Left Pane) */}
                <div className="mt-8 border-t border-slate-800 pt-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => goToQuestion(currentIdx - 1)}
                      disabled={currentIdx === 0}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Câu trước (←)</span>
                    </button>

                    <span className="text-xs font-bold text-slate-400">
                      Câu {currentIdx + 1} / {totalQuestions}
                    </span>

                    <button
                      onClick={() => goToQuestion(currentIdx + 1)}
                      disabled={currentIdx === totalQuestions - 1}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-md"
                    >
                      <span>Câu tiếp (→)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Question Dots / Grid */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 max-h-24 overflow-y-auto">
                    {exam.questions?.map((q, idx) => {
                      const isCurrent = idx === currentIdx;
                      const hasDrawing = drawingsMap[q.id]?.length > 0;

                      return (
                        <button
                          key={q.id || idx}
                          onClick={() => goToQuestion(idx)}
                          title={`Nhảy tới Câu ${idx + 1}${hasDrawing ? " (Có nháp)" : ""}`}
                          className={`relative h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isCurrent
                              ? "bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {idx + 1}
                          {hasDrawing && !isCurrent && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-slate-500">
                Chưa có câu hỏi nào trong đề thi này.
              </div>
            )}
          </div>
        )}

        {/* ================= RIGHT PANE: BẢNG TRẮNG EXCALIDRAW ================= */}
        {splitRatio < 100 && (
          <div
            className="flex flex-col bg-white overflow-hidden relative"
            style={{ width: splitRatio === 0 ? "100%" : `${100 - splitRatio}%` }}
          >
            {/* Whiteboard Toolbar Header */}
            <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 z-20">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                  ✏️ Bảng nháp Câu {currentIdx + 1}
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  (Nét vẽ tự lưu riêng cho từng câu)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClearCurrentDrawing}
                  title="Xóa trắng bảng nháp của câu này"
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xóa nháp</span>
                </button>
              </div>
            </div>

            {/* Excalidraw Component Container */}
            <div className="flex-1 w-full h-[calc(100%-44px)] relative">
              <WhiteboardCanvas
                height="100%"
                isPro={isPro}
                initialElements={currentQ ? (drawingsMap[currentQ.id] as any) || [] : []}
                onApiReady={(api) => {
                  excalidrawApiRef.current = api as unknown as ExcalidrawAPI;
                }}
                onChange={(elements) => {
                  if (currentQ) {
                    setDrawingsMap((prev) => ({
                      ...prev,
                      [currentQ.id]: elements as unknown[],
                    }));
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeachingStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
          <Loader2 className="h-9 w-9 animate-spin text-amber-400" />
        </div>
      }
    >
      <TeachingStudioContent />
    </Suspense>
  );
}
