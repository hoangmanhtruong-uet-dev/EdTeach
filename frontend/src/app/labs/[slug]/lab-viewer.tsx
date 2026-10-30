"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Maximize2,
  Lock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  PenTool,
} from "lucide-react";
import {
  SUBJECT_LABEL,
  SUBJECT_COLOR,
  type LabLesson,
  isLabFreeTrial,
  FREE_TRIAL_LABS,
  labCoverUrl,
} from "@/data/labs";
import { useAuth } from "@/context/auth-context";
import { isProUser as checkIsPro, isMaxUser as checkIsMax } from "@/lib/payment/plans";
import { TransparentWhiteboardOverlay } from "@/components/labs/transparent-whiteboard-overlay";

export function LabViewer({ lab }: { lab: LabLesson }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user, profile, isLoading } = useAuth();
  const [showGlassOverlay, setShowGlassOverlay] = useState(false);

  const isProUser = checkIsPro(profile) || checkIsPro(user) || checkIsMax(profile) || checkIsMax(user);
  const isFree = isLabFreeTrial(lab.slug);
  const isLocked = !isLoading && !isFree && !isProUser;

  const handleFullscreen = useCallback(() => {
    const el = iframeRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  }, []);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Top bar */}
      <div className="flex h-12 flex-none items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-xs">
        <Link
          href="/labs"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
        <span className="mx-1 text-slate-300">|</span>
        <h1 className="flex-1 truncate text-sm font-semibold text-slate-800">
          {lab.titleVi}
        </h1>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${SUBJECT_COLOR[lab.subject]}`}
        >
          {SUBJECT_LABEL[lab.subject]}
        </span>

        {isLocked ? (
          <span className="flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-bold text-amber-300">
            <Lock className="h-3 w-3 text-amber-400" /> PRO
          </span>
        ) : isFree && !isProUser ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
            Dùng thử Miễn phí
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            PRO Mở Khóa
          </span>
        )}

        {!isLocked && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGlassOverlay((prev) => !prev)}
              title="Bật/Tắt Lớp kính vẽ trong suốt đè lên màn hình 3D (Gói PRO)"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                showGlassOverlay
                  ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs"
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>{showGlassOverlay ? "Tắt kính vẽ" : "Kính vẽ giảng bài (PRO)"}</span>
            </button>

            <button
              onClick={handleFullscreen}
              title="Toàn màn hình (F11)"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Free Trial Notification Banner */}
      {isFree && !isProUser && (
        <div className="flex items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>
              Thầy Cô đang trải nghiệm bài dùng thử miễn phí môn {SUBJECT_LABEL[lab.subject]}. Nâng cấp PRO để mở full 54+ thí nghiệm & nhận 30.000 credits soạn đề AI!
            </span>
          </div>
          <Link
            href="/wallet?plan=pro"
            className="shrink-0 font-bold text-amber-800 hover:underline"
          >
            Nâng cấp PRO →
          </Link>
        </div>
      )}

      {/* Main Content: Paywall Lock Screen OR 3D Iframe */}
      {isLocked ? (
        <div className="relative flex flex-1 items-center justify-center p-6 bg-slate-900 overflow-hidden">
          {/* Blurred Background Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={labCoverUrl(lab.slug)}
            alt={lab.titleVi}
            className="absolute inset-0 h-full w-full object-cover blur-md opacity-30 pointer-events-none"
          />

          <div className="relative max-w-md w-full rounded-2xl bg-white p-7 text-center shadow-2xl border border-slate-200 animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
              <Lock className="w-7 h-7" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              ĐẶC QUYỀN GÓI GIÁO VIÊN PRO
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2 leading-snug">
              Mở khóa Thí Nghiệm 3D
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Bài học <strong>&ldquo;{lab.titleVi}&rdquo;</strong> thuộc hệ thống 50+ phòng thí nghiệm 3D độc quyền. Tài khoản Free chỉ được dùng thử 1 bài mỗi môn.
            </p>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 text-left space-y-2 mb-6 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mở khóa toàn bộ 54+ thí nghiệm 3D (Lý, Hóa, Sinh, Địa)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cộng thêm +30.000 Credits AI Soạn đề bám sát GDPT 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chấm trắc nghiệm tự động không giới hạn</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/wallet?plan=pro"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nâng cấp Gói PRO (99.000đ/tháng)</span>
              </Link>

              {FREE_TRIAL_LABS[lab.subject] && (
                <Link
                  href={`/labs/${FREE_TRIAL_LABS[lab.subject]}`}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition text-center"
                >
                  Xem bài dùng thử miễn phí môn {SUBJECT_LABEL[lab.subject]}
                </Link>
              )}

              <Link
                href="/labs"
                className="text-xs text-slate-400 hover:text-slate-600 transition pt-1"
              >
                Quay lại danh mục thí nghiệm
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 w-full overflow-hidden">
          <iframe
            ref={iframeRef}
            src={`/labs/courses/${lab.slug}.html`}
            className="h-full w-full border-0"
            allow="fullscreen"
            title={lab.titleVi}
          />
          <TransparentWhiteboardOverlay
            isOpen={showGlassOverlay}
            onClose={() => setShowGlassOverlay(false)}
            labTitle={lab.titleVi}
          />
        </div>
      )}
    </div>
  );
}
