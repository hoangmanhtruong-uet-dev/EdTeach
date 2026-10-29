import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { type LabSubject } from "@/data/labs";
import { FlaskConical, ExternalLink, ChevronRight, Sparkles } from "lucide-react";
import { LabsCatalog } from "./labs-catalog";

export const metadata: Metadata = {
  title: "Phòng thí nghiệm 3D — EduTest AI",
  description:
    "54 bài thí nghiệm 3D tương tác cho Vật lý, Hóa học, Sinh học và Địa lý — mở trực tiếp trên máy chiếu cho cả lớp.",
};

const SUBJECTS: LabSubject[] = ["phys", "chem", "bio", "geo"];

export default function LabsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-primary/5 p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Phòng thí nghiệm 3D
            </h1>
          </div>
          <p className="mt-3 max-w-3xl text-slate-600 leading-relaxed">
            54 bài thí nghiệm tương tác 3D cho Vật lý, Hóa học, Sinh học và Địa lý bám sát chương trình GDPT.
            Tài khoản Miễn phí được trải nghiệm thử 1 bài mẫu cho mỗi môn học.
            Nâng cấp <strong>Gói Giáo Viên PRO</strong> để mở khóa trọn bộ 54+ bài học và nhận thêm <strong>30.000 credits</strong> soạn đề AI.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Vật lý · 10 bài
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Hóa học · 25 bài
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Sinh học · 5 bài
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Địa lý · 14 bài
            </span>
          </div>
        </section>

        {/* Giới thiệu tính năng & Cơ chế Free Trial */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
            <p>
              <strong>Chính sách trải nghiệm:</strong> Mỗi môn học có 1 bài thí nghiệm mẫu mở khóa hoàn toàn miễn phí cho Thầy Cô dùng thử trên lớp. Nâng cấp Gói PRO (99k/tháng) để mở khóa trọn bộ 54+ bài và nhận 30.000 credits soạn đề AI.
            </p>
          </div>
          <Link
            href="/wallet?plan=pro"
            className="shrink-0 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs hover:from-amber-600 hover:to-amber-700 transition shadow-xs"
          >
            Nâng cấp PRO
          </Link>
        </div>

        {/* Danh sách theo môn (Interactive Catalog with PRO modal) */}
        <LabsCatalog subjects={SUBJECTS} />

        {/* Ghi nguồn theo giấy phép */}
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          <p className="flex items-center gap-2 font-medium text-slate-700">
            <ExternalLink className="h-4 w-4" /> Ghi nguồn (theo yêu cầu giấy phép)
          </p>
          <p className="mt-2">
            Nội dung bài học 3D dựa trên{" "}
            <a
              href="https://lab.tongjiang.app"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Tongjiang Lab
            </a>{" "}
            (CC BY-NC 4.0), sử dụng cho mục đích giáo dục
            phi thương mại. Phần thư viện three.js phát hành theo giấy phép MIT.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-8 flex items-center justify-between rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">
              Thầy cô đang cần ra đề & giao bài tập?
            </h2>
            <p className="mt-1 text-sm opacity-90">
              EduTest AI giúp tạo đề thi chuẩn Bộ GD&ĐT và chấm bài viết tay bằng AI — thử miễn phí.
            </p>
          </div>
          <Link
            href="/register"
            className="flex flex-none items-center gap-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary"
          >
            Dùng thử miễn phí <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
