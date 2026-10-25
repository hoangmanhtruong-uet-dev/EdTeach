"use client";

import React, { useState } from "react";
import {
  Store,
  Search,
  Filter,
  Download,
  Star,
  BookOpen,
  Eye,
  Sparkles,
  Award,
  Globe,
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

interface MarketplaceExam {
  id: string;
  title: string;
  subject: string;
  grade: number;
  author: string;
  authorRole: string;
  downloads: number;
  rating: number;
  priceCredits: number;
  questionCount: number;
  tags: string[];
  hasSolution: boolean;
}

const SAMPLE_EXAMS: MarketplaceExam[] = [
  {
    id: "mk-1",
    title: "Bộ đề ôn thi Học kì 1 Toán 12 bám sát cấu trúc mới 2025 (Có giải chi tiết)",
    subject: "Toán",
    grade: 12,
    author: "Thầy Nguyễn Quốc Huy",
    authorRole: "GV Chuyên Toán Hà Nội - Amsterdam",
    downloads: 1420,
    rating: 4.9,
    priceCredits: 10,
    questionCount: 50,
    tags: ["Form 2025", "Đúng/Sai", "Trả lời ngắn"],
    hasSolution: true,
  },
  {
    id: "mk-2",
    title: "Tuyển tập 30 Đề thi vào 10 Chuyên Anh & Đại trà chuẩn form Sở GD&ĐT",
    subject: "Tiếng Anh",
    grade: 9,
    author: "Cô Mai Phương Thảo",
    authorRole: "Tổ trưởng Ngoại ngữ THCS Giảng Võ",
    downloads: 980,
    rating: 4.8,
    priceCredits: 15,
    questionCount: 40,
    tags: ["Luyện thi vào 10", "Ngữ pháp", "Đọc hiểu"],
    hasSolution: true,
  },
  {
    id: "mk-3",
    title: "Đề kiểm tra giữa kì 1 Vật lí 11 - Kết nối tri thức có Barem chấm điểm",
    subject: "Vật lí",
    grade: 11,
    author: "Thầy Trần Đức Anh",
    authorRole: "Giáo viên THPT Kim Liên",
    downloads: 650,
    rating: 4.7,
    priceCredits: 8,
    questionCount: 28,
    tags: ["KNTT", "Dao động điều hòa", "Sóng cơ"],
    hasSolution: true,
  },
  {
    id: "mk-4",
    title: "Ngân hàng 200 câu hỏi Hóa học 10 chương Cấu tạo nguyên tử & Bảng tuần hoàn",
    subject: "Hóa học",
    grade: 10,
    author: "Thầy Lê Minh Tuấn",
    authorRole: "Hóa học Trẻ Việt Nam",
    downloads: 820,
    rating: 4.9,
    priceCredits: 12,
    questionCount: 60,
    tags: ["Cánh Diều", "Chân Trời", "Ma trận ma trận"],
    hasSolution: true,
  },
  {
    id: "mk-5",
    title: "Đề thi thử Tốt nghiệp THPT 2025 môn Ngữ văn - Kèm dàn ý chi tiết bài nghị luận",
    subject: "Ngữ văn",
    grade: 12,
    author: "Cô Hoàng Lan Anh",
    authorRole: "Thạc sĩ Văn học ĐH Sư Phạm",
    downloads: 1250,
    rating: 5.0,
    priceCredits: 10,
    questionCount: 5,
    tags: ["Đọc hiểu", "Nghị luận xã hội", "Nghị luận văn học"],
    hasSolution: true,
  },
  {
    id: "mk-6",
    title: "Đề khảo sát chất lượng Sinh học 12 Chương Di truyền quần thể & Tiến hóa",
    subject: "Sinh học",
    grade: 12,
    author: "Thầy Phạm Văn Cường",
    authorRole: "Chuyên viên Khảo thí & KĐCLGD",
    downloads: 510,
    rating: 4.8,
    priceCredits: 10,
    questionCount: 40,
    tags: ["Di truyền học", "Định luật Hardy-Weinberg"],
    hasSolution: true,
  },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Web Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<any | null>(null);

  // Filter logic
  const filteredExams = SAMPLE_EXAMS.filter((exam) => {
    const matchSearch =
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.author.toLowerCase().includes(search.toLowerCase()) ||
      exam.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchSubject = selectedSubject === "all" || exam.subject === selectedSubject;
    const matchGrade = selectedGrade === "all" || exam.grade.toString() === selectedGrade;

    return matchSearch && matchSubject && matchGrade;
  });

  // Tải file Word (.docx) thật về máy
  const handleDownloadWord = async (exam: MarketplaceExam) => {
    try {
      setDownloadingId(exam.id);

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "SỞ GIÁO DỤC VÀ ĐÀO TẠO - TRƯỜNG THPT CHUYÊN",
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: exam.title.toUpperCase(),
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: `Môn: ${exam.subject} - Lớp: ${exam.grade} | Thời gian làm bài: 90 phút`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              }),
              new Paragraph({
                text: "-------------------------------------------------------------",
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              }),
              ...Array.from({ length: Math.min(10, exam.questionCount) }).map((_, idx) => {
                const qNum = idx + 1;
                return new Paragraph({
                  children: [
                    new TextRun({ text: `Câu ${qNum}: `, bold: true }),
                    new TextRun({
                      text: `Cho hàm số hoặc biểu thức tương ứng câu hỏi ${qNum} của đề thi ${exam.title}. Mệnh đề nào sau đây đúng?`,
                    }),
                    new TextRun({ text: "\nA. Phương án A đúng.", break: 1 }),
                    new TextRun({ text: "\nB. Phương án B.", break: 1 }),
                    new TextRun({ text: "\nC. Phương án C.", break: 1 }),
                    new TextRun({ text: "\nD. Phương án D.", break: 1 }),
                  ],
                  spacing: { after: 200 },
                });
              }),
              new Paragraph({
                text: "--- HẾT ---",
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `De_Thi_${exam.subject}_Lop${exam.grade}_${exam.id}.docx`);
    } catch (err: any) {
      alert("Lỗi tải file Word: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // Bóc tách đề thi từ URL web bất kỳ
  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      setImportError("Vui lòng nhập đường link bài viết hoặc đề thi.");
      return;
    }

    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(null);

      const res = await fetch("/api/exams/import-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportError(data.error || "Không thể bóc tách đề từ liên kết này.");
        return;
      }

      setImportSuccess(data);
    } catch (err: any) {
      setImportError("Lỗi kết nối khi bóc tách đề: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Cộng đồng đề thi</h1>
            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
              Chất lượng cao
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Khám phá, tải về file Word chuẩn hoặc tự động bóc tách đề thi từ các website giáo dục
          </p>
        </div>

        {/* Nút Nhập link đề từ web */}
        <button
          onClick={() => {
            setShowImportModal(true);
            setImportError(null);
            setImportSuccess(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition shadow-sm cursor-pointer shrink-0"
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Nhập link đề từ web</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên đề, giáo viên, chủ đề..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs border border-border rounded-xl px-3 py-2 bg-white text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả môn</option>
            <option value="Toán">Toán</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
            <option value="Vật lí">Vật lí</option>
            <option value="Hóa học">Hóa học</option>
            <option value="Sinh học">Sinh học</option>
            <option value="Ngữ văn">Ngữ văn</option>
          </select>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="text-xs border border-border rounded-xl px-3 py-2 bg-white text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả khối lớp</option>
            <option value="9">Lớp 9</option>
            <option value="10">Lớp 10</option>
            <option value="11">Lớp 11</option>
            <option value="12">Lớp 12</option>
          </select>
        </div>
      </div>

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-2xl p-5 border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                  {exam.subject} • Lớp {exam.grade}
                </span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {exam.rating}
                </span>
              </div>

              <h3 className="font-bold text-foreground text-sm mb-2 line-clamp-2 leading-snug">
                {exam.title}
              </h3>

              <div className="flex flex-wrap gap-1 mb-3">
                {exam.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="text-xs text-muted-foreground mb-4 pb-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{exam.author}</div>
                  <div className="text-[11px] text-muted-foreground">{exam.authorRole}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{exam.questionCount} câu</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Có giải chi tiết</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-lg font-black text-primary">
                  {exam.priceCredits}
                </span>
                <span className="text-xs font-semibold text-muted-foreground ml-1">Credits</span>
              </div>

              <button
                onClick={() => handleDownloadWord(exam)}
                disabled={downloadingId === exam.id}
                className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {downloadingId === exam.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Tải Word (.docx)</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* MODAL: NHẬP LINK ĐỀ THI TỪ WEB GIÁO DỤC (AI CÀO & BÓC TÁCH) */}
      {/* ========================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border relative">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Bóc tách đề thi từ trang web giáo dục
              </h3>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Dán đường link từ các trang chia sẻ tài liệu (VnDoc, VietJack, Thuvienhoclieu, Hoc247...).
              AI sẽ tự động đọc câu hỏi, đáp án và lưu thẳng vào kho đề của bạn.
            </p>

            {importSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm mb-1 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã bóc tách thành công {importSuccess.questionCount} câu hỏi!</span>
                  </div>
                  <p className="mt-1">
                    Đề thi: <strong>{importSuccess.examName}</strong> ({importSuccess.subject} - Lớp{" "}
                    {importSuccess.grade}) đã được lưu vào danh sách đề thi của bạn.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/exams/${importSuccess.examId}`}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở chỉnh sửa trong Studio</span>
                  </Link>

                  <button
                    onClick={() => {
                      setImportSuccess(null);
                      setImportUrl("");
                    }}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Nhập link khác
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Đường dẫn bài viết chứa đề thi
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://thuvienhoclieu.com/de-thi-giua-ki-1-toan-12..."
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    />
                  </div>
                </div>

                {importError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {importError}
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                  💡 <strong>Gợi ý:</strong> Bạn có thể copy link bất kỳ bài tập, đề kiểm tra hoặc ngân
                  hàng câu hỏi nào trên internet để AI chuyển đổi tự động sang định dạng EdTeach.
                </div>

                <button
                  type="button"
                  onClick={handleImportFromUrl}
                  disabled={isImporting}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI đang đọc trang web & bóc tách câu hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Bóc tách & Tải về kho đề của tôi</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
