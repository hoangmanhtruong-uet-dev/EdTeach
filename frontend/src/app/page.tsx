"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  Shield,
  Zap,
  Users,
  BarChart3,
  ArrowRight,
  Check,
  Crown,
  Presentation,
  FlaskConical,
  Wand2,
  Timer,
  Layers,
  Flame,
  Calculator,
  MessageSquare,
  FileCheck2,
  CheckCircle2,
  HelpCircle,
  Eye,
  FileSpreadsheet,
  Columns2,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "semester">("monthly");

  return (
    <div className="flex min-h-screen flex-col bg-[#ebf3fb]">
      <Navbar />

      <main className="flex-1">
        {/* ================= 1. HERO SECTION ================= */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-100/60 via-background/40 to-background" />
          
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Beta v1.0.0 Notice Pill */}
              <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/40 px-4 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>EdTeach v1.0.0 Beta • Bản thử nghiệm 14 ngày mở khóa toàn bộ PRO & MAX</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl leading-[1.15]">
                Hệ sinh thái Bục Giảng Số &
                <br />
                <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Soạn Đề AI Chuẩn GDPT 2025
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto max-w-2xl text-base text-neutral-600 sm:text-lg leading-relaxed">
                Không chỉ là soạn đề tự động — <strong>EdTeach</strong> biến màn hình lớp học thành <strong>Bục Giảng Số 4.0</strong> với Chế độ Split-Screen, Kính vẽ trong suốt đè lên 54+ Phòng TN 3D, Đẻ câu luyện tập 2 phút tại chỗ và Chữa nóng câu sai từ chấm thi OMR.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.02]"
                >
                  <span>Dùng thử 14 ngày miễn phí</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-neutral-300 bg-white/80 px-6 text-sm font-bold text-neutral-800 transition-colors hover:bg-white shadow-xs"
                >
                  <Presentation className="h-4 w-4 text-primary" />
                  <span>Khám phá Bục Giảng Số</span>
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-neutral-300 bg-white/80 px-6 text-sm font-bold text-neutral-800 transition-colors hover:bg-white shadow-xs"
                >
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span>Xem Bảng giá</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <p className="mt-4 text-xs font-medium text-neutral-500">
                ✨ Không cần thẻ tín dụng • Tặng 5.000 credits & Chấm trắc nghiệm OMR 100% miễn phí • Mở khóa toàn quyền trải nghiệm 14 ngày
              </p>
            </div>
          </div>
        </section>

        {/* ================= 2. FEATURES SECTION (#features) ================= */}
        <section id="features" className="py-20 bg-white border-y border-neutral-200/80 scroll-mt-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Tính Năng Vượt Trội • Bản Beta v1.0.0
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                Bộ giải pháp đột phá dành riêng cho Giáo viên Việt Nam
              </h2>
              <p className="text-base text-neutral-600 leading-relaxed">
                Giải quyết triệt để nỗi đau chiếu file Word chữ nhỏ, học sinh không hiểu bài vận dụng cao và chấm thi mất hàng giờ mỗi tuần.
              </p>
            </div>

            {/* NHÓM 1: BỤC GIẢNG SỐ 4.0 (GÓI PRO) */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 border-b border-neutral-200 pb-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
                  <Presentation className="w-4 h-4" /> Bục Giảng Số 4.0
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  Đặc quyền Gói PRO
                </span>
                <h3 className="text-lg font-bold text-neutral-900 hidden sm:inline">
                  Trình chiếu & Tương tác thời gian thực trên máy chiếu
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Feature 1 */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 space-y-3 hover:border-blue-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <Columns2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900">
                    Chế độ Chiếu đề Split-Screen (50:50)
                  </h4>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Màn hình chia đôi chuyên nghiệp: Cột trái chiếu câu hỏi với phông lớn sắc nét cho máy chiếu (hỗ trợ 3 lớp mở dần: <em>Gợi ý ➔ Công thức ➔ Lời giải chi tiết</em>). Cột phải là Bảng nháp Excalidraw tự động lưu nét vẽ riêng cho từng câu hỏi.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 space-y-3 hover:border-blue-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900">
                    Kính Vẽ Trong Suốt đè lên Phòng TN 3D
                  </h4>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Khi mở 54+ mô hình 3D (Vật lý, Hóa học, Sinh học, Địa lý), giáo viên bấm 1 nút để bật lớp kính vẽ trong suốt đè trực tiếp lên thí nghiệm. Thầy/Cô vừa cho con lắc dao động hoặc phản ứng chạy, vừa vẽ vector lực, khoanh kết tủa ngay trên màn hình.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 space-y-3 hover:border-blue-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-neutral-900">
                    Xuất Bộ Đề Kép Word Giảng Dạy (.docx)
                  </h4>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Tải về cùng lúc 2 bản Word chuẩn sạch 100% không watermark: <strong>Bản học sinh</strong> (chừa sẵn 3 dòng kẻ chấm dưới mỗi câu cho học sinh ghi chép khi nghe giảng) và <strong>Bản giáo viên</strong> (in kèm đáp án & các bước giải tóm tắt cầm tay).
                  </p>
                </div>
              </div>
            </div>

            {/* NHÓM 2: LUYỆN THI & CHỮA BÀI CHUYÊN SÂU (GÓI MAX VIP) */}
            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-2.5 border-b border-neutral-200 pb-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
                  <Crown className="w-4 h-4" /> Luyện Thi Chuyên Sâu
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                  Vũ khí VIP Gói MAX
                </span>
                <h3 className="text-lg font-bold text-neutral-900 hidden sm:inline">
                  Công cụ chữa bài vận dụng cao và giải quyết dứt điểm câu sai tại chỗ
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Feature 4 */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 space-y-3 hover:border-amber-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-neutral-900">
                      Đẻ Câu Tương Tự & Timer 2 Phút
                    </h4>
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Vừa chữa xong câu khó, nhìn xuống lớp thấy học sinh lơ mơ? Bấm nút <strong>"Đẻ câu tương tự"</strong>: AI sinh ngay câu hỏi mới giữ nguyên dạng bài nhưng đổi số liệu số đẹp, kèm đồng hồ đếm ngược ⏱️ 02:00 để cả lớp vận dụng làm thử ngay tại chỗ.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 space-y-3 hover:border-amber-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-neutral-900">
                      Bẻ Nhỏ Câu Khó 3 Bước (Scaffolding)
                    </h4>
                    <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Với các bài toán phức tạp, AI tự động tách câu hỏi lớn thành 3 câu hỏi phụ dẫn dắt: <em>Bước 1: Khai thác giả thiết & Đổi đơn vị ➔ Bước 2: Thiết lập phương trình cốt lõi ➔ Bước 3: Biện luận chốt đáp số</em> giúp học sinh tự tư duy từ gốc tới ngọn.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 space-y-3 hover:border-amber-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-neutral-900">
                      Chữa Nóng OMR Sang Bục Giảng
                    </h4>
                    <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Sau khi quét camera chấm bài 15 phút tại lớp, giáo viên bấm <strong>"Chữa nóng trên Bục Giảng"</strong>: Hệ thống tự lọc ra các câu có tỷ lệ học sinh làm sai trên 40% và phương án bẫy phổ biến để thầy cô chữa dứt điểm ngay trong tiết học.
                  </p>
                </div>

                {/* Feature 7 */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 space-y-3 hover:border-amber-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-neutral-900">
                      Giải Đa Cách 15s & Tuyệt Kỹ Casio
                    </h4>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Cung cấp cùng lúc 3 góc nhìn giải: <strong>Cách 1:</strong> Tự luận bản chất chuẩn GDPT 2018; <strong>Cách 2:</strong> Tuyệt kỹ trắc nghiệm 15s & Định luật bảo toàn; <strong>Cách 3:</strong> Hướng dẫn bấm máy tính Casio fx-580 / Mẹo nhớ siêu tốc.
                  </p>
                </div>

                {/* Feature 8 */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 space-y-3 hover:border-amber-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-neutral-900">
                      Phiếu Nhận Xét AI Gửi Zalo Phụ Huynh
                    </h4>
                    <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    AI tự động tổng hợp ưu/nhược điểm từng học sinh dựa trên các câu đúng/sai sau khi chấm bài, xuất mẫu tin nhắn trang trọng và chu đáo để giáo viên sao chép gửi thẳng vào Zalo phụ huynh chỉ với 1 chạm.
                  </p>
                </div>

                {/* Feature 9 */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 space-y-3 hover:border-amber-400 hover:shadow-md transition">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-neutral-900">
                      Soạn Đề GDPT 2025 & OMR 0đ
                    </h4>
                    <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      MIỄN PHÍ
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Soạn đề chuẩn ma trận 3 phần Bộ GD&ĐT 2025 (Nhiều lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn). Chấm trắc nghiệm OpenCV OMR qua camera điện thoại 100% miễn phí (0 credits) và xuất bảng điểm Excel chuẩn UTF-8.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. HOW IT WORKS (3 BƯỚC ĐƠN GIẢN) ================= */}
        <section className="py-20 bg-neutral-50/70 border-b border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Quy Trình Giảng Dạy 4.0</span>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Đơn giản chỉ trong 3 bước lên lớp
              </h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl bg-white border border-neutral-200 p-7 text-center space-y-4 shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-black text-white shadow-md">
                  1
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Soạn Đề Chuẩn Ma Trận 2025</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Nhập chủ đề hoặc dán link web, tải PDF cũ lên để AI tự động xây dựng đề thi theo ma trận 3 phần của Bộ GD&ĐT, trộn 4-12 mã đề kèm đáp án.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-neutral-200 p-7 text-center space-y-4 shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-md">
                  2
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Chiếu Lên Bục Giảng Số</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Bật Bục Giảng Số Split-Screen để trình chiếu: Cột trái câu hỏi phông lớn mở từng lớp lời giải, cột phải vẽ nháp Excalidraw, bung Phòng TN 3D và đẻ câu tương tự tại chỗ.
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-neutral-200 p-7 text-center space-y-4 shadow-xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-md">
                  3
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Chấm OMR 0đ & Chữa Nóng</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Quét camera chấm nhanh cả lớp trong 3 phút, tự động thống kê câu sai nhiều nhất và đẩy ngược lại Bục Giảng Số để chữa dứt điểm ngay trong tiết học.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. PRICING SECTION (#pricing) ================= */}
        <section id="pricing" className="py-20 bg-white scroll-mt-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-amber-600" /> Bảng Giá Minh Bạch • Bản Thử Nghiệm Beta v1.0.0
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                Chọn gói vũ khí phù hợp cho Bục Giảng của Thầy/Cô
              </h2>
              <p className="text-base text-neutral-600">
                Đăng ký tài khoản hôm nay để nhận ngay <strong>14 ngày trải nghiệm thử nghiệm không giới hạn</strong> toàn bộ tính năng của cả gói PRO và gói MAX!
              </p>

              {/* Billing Cycle Toggle */}
              <div className="pt-4 flex items-center justify-center">
                <div className="flex items-center rounded-2xl bg-neutral-100 p-1.5 border border-neutral-200">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`rounded-xl px-5 py-2 text-xs font-bold transition cursor-pointer ${
                      billingCycle === "monthly"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Gia hạn từng tháng
                  </button>
                  <button
                    onClick={() => setBillingCycle("semester")}
                    className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition cursor-pointer ${
                      billingCycle === "semester"
                        ? "bg-primary text-white shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <span>Theo Học kỳ (5 Tháng)</span>
                    <span className="rounded bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-slate-950 uppercase">
                      Tiết kiệm 20%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* PLAN 1: FREE */}
              <div className="rounded-3xl border border-neutral-200 bg-white p-7 space-y-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-lg">
                      Cơ bản
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">Dùng vĩnh viễn</span>
                  </div>

                  <h3 className="text-xl font-bold text-neutral-900">Gói Miễn Phí</h3>
                  <p className="text-xs text-neutral-500">
                    Phù hợp cho Thầy/Cô làm quen với AI soạn đề và chấm trắc nghiệm cơ bản.
                  </p>

                  <div className="pt-2">
                    <span className="text-4xl font-extrabold text-neutral-900">0₫</span>
                    <span className="text-xs text-neutral-500 ml-1">/tháng</span>
                    <p className="text-xs font-bold text-primary mt-1">Tặng 5.000 credits khi đăng ký</p>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-neutral-100 text-xs text-neutral-700">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Tặng 5.000 credits (soạn ~10 đề Flash hoặc ~3 đề Pro)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Chấm trắc nghiệm OpenCV OMR</strong> qua camera 100% miễn phí (0 credits)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Dùng thử 1 bài học 3D miễn phí cho mỗi môn</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Bóc tách câu hỏi tự động từ link web hoặc file văn bản</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Xuất file Word & PDF chuẩn Bộ GD&ĐT</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="w-full rounded-xl border border-neutral-300 py-3 text-center text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition block"
                >
                  Bắt đầu Miễn phí
                </Link>
              </div>

              {/* PLAN 2: PRO */}
              <div className="relative rounded-3xl border-2 border-primary bg-white p-7 space-y-6 flex flex-col justify-between shadow-xl ring-1 ring-primary/20">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-1 text-xs font-black uppercase text-white shadow-md">
                  Khuyên Dùng Cho GV Đứng Lớp
                </span>

                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      Bục Giảng Số 4.0
                    </span>
                    <span className="text-xs font-bold text-emerald-600">Beta: Dùng thử 14 ngày</span>
                  </div>

                  <h3 className="text-xl font-bold text-neutral-900">Gói Giáo Viên PRO</h3>
                  <p className="text-xs text-neutral-500">
                    Biến máy chiếu lớp học thành Bục Giảng Số tương tác đỉnh cao & 54+ Phòng TN 3D.
                  </p>

                  <div className="pt-2">
                    {billingCycle === "monthly" ? (
                      <>
                        <span className="text-4xl font-extrabold text-neutral-900">149.000₫</span>
                        <span className="text-xs text-neutral-500 ml-1">/tháng</span>
                        <p className="text-xs font-bold text-primary mt-1">+30.000 credits/tháng vào ví</p>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-neutral-900">599.000₫</span>
                        <span className="text-xs text-neutral-500 ml-1">/học kỳ (5 tháng)</span>
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          +150.000 credits • Tiết kiệm 146.000₫
                        </p>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-neutral-100 text-xs text-neutral-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Bục Giảng Số Split-Screen:</strong> Chiếu đề phông lớn + Bảng nháp Excalidraw tự lưu nét vẽ</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Lớp Kính Vẽ Trong Suốt:</strong> Mở khóa 54+ Phòng TN 3D (Lý, Hóa, Sinh, Địa)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Xuất Bộ Đề Kép Word:</strong> Bản học sinh chừa dòng kẻ & Bản giáo viên có lời giải</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Xuất Word (.docx) & PDF sạch 100% <strong>không dính watermark</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Trộn 4 mã đề chuẩn GDPT 2025 kèm ma trận đặc tả</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>Xuất bảng điểm Excel UTF-8 BOM chuẩn Bộ GD&ĐT</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=pro"
                  className="w-full rounded-xl bg-primary py-3 text-center text-xs font-bold text-white hover:bg-primary/90 transition shadow-md block"
                >
                  Trải nghiệm Gói PRO (14 ngày miễn phí)
                </Link>
              </div>

              {/* PLAN 3: MAX */}
              <div className="relative rounded-3xl border-2 border-amber-500 bg-linear-to-b from-amber-500/5 via-white to-orange-500/5 p-7 space-y-6 flex flex-col justify-between shadow-xl">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-black uppercase text-slate-950 shadow-md">
                  Vũ Khí VIP Luyện Thi & Dạy Thêm
                </span>

                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                      Luyện Thi MAX
                    </span>
                    <span className="text-xs font-bold text-amber-600">Beta: Trọn bộ đặc quyền</span>
                  </div>

                  <h3 className="text-xl font-bold text-neutral-900">Gói Luyện Thi MAX</h3>
                  <p className="text-xs text-neutral-500">
                    Giải pháp tối thượng cho giáo viên dạy đội tuyển, dạy thêm và trung tâm luyện thi.
                  </p>

                  <div className="pt-2">
                    {billingCycle === "monthly" ? (
                      <>
                        <span className="text-4xl font-extrabold text-neutral-900">229.000₫</span>
                        <span className="text-xs text-neutral-500 ml-1">/tháng</span>
                        <p className="text-xs font-bold text-amber-600 mt-1">+100.000 credits/tháng (Ưu tiên DeepSeek-R1)</p>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-neutral-900">899.000₫</span>
                        <span className="text-xs text-neutral-500 ml-1">/học kỳ (5 tháng)</span>
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          +500.000 credits • Tiết kiệm 246.000₫
                        </p>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-neutral-100 text-xs text-neutral-700">
                    <li className="flex items-start gap-2.5 font-bold text-neutral-900">
                      <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Bao gồm TOÀN BỘ đặc quyền của Gói PRO</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Đẻ câu tương tự tại chỗ (Live Cloner):</strong> Giữ nguyên dạng bài + Đồng hồ ⏱️ 02:00</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Bẻ nhỏ câu khó 3 bước (AI Scaffolding):</strong> Dẫn dắt sư phạm từ giả thiết đến kết luận</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Giải đa cách 15s & Tuyệt kỹ Casio:</strong> Tự luận bản chất ⇄ 15s Trắc nghiệm ⇄ Casio fx-580</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Chữa nóng OMR sang Bục giảng:</strong> Đẩy câu sai trên 40% lên bảng giảng chữa ngay</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Phiếu nhận xét AI gửi Zalo phụ huynh:</strong> Tự động phân tích ưu/nhược điểm từng học sinh</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Đóng dấu Watermark thương hiệu riêng của Thầy/Cô chống lộ đề</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=max"
                  className="w-full rounded-xl bg-linear-to-r from-amber-500 to-orange-500 py-3 text-center text-xs font-black text-slate-950 hover:brightness-110 transition shadow-md block"
                >
                  Trải nghiệm Gói MAX VIP (14 ngày miễn phí)
                </Link>
              </div>
            </div>

            {/* Trial Banner */}
            <div className="rounded-3xl border border-amber-500/40 bg-linear-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-6 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Chương trình thử nghiệm EdTeach Beta v1.0.0 (14 ngày miễn phí)</span>
              </div>
              <p className="text-xs text-neutral-600 max-w-2xl mx-auto">
                Tất cả tài khoản giáo viên đăng ký mới trong giai đoạn thử nghiệm đều được kích hoạt dùng thử 14 ngày trọn bộ tính năng PRO và MAX VIP. Hãy tạo đề, bật Bục Giảng Số và trải nghiệm ngay trên lớp học của Thầy/Cô!
              </p>
            </div>
          </div>
        </section>

        {/* ================= 5. CTA SECTION ================= */}
        <section className="border-t border-neutral-200 bg-linear-to-b from-blue-50 to-indigo-50/40 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              Sẵn sàng nâng tầm tiết học với EdTeach v1.0.0?
            </h2>
            <p className="text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
              Tham gia cùng hàng nghìn thầy cô đang tiết kiệm hàng giờ soạn đề và biến từng tiết chữa đề thành trải nghiệm tương tác số cuốn hút học sinh.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:scale-105"
              >
                <span>Bắt đầu dùng thử 14 ngày miễn phí</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-xs text-neutral-400">
              Không yêu cầu thông tin thanh toán • Đăng ký bằng Google hoặc Email chỉ mất 30 giây
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
