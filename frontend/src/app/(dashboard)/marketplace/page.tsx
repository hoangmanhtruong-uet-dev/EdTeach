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
  ShoppingCart,
  Sparkles,
  Award,
} from "lucide-react";
import Link from "next/link";

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
    tags: ["NLXH", "NLVH", "Dàn ý 9+"],
    hasSolution: true,
  },
  {
    id: "mk-6",
    title: "Trọn bộ Đề ôn tập Lịch sử 12 theo chuyên đề Lịch sử thế giới hiện đại",
    subject: "Lịch sử",
    grade: 12,
    author: "Thầy Vũ Đình Trọng",
    authorRole: "GV Lịch sử THPT Chu Văn An",
    downloads: 410,
    rating: 4.6,
    priceCredits: 5,
    questionCount: 40,
    tags: ["Lịch sử 2025", "Trắc nghiệm đúng sai"],
    hasSolution: true,
  },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [selectedGrade, setSelectedGrade] = useState("Tất cả");

  const filteredExams = SAMPLE_EXAMS.filter((exam) => {
    const matchSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject =
      selectedSubject === "Tất cả" || exam.subject === selectedSubject;
    const matchGrade =
      selectedGrade === "Tất cả" || exam.grade.toString() === selectedGrade;
    return matchSearch && matchSubject && matchGrade;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Thư Viện Đề Thi Giáo Viên</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Sàn Trao Đổi
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Hơn 10,000+ đề thi chất lượng cao được chia sẻ và thẩm định bởi cộng đồng giáo viên trên cả nước.
          </p>
        </div>

        <Link
          href="/exams/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          Đăng Bán Đề Của Bạn
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên đề thi, tác giả, bài học..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tất cả">Tất cả môn</option>
            <option value="Toán">Toán</option>
            <option value="Tiếng Anh">Tiếng Anh</option>
            <option value="Vật lí">Vật lí</option>
            <option value="Hóa học">Hóa học</option>
            <option value="Ngữ văn">Ngữ văn</option>
            <option value="Lịch sử">Lịch sử</option>
          </select>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tất cả">Tất cả khối lớp</option>
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
            className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
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

              <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 leading-snug">
                {exam.title}
              </h3>

              <div className="flex flex-wrap gap-1 mb-3">
                {exam.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="text-xs text-gray-500 mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-700">{exam.author}</div>
                  <div className="text-[11px] text-gray-400">{exam.authorRole}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-700">{exam.questionCount} câu</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Có giải chi tiết</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-lg font-black text-blue-600">
                  {exam.priceCredits}
                </span>
                <span className="text-xs font-semibold text-gray-500 ml-1">Credits</span>
              </div>

              <button
                onClick={() =>
                  alert(`Đã nhận đề: "${exam.title}"! Bạn có thể tải về hoặc lưu vào kho đề của tôi.`)
                }
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Tải Đề Ngay
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
