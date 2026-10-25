"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  SwitchCamera,
  Check,
  ChevronRight,
  Smartphone,
  Layers,
} from "lucide-react";

function ScannerContent() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  const [token, setToken] = useState(urlToken);
  const [pinInput, setPinInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sessionData, setSessionData] = useState<{
    sessionName: string;
    subject: string;
    grade: string;
    questionCount: number;
    sheetType: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [flashOnScreen, setFlashOnScreen] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastGradedStudent, setLastGradedStudent] = useState<{
    name: string;
    code: string;
    score: number;
    correct: number;
    incorrect: number;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play synthetic camera shutter sound
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  // Connect to PC session
  const connectToSession = async (tokenOrPin: string) => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/grading/remote-session/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenOrPin, pin: tokenOrPin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsConnected(true);
        setSessionData(data.session);
        setToken(data.session.token);
      } else {
        setErrorMsg(data.error || "Mã kết nối không hợp lệ");
      }
    } catch (e: any) {
      setErrorMsg("Lỗi kết nối máy chủ: " + e.message);
    }
  };

  // Auto connect if token is in URL
  useEffect(() => {
    if (urlToken) {
      connectToSession(urlToken);
    }
  }, [urlToken]);

  // Start Camera Stream
  useEffect(() => {
    if (!isConnected) return;

    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setErrorMsg(
          "Không thể truy cập camera. Vui lòng cấp quyền máy ảnh trên trình duyệt."
        );
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isConnected, facingMode]);

  // Flip Camera
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Capture & Send to PC
  const handleCapture = async () => {
    if (!videoRef.current || isCapturing || !token) return;

    setIsCapturing(true);

    // Haptic feedback & shutter sound
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 20, 40]);
    }
    playShutterSound();

    // Screen flash effect
    setFlashOnScreen(true);
    setTimeout(() => setFlashOnScreen(false), 120);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.82);

        // Send to PC
        const res = await fetch("/api/grading/remote-session/submit-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            imageBase64,
            studentName: `Học sinh ${captureCount + 1}`,
            studentCode: `${1000 + captureCount + 1}`,
          }),
        });

        if (res.ok) {
          setCaptureCount((prev) => prev + 1);
        } else {
          const data = await res.json();
          alert(data.error || "Gửi ảnh thất bại");
        }
      }
    } catch (err: any) {
      alert("Lỗi chụp ảnh: " + err.message);
    } finally {
      setTimeout(() => {
        setIsCapturing(false);
      }, 700);
    }
  };

  // Poll for latest graded result from PC
  useEffect(() => {
    if (!isConnected || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/grading/remote-session/poll?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          if (data.latestResult) {
            setLastGradedStudent({
              name: data.latestResult.studentName,
              code: data.latestResult.studentCode,
              score: data.latestResult.score,
              correct: data.latestResult.correctCount,
              incorrect: data.latestResult.incorrectCount,
            });
          }
        }
      } catch {
        // silent
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, token]);

  // Screen 1: Connect with PIN/Token (if not auto-connected via QR)
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
            <Smartphone className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">Camera Chấm Trắc Nghiệm</h1>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              Biến điện thoại thành máy quét bài thi không dây cho máy tính
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-800/60 p-3 text-xs text-red-300 text-left">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 space-y-4 shadow-xl">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5 text-left">
                Nhập mã PIN 4 số trên màn hình máy tính:
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ví dụ: 8291"
                className="w-full text-center font-mono text-2xl font-black tracking-widest bg-neutral-950 border border-neutral-700 rounded-xl py-3 focus:outline-none focus:border-primary text-primary"
              />
            </div>

            <button
              onClick={() => connectToSession(pinInput)}
              disabled={!pinInput.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition"
            >
              Kết nối với Máy tính
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-[11px] text-neutral-500">
            Mẹo: Thầy/Cô có thể dùng camera điện thoại quét thẳng mã QR trên máy tính để vào ngay không cần nhập số.
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Active Fullscreen Mobile Camera Viewfinder
  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col select-none overflow-hidden touch-none">
      {/* Screen flash animation when capturing */}
      {flashOnScreen && (
        <div className="absolute inset-0 z-50 bg-white pointer-events-none transition-opacity duration-100" />
      )}

      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Đã nối PC
          </div>
          <span className="text-xs text-neutral-300 font-medium truncate max-w-[140px]">
            {sessionData?.sessionName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-neutral-800/80 px-2.5 py-1 rounded-full border border-neutral-700">
            Đã gửi: {captureCount}
          </span>
          <button
            onClick={handleToggleCamera}
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-neutral-700"
            title="Đổi camera trước/sau"
          >
            <SwitchCamera className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Live Camera Viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-neutral-950">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Viewfinder Target Overlay for A4 Sheet */}
        <div className="relative w-[85%] max-w-[340px] aspect-[1/1.414] border-2 border-emerald-500/40 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex flex-col justify-between p-3">
          {/* Corner target reticles */}
          <div className="flex justify-between">
            <div className="w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl -mt-1 -ml-1" />
            <div className="w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr -mt-1 -mr-1" />
          </div>

          {/* Animated Laser Scanning Line */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[scannerBeam_2.5s_ease-in-out_infinite]" />

          {/* Center hint text */}
          <div className="self-center bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide text-emerald-300 border border-emerald-500/30">
            Căn phiếu thi khớp 4 góc
          </div>

          <div className="flex justify-between">
            <div className="w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl -mb-1 -ml-1" />
            <div className="w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br -mb-1 -mr-1" />
          </div>
        </div>

        {/* Floating Realtime Graded Notification Banner */}
        {lastGradedStudent && (
          <div className="absolute top-4 inset-x-4 z-30 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between rounded-xl bg-neutral-900/95 border border-emerald-500/50 p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-sm">
                  {lastGradedStudent.score}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {lastGradedStudent.name} (SBD: {lastGradedStudent.code})
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-0.5">
                    ✓ {lastGradedStudent.correct} câu đúng • Đã lưu sang máy tính!
                  </p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Shutter Controls */}
      <div className="relative z-20 flex flex-col items-center justify-center px-6 py-5 bg-gradient-to-t from-black via-black/80 to-transparent">
        <p className="text-[11px] text-neutral-400 mb-3 font-medium">
          Chụp xong lật ngay bài tiếp theo, máy tính tự động lưu điểm
        </p>

        {/* Big Tactile Shutter Button */}
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="relative group flex items-center justify-center w-20 h-20 rounded-full border-4 border-white bg-transparent p-1 transition-transform active:scale-90"
        >
          <div
            className={`w-full h-full rounded-full transition-colors ${
              isCapturing ? "bg-emerald-500 animate-pulse" : "bg-white group-hover:bg-neutral-200"
            }`}
          />
        </button>
      </div>

      <style>{`
        @keyframes scannerBeam {
          0%, 100% { top: 4%; }
          50% { top: 94%; }
        }
      `}</style>
    </div>
  );
}

export default function MobileScannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-xs">Đang tải camera...</p>
        </div>
      }
    >
      <ScannerContent />
    </Suspense>
  );
}
