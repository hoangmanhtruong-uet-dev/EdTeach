"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Check,
  Share2,
  FolderOpen,
  Sparkles,
  RotateCcw,
  X,
  Undo2,
  Redo2,
  Printer,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Bold,
  Italic,
  Underline,
  Sigma,
  Highlighter,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft,
  List,
  Layers,
  Image as ImageIcon,
  Paperclip,
  ArrowUp,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Copy,
  Download,
  Shuffle,
  FileCheck2,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Save,
  Gift,
  Table as TableIcon,
  Link as LinkIcon,
  SplitSquareVertical,
  Minus as MinusIcon,
  AlertCircle,
  PenTool,
  Columns2,
  FileSignature,
  Scale,
  Heading1,
  FileCode,
  SlidersHorizontal,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { exportExamToDocx } from "@/lib/export/docx-exporter";
import { ExamWithQuestions, Question, createExam, updateExam, getExamById } from "@/lib/api/exams";
import { QuotaExhaustedModal } from "@/components/modals/quota-exhausted-modal";
import { SheetBoxSvg, HeaterCircuitSvg, RadiationHazardSvg } from "./svg-illustrations";

export interface DocItem {
  id: string;
  exam_id?: string;
  order_index?: number;
  type?: string;
  content: string;
  options?: any;
  correct_answer?: string | null;
  explanation?: string | null;
  difficulty?: string;
  created_at?: string;
  blockType?:
    | "question"
    | "svg"
    | "table"
    | "header_custom"
    | "section_title"
    | "passage"
    | "dotted_lines"
    | "callout"
    | "divider"
    | "page_break"
    | "image"
    | "bubble_sheet"
    | "true_false"
    | "short_answer"
    | "essay";
  svgType?: "sheet_box" | "heater" | "radiation";
  tableRows?: string[][];
  imageUrl?: string;
  sectionTitle?: string;
  passageContent?: string;
  headerType?: "two_col" | "centered" | "student_info" | "grading_guide";
  trueFalseItems?: { label: string; statement: string; isCorrect: boolean }[];
  shortAnswerPrompt?: string;
}

interface ExamStudioProps {
  initialExamId?: string;
}

export function ExamEditorStudio({ initialExamId }: ExamStudioProps) {
  const router = useRouter();
  const { user, profile, wallet } = useAuth();

  // Document states
  const [examId, setExamId] = useState<string | null>(initialExamId || null);
  const [title, setTitle] = useState("Đề thi mới");
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState("4");
  const [duration, setDuration] = useState("45");
  const [savedStatus, setSavedStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [shareToast, setShareToast] = useState(false);

  // Formatting & View options
  const [zoom, setZoom] = useState(100);
  const [fontFamily, setFontFamily] = useState("Times New Roman");
  const [fontSize, setFontSize] = useState(15);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [teacherMode, setTeacherMode] = useState(true); // true: shows answers & solutions

  // Layout panels
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);
  const [activeLeftTab, setActiveLeftTab] = useState<"toc" | "templates">("toc");

  // Questions & Document Content Blocks
  const [questions, setQuestions] = useState<DocItem[]>([]);
  const [activeSubmenu, setActiveSubmenu] = useState<
    "table" | "svg" | "header" | "question" | "content" | "layout" | null
  >(null);
  const [hoveredGridCell, setHoveredGridCell] = useState<{ row: number; col: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    content: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation: string;
  }>({
    content: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: "A",
    explanation: "",
  });

  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("Trung bình");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [showActiveMenu, setShowActiveMenu] = useState<string | null>(null);

  // Daily Quota & Viral Referral states
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [dailyQuota, setDailyQuota] = useState(3);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [userReferralCode, setUserReferralCode] = useState("EDUTEACH");

  // Load referral code
  useEffect(() => {
    async function loadReferralInfo() {
      try {
        const res = await fetch("/api/referral");
        if (res.ok) {
          const data = await res.json();
          if (data.referral_code) {
            setUserReferralCode(data.referral_code);
          }
        }
      } catch {
        // silent
      }
    }
    loadReferralInfo();
  }, []);

  // Load existing exam if initialExamId is present
  useEffect(() => {
    if (initialExamId) {
      const idToLoad = initialExamId;
      async function loadExam() {
        try {
          const data: any = await getExamById(idToLoad);
          if (data) {
            setTitle(data.name || "Đề thi mới");
            setSubject(data.subject || "Toán");
            setGrade(data.grade || "4");
            if (data.questions) {
              setQuestions(data.questions as Question[]);
            }
          }
        } catch (e) {
          console.error("Failed to load exam data", e);
        }
      }
      loadExam();
    }
  }, [initialExamId]);

  // Handle suggestion click from right AI sidebar
  const handleSelectSuggestion = (promptText: string) => {
    setAiPrompt(promptText);
    executeAiGenerate(promptText);
  };

  // Execute AI generation
  const executeAiGenerate = async (promptTextOverride?: string) => {
    const promptToUse = promptTextOverride || aiPrompt;
    if (!promptToUse.trim()) return;

    setIsGenerating(true);
    setAiStatusMessage("Trợ lý AI đang thiết lập cấu trúc và sinh câu hỏi...");
    setSavedStatus("saving");

    let detectedSubject = subject;
    let detectedGrade = grade;

    const lower = promptToUse.toLowerCase();
    if (/hóa|hoá|acid|base|chemistry/i.test(lower)) {
      detectedSubject = "Hóa học";
    } else if (/toán|toan|đại số|hình học|math/i.test(lower)) {
      detectedSubject = "Toán";
    } else if (/vật lý|vật lí|lý|lí|physics/i.test(lower)) {
      detectedSubject = "Vật lý";
    } else if (/sinh học|sinh|biology/i.test(lower)) {
      detectedSubject = "Sinh học";
    } else if (/tiếng anh|anh văn|english/i.test(lower)) {
      detectedSubject = "Tiếng Anh";
    } else if (/ngữ văn|văn|tiếng việt|literature/i.test(lower)) {
      detectedSubject = "Ngữ văn";
    } else if (/lịch sử|sử|history/i.test(lower)) {
      detectedSubject = "Lịch sử";
    } else if (/địa lý|địa lí|địa|geography/i.test(lower)) {
      detectedSubject = "Địa lý";
    } else if (/tin học|tin/i.test(lower)) {
      detectedSubject = "Tin học";
    }

    const gradeMatch = lower.match(/(?:lớp|khối)\s*(\d{1,2})/i);
    if (gradeMatch && gradeMatch[1]) {
      const gNum = parseInt(gradeMatch[1]);
      if (gNum >= 1 && gNum <= 12) {
        detectedGrade = gNum.toString();
      }
    }

    // Parse question count (e.g. 15 câu, 4 câu, 6 câu)
    let totalQuestions = 10;
    const countMatches = lower.match(/(\d+)\s*câu/g);
    if (countMatches) {
      let sum = 0;
      for (const m of countMatches) {
        const val = parseInt(m);
        if (!isNaN(val) && val > 0 && val <= 50) sum += val;
      }
      if (sum > 0) totalQuestions = Math.min(sum, 30);
    }

    setSubject(detectedSubject);
    setGrade(detectedGrade);

    try {
      // Auto title
      const newTitle = `Đề kiểm tra ${detectedSubject} Lớp ${detectedGrade} - ${promptToUse.length > 35 ? promptToUse.slice(0, 32) + "..." : promptToUse}`;
      setTitle(newTitle);

      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTitle,
          subject: detectedSubject,
          grade: detectedGrade,
          topic: promptToUse,
          question_type: "MCQ",
          num_questions: totalQuestions,
          difficulty: aiDifficulty === "Dễ" ? 1 : aiDifficulty === "Khó" ? 3 : 2,
          additional_context: promptToUse,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "QUOTA_EXHAUSTED" || res.status === 403) {
          setShowQuotaModal(true);
          setAiStatusMessage("Thầy cô đã dùng hết 3 lượt tạo đề miễn phí hôm nay.");
          return;
        }
        throw new Error(data.message || data.error || "Lỗi máy chủ sinh đề AI");
      }

      if (data.daily_quota !== undefined) {
        setDailyQuota(data.daily_quota);
        setDailyUsed(data.daily_quota_used);
      }

      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        const mappedQuestions: Question[] = data.questions.map((q: any, i: number) => ({
          id: `gen-${Date.now()}-${i}`,
          exam_id: data.exam_id || "temp",
          order_index: i + 1,
          type: q.type || "multiple_choice",
          difficulty: q.difficulty || "medium",
          content: q.content,
          options: q.options || { A: "A", B: "B", C: "C", D: "D" },
          correct_answer: q.correct_answer || "A",
          explanation: q.explanation || q.solution || "",
          points: 1,
        }));
        setQuestions(mappedQuestions);
      } else if (data.exam_id) {
        setExamId(data.exam_id);
        const fullExam: any = await getExamById(data.exam_id);
        if (fullExam && fullExam.questions && fullExam.questions.length > 0) {
          setQuestions(fullExam.questions as Question[]);
        }
      }

      setAiStatusMessage(`Đã tạo thành công đề thi ${detectedSubject} lớp ${detectedGrade}!`);
      setTimeout(() => setAiStatusMessage(null), 4000);
      setSavedStatus("saved");
      setAiPrompt("");
    } catch (err: any) {
      console.error("AI generation failed:", err);
      setSavedStatus("unsaved");
      setAiStatusMessage(`Lỗi sinh đề: ${err.message || "Vui lòng thử lại"}`);
      setTimeout(() => setAiStatusMessage(null), 6000);
    } finally {
      setIsGenerating(false);
    }
  };

  const createMockQuestions = (subj: string, grd: string) => {
    const mocks: Question[] = [
      {
        id: "mock-1",
        exam_id: examId || "temp",
        order_index: 1,
        type: "multiple_choice",
        difficulty: "easy",
        content: `Số chẵn lớn nhất có 4 chữ số khác nhau là:`,
        options: {
          A: "9876",
          B: "9998",
          C: "9874",
          D: "9786",
        },
        correct_answer: "A",
        explanation: "Các chữ số khác nhau từ lớn đến bé là 9, 8, 7, 6. Vì yêu cầu số chẵn nên chữ số tận cùng là 6. Vậy số đó là 9876.",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-2",
        exam_id: examId || "temp",
        order_index: 2,
        type: "multiple_choice",
        difficulty: "medium",
        content: `Giá trị của biểu thức $P = 4500 + 125 \\times 4$ là:`,
        options: {
          A: "5000",
          B: "4900",
          C: "5200",
          D: "4850",
        },
        correct_answer: "A",
        explanation: "Thực hiện phép nhân trước: $125 \\times 4 = 500$. Sau đó cộng: $4500 + 500 = 5000$.",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-3",
        exam_id: examId || "temp",
        order_index: 3,
        type: "multiple_choice",
        difficulty: "medium",
        content: `Một hình chữ nhật có chu vi $48\\text{ cm}$, chiều rộng là $8\\text{ cm}$. Diện tích của hình chữ nhật đó là:`,
        options: {
          A: "$128\\text{ cm}^2$",
          B: "$144\\text{ cm}^2$",
          C: "$160\\text{ cm}^2$",
          D: "$192\\text{ cm}^2$",
        },
        correct_answer: "A",
        explanation: "Nửa chu vi hình chữ nhật là: $48 : 2 = 24\\text{ cm}$. Chiều dài là: $24 - 8 = 16\\text{ cm}$. Diện tích là: $16 \\times 8 = 128\\text{ cm}^2$.",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-4",
        exam_id: examId || "temp",
        order_index: 4,
        type: "multiple_choice",
        difficulty: "hard",
        content: `Trung bình cộng của ba số là $45$. Nếu thêm số thứ tư là $65$ thì trung bình cộng của bốn số là:`,
        options: {
          A: "50",
          B: "48",
          C: "52",
          D: "55",
        },
        correct_answer: "A",
        explanation: "Tổng của ba số đầu là: $45 \\times 3 = 135$. Tổng của bốn số là: $135 + 65 = 200$. Trung bình cộng bốn số là: $200 : 4 = 50$.",
        created_at: new Date().toISOString(),
      },
    ];
    setQuestions(mocks);
  };

  // Add a blank question
  const handleAddQuestion = () => {
    const newQ: Question = {
      id: "q-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      difficulty: "medium",
      content: "Nhập nội dung câu hỏi mới tại đây...",
      options: {
        A: "Lựa chọn A",
        B: "Lựa chọn B",
        C: "Lựa chọn C",
        D: "Lựa chọn D",
      },
      correct_answer: "A",
      explanation: "Nhập lời giải chi tiết và hướng dẫn giải...",
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newQ]);
    handleStartEdit(newQ);
  };

  // Handlers for "Chèn" Menu Features (Screenshots 1-5)
  const handleInsertFormula = (type: "math" | "chem") => {
    const formula =
      type === "math"
        ? "$P = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"
        : "$\\text{2H}_2 + \\text{O}_2 \\xrightarrow{t^\\circ} \\text{2H}_2\\text{O}$";
    const newQ: DocItem = {
      id: "formula-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      difficulty: "medium",
      content: `Cho biểu thức sau: ${formula}. Hãy xác định tính đúng đắn của công thức khi áp dụng vào bài toán.`,
      options: {
        A: "Công thức hoàn toàn chính xác",
        B: "Thiếu điều kiện xác định",
        C: "Sai dấu ở mẫu số",
        D: "Không áp dụng được",
      },
      correct_answer: "A",
      explanation: `Áp dụng công thức ${formula} theo đúng quy tắc sách giáo khoa.`,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newQ]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertTable = (rows: number, cols: number) => {
    const tableData: string[][] = Array.from({ length: rows }).map((_, r) =>
      Array.from({ length: cols }).map((_, c) => `Ô (${r + 1}, ${c + 1})`)
    );
    const newBlock: DocItem = {
      id: "tbl-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: "Bảng dữ liệu khảo sát và thực nghiệm:",
      options: {},
      blockType: "table",
      tableRows: tableData,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertSvg = (svgType: "sheet_box" | "heater" | "radiation") => {
    const contentMap = {
      sheet_box:
        "Người ta muốn cắt 4 góc của tấm nhôm hình chữ nhật kích thước $8\\text{ dm} \\times 5\\text{ dm}$ các hình vuông bằng nhau cạnh $a$ rồi gấp lại thành chiếc hộp không nắp. Hãy tìm $a$ để thể tích hộp lớn nhất.",
      heater:
        "Cho sơ đồ mạch điện của máy sưởi gia đình như hình vẽ bên dưới. Biết điện áp nguồn là $U = 220\\text{ V}$, điện trở mayso $R = 48.4\\ \\Omega$. Tính công suất tỏa nhiệt của máy sưởi.",
      radiation:
        "Biển báo nào dưới đây cảnh báo khu vực có nguy hiểm về phóng xạ theo tiêu chuẩn an toàn quốc tế?",
    };
    const newBlock: DocItem = {
      id: "svg-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: contentMap[svgType],
      options:
        svgType === "sheet_box"
          ? {
              A: "$a = 1\\text{ dm}$",
              B: "$a = 1.5\\text{ dm}$",
              C: "$a = 2\\text{ dm}$",
              D: "$a = 0.8\\text{ dm}$",
            }
          : {
              A: "1000 W",
              B: "500 W",
              C: "2000 W",
              D: "800 W",
            },
      correct_answer: "A",
      explanation: "Lời giải chi tiết theo định luật vật lý/toán học.",
      blockType: "svg",
      svgType,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertHeader = (headerType: "two_col" | "centered" | "student_info" | "grading_guide") => {
    const newBlock: DocItem = {
      id: "hdr-" + Date.now(),
      exam_id: examId || "temp",
      order_index: 0,
      type: "multiple_choice",
      content: headerType,
      options: {},
      blockType: "header_custom",
      headerType,
      created_at: new Date().toISOString(),
    };
    setQuestions([newBlock, ...questions]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertQuestionType = (
    qType: "section_title" | "essay" | "mcq_auto" | "mcq_2col" | "true_false" | "short_answer" | "passage"
  ) => {
    let newBlock: DocItem;
    if (qType === "section_title") {
      newBlock = {
        id: "sec-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "",
        options: {},
        blockType: "section_title",
        sectionTitle: "PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "true_false") {
      newBlock = {
        id: "tf-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "true_false",
        content: "Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Xét tính đúng/sai của các mệnh đề sau:",
        options: {},
        blockType: "true_false",
        trueFalseItems: [
          { label: "a", statement: "Hàm số đồng biến trên khoảng $(0; 2)$.", isCorrect: false },
          { label: "b", statement: "Điểm cực tiểu của đồ thị hàm số là $(2; -2)$.", isCorrect: true },
          { label: "c", statement: "Giá trị lớn nhất của hàm số trên đoạn $[-1; 1]$ bằng 2.", isCorrect: true },
          { label: "d", statement: "Đồ thị hàm số cắt trục hoành tại 3 điểm phân biệt.", isCorrect: true },
        ],
        correct_answer: "a - S, b - Đ, c - Đ, d - Đ",
        explanation: "Khảo sát và vẽ bảng biến thiên của hàm số bậc 3 để kết luận.",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "short_answer") {
      newBlock = {
        id: "sa-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "short_answer",
        content:
          "Một người gửi tiết kiệm ngân hàng số tiền 100 triệu đồng với lãi suất $6\\%/\\text{năm}$. Sau 3 năm, số tiền lãi người đó nhận được (làm tròn đến hàng nghìn) là bao nhiêu triệu đồng?",
        options: {},
        blockType: "short_answer",
        correct_answer: "19.102",
        explanation: "Áp dụng công thức lãi kép: $T = 100 \\times (1 + 0.06)^3 - 100 = 19.102$ triệu đồng.",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "essay") {
      newBlock = {
        id: "ess-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "essay",
        content: "Giải phương trình lượng giác sau: $\\sin 2x + 2\\cos x = 0$ trên đoạn $[0; 2\\pi]$.",
        options: {},
        blockType: "essay",
        correct_answer: "$x = \\frac{\\pi}{2}, \\frac{3\\pi}{2}$",
        explanation: "Biến đổi $\\sin 2x = 2\\sin x \\cos x$, đặt nhân tử chung đưa về phương trình tích.",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "passage") {
      newBlock = {
        id: "pas-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "Đọc đoạn trích sau và trả lời câu hỏi bên dưới:",
        passageContent:
          '"Mỗi chúng ta đều là một cánh én nhỏ. Một cánh én không làm nên mùa xuân, nhưng nếu hàng triệu cánh én cùng vỗ cánh bay về phương nam mang theo niềm tin và nghị lực, mùa xuân hy vọng sẽ tràn ngập khắp đất nước..."',
        options: {
          A: "Nghị lực và tinh thần đoàn kết",
          B: "Sự cô đơn lẻ loi",
          C: "Thời tiết mùa xuân",
          D: "Thiên nhiên tươi đẹp",
        },
        correct_answer: "A",
        blockType: "passage",
        created_at: new Date().toISOString(),
      };
    } else {
      newBlock = {
        id: "mcq-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "Nội dung câu trắc nghiệm mới:",
        options: {
          A: "Phương án A",
          B: "Phương án B",
          C: "Phương án C",
          D: "Phương án D",
        },
        correct_answer: "A",
        created_at: new Date().toISOString(),
      };
    }
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertContent = (contentType: "callout" | "dotted_lines" | "answer_sheet") => {
    let newBlock: DocItem;
    if (contentType === "callout") {
      newBlock = {
        id: "call-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "LƯU Ý: Thí sinh không được sử dụng máy tính có chức năng soạn thảo văn bản và thẻ nhớ trong phòng thi.",
        options: {},
        blockType: "callout",
        created_at: new Date().toISOString(),
      };
    } else if (contentType === "dotted_lines") {
      newBlock = {
        id: "dot-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "",
        options: {},
        blockType: "dotted_lines",
        created_at: new Date().toISOString(),
      };
    } else {
      newBlock = {
        id: "bubble-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "PHIẾU TRẢ LỜI TRẮC NGHIỆM",
        options: {},
        blockType: "bubble_sheet",
        created_at: new Date().toISOString(),
      };
    }
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertLayout = (layoutType: "divider" | "page_break") => {
    const newBlock: DocItem = {
      id: "lay-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: "",
      options: {},
      blockType: layoutType,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newBlock: DocItem = {
          id: "img-" + Date.now(),
          exam_id: examId || "temp",
          order_index: questions.length + 1,
          type: "multiple_choice",
          content: "Hình minh họa bài tập:",
          options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" },
          correct_answer: "A",
          blockType: "image",
          imageUrl: url,
          created_at: new Date().toISOString(),
        };
        setQuestions([...questions, newBlock]);
      };
      reader.readAsDataURL(file);
    }
    setShowActiveMenu(null);
  };

  const handleStartEdit = (q: DocItem) => {
    setEditingQuestionId(q.id);
    const opts = (typeof q.options === "object" && q.options !== null ? q.options : { A: "", B: "", C: "", D: "" }) as Record<string, string>;
    setEditForm({
      content: q.content,
      options: opts,
      correct_answer: q.correct_answer || "A",
      explanation: q.explanation || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingQuestionId) return;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === editingQuestionId
          ? {
              ...q,
              content: editForm.content,
              options: editForm.options,
              correct_answer: editForm.correct_answer,
              explanation: editForm.explanation,
            }
          : q
      )
    );
    setEditingQuestionId(null);
    setSavedStatus("saved");
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setSavedStatus("saved");
  };

  const handleDuplicateQuestion = (q: DocItem) => {
    const dup: DocItem = {
      ...q,
      id: "dup-" + Date.now(),
      order_index: questions.length + 1,
    };
    setQuestions([...questions, dup]);
  };

  const handleShuffleQuestions = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  };

  // Export to docx
  const handleExportDocx = async () => {
    const examData: ExamWithQuestions = {
      id: examId || "temp",
      user_id: user?.id || "temp",
      name: title,
      subject,
      grade,
      chapter: "",
      config: {},
      status: "completed",
      credit_cost: 0,
      question_count: questions.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: questions as any,
    };
    const isPro = (profile as any)?.tier === "pro" || (profile as any)?.tier === "school";
    await exportExamToDocx(examData, teacherMode, isPro);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  const scrollToQuestion = (idx: number) => {
    const el = document.getElementById(`question-anchor-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "transition-all");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1500);
    }
  };

  const userInitial = profile?.name ? profile.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : "T";
  const userDisplayName = profile?.name || user?.email?.split("@")[0] || "Trường Hoà...";
  const userCredits = wallet?.balance !== undefined ? wallet.balance : 7095;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-slate-800 font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER (GOOGLE DOCS STYLE)                              */}
      {/* ============================================================== */}
      <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4">
        {/* Left: Document Icon & Title & File Menus */}
        <div className="flex items-center gap-3">
          <Link
            href="/exams"
            title="Quay lại danh sách đề thi"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm hover:bg-slate-800"
          >
            <FileText className="h-5 w-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSavedStatus("unsaved");
                }}
                onBlur={() => setSavedStatus("saved")}
                className="max-w-[260px] truncate rounded px-1.5 py-0.5 text-base font-semibold text-slate-800 hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary md:max-w-md"
              />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {savedStatus === "saved" && (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="hidden sm:inline">Đã lưu vào tài khoản</span>
                  </>
                )}
                {savedStatus === "saving" && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Đang lưu...</span>
                  </>
                )}
                {savedStatus === "unsaved" && (
                  <span className="text-amber-600">Chưa lưu</span>
                )}
              </span>
            </div>

            {/* Menu options: Tệp, Chỉnh sửa, Xem, Chèn, Định dạng, Công cụ */}
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <div className="relative">
                <button
                  onClick={() => setShowActiveMenu(showActiveMenu === "file" ? null : "file")}
                  className="rounded px-2 py-0.5 hover:bg-slate-100"
                >
                  Tệp
                </button>
                {showActiveMenu === "file" && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                      onClick={() => {
                        setTitle("Đề thi mới");
                        setQuestions([]);
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tạo đề mới
                    </button>
                    <button
                      onClick={() => {
                        handleExportDocx();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" /> Tải về file Word (.docx)
                    </button>
                    <button
                      onClick={() => {
                        handlePrint();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                    >
                      <Printer className="h-3.5 w-3.5" /> In đề thi (PDF)
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowActiveMenu(showActiveMenu === "insert" ? null : "insert")}
                  className={`rounded px-2 py-0.5 transition ${showActiveMenu === "insert" ? "bg-slate-200 font-medium" : "hover:bg-slate-100"}`}
                >
                  Chèn
                </button>
                {showActiveMenu === "insert" && (
                  <div
                    onMouseLeave={() => setActiveSubmenu(null)}
                    className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-slate-700 text-xs select-none"
                  >
                    {/* 1. Công thức toán */}
                    <button
                      onMouseEnter={() => setActiveSubmenu(null)}
                      onClick={() => handleInsertFormula("math")}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <span className="font-serif font-bold text-slate-700">∑</span>
                      <span>Công thức toán</span>
                    </button>

                    {/* 2. Công thức hoá học */}
                    <button
                      onMouseEnter={() => setActiveSubmenu(null)}
                      onClick={() => handleInsertFormula("chem")}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <span className="font-serif font-bold text-slate-700">∑</span>
                      <span>Công thức hoá học</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* 3. Bảng > (Submenu with 8x8 Grid) */}
                    <div
                      className="relative"
                      onMouseEnter={() => setActiveSubmenu("table")}
                    >
                      <div className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "table" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-2.5">
                          <TableIcon className="h-3.5 w-3.5 text-slate-600" />
                          <span>Bảng</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "table" && (
                        <div className="absolute left-full top-0 ml-1 z-50 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                          <div className="grid grid-cols-8 gap-1">
                            {Array.from({ length: 8 }).map((_, rIdx) =>
                              Array.from({ length: 8 }).map((_, cIdx) => {
                                const r = rIdx + 1;
                                const c = cIdx + 1;
                                const isHighlighted =
                                  hoveredGridCell !== null &&
                                  r <= hoveredGridCell.row &&
                                  c <= hoveredGridCell.col;
                                return (
                                  <div
                                    key={`${r}-${c}`}
                                    onMouseEnter={() => setHoveredGridCell({ row: r, col: c })}
                                    onClick={() => handleInsertTable(r, c)}
                                    className={`h-4 w-4 cursor-pointer rounded-[2px] border transition-colors ${
                                      isHighlighted
                                        ? "border-blue-500 bg-blue-100"
                                        : "border-slate-300 bg-white hover:border-blue-400"
                                    }`}
                                  />
                                );
                              })
                            )}
                          </div>
                          <div className="mt-2 text-center text-xs font-medium text-slate-600">
                            {hoveredGridCell ? `${hoveredGridCell.row} × ${hoveredGridCell.col}` : "1 × 1"}
                          </div>
                          <div className="mt-1 border-t border-slate-100 pt-1">
                            <button
                              onClick={() => {
                                const rows = prompt("Nhập số hàng:", "3");
                                const cols = prompt("Nhập số cột:", "4");
                                if (rows && cols) {
                                  handleInsertTable(parseInt(rows) || 3, parseInt(cols) || 4);
                                }
                              }}
                              className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <SlidersHorizontal className="h-3 w-3 text-slate-500" />
                              <span>Tùy chọn khác</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Hình */}
                    <button
                      onMouseEnter={() => setActiveSubmenu(null)}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-slate-600" />
                      <span>Hình</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* 5. Hình minh hoạ SVG > */}
                    <div
                      className="relative"
                      onMouseEnter={() => setActiveSubmenu("svg")}
                    >
                      <div className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "svg" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-2.5">
                          <LayoutGrid className="h-3.5 w-3.5 text-slate-600" />
                          <span>Hình minh hoạ SVG</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "svg" && (
                        <div className="absolute left-full top-0 ml-1 z-50 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                          <button
                            onClick={() => handleInsertSvg("sheet_box")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Tấm nhôm và hộp không nắp</span>
                          </button>
                          <button
                            onClick={() => handleInsertSvg("heater")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Sơ đồ máy sưởi</span>
                          </button>
                          <button
                            onClick={() => handleInsertSvg("radiation")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Biển cảnh báo phóng xạ</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 6. Đầu đề > */}
                    <div
                      className="relative"
                      onMouseEnter={() => setActiveSubmenu("header")}
                    >
                      <div className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "header" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-2.5">
                          <Columns2 className="h-3.5 w-3.5 text-slate-600" />
                          <span>Đầu đề</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "header" && (
                        <div className="absolute left-full top-0 ml-1 z-50 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                          <button
                            onClick={() => handleInsertHeader("two_col")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Columns2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Đầu đề hai cột</span>
                          </button>
                          <button
                            onClick={() => handleInsertHeader("centered")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Heading1 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Tên đề căn giữa</span>
                          </button>
                          <button
                            onClick={() => handleInsertHeader("student_info")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileSignature className="h-3.5 w-3.5 text-slate-500" />
                            <span>Thông tin thí sinh</span>
                          </button>
                          <button
                            onClick={() => handleInsertHeader("grading_guide")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileCheck2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Đầu hướng dẫn chấm</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 7. Câu hỏi > */}
                    <div
                      className="relative"
                      onMouseEnter={() => setActiveSubmenu("question")}
                    >
                      <div className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "question" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-3.5 w-3.5 text-slate-600" />
                          <span>Câu hỏi</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "question" && (
                        <div className="absolute left-full top-0 ml-1 z-50 w-72 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                          <button
                            onClick={() => handleInsertQuestionType("section_title")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <span className="font-serif font-bold text-slate-700 px-1">T</span>
                            <span>Tiêu đề phần</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("essay")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu tự luận</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("mcq_auto")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu trắc nghiệm (tự động xếp đáp án)</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("mcq_2col")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu trắc nghiệm (2 phương án 1 hàng)</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("true_false")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Scale className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu đúng / sai</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("short_answer")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu trả lời ngắn</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("passage")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                            <span>Ngữ liệu / đoạn trích</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 8. Nội dung > */}
                    <div
                      className="relative"
                      onMouseEnter={() => setActiveSubmenu("content")}
                    >
                      <div className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "content" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-2.5">
                          <FileCode className="h-3.5 w-3.5 text-slate-600" />
                          <span>Nội dung</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "content" && (
                        <div className="absolute left-full top-0 ml-1 z-50 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                          <button
                            onClick={() => handleInsertContent("callout")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            <span>Khung chú ý / Ghi chú</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("dotted_lines")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <PenTool className="h-3.5 w-3.5 text-slate-500" />
                            <span>Dòng kẻ chấm (viết tự luận) ........</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("answer_sheet")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Phiếu trả lời trắc nghiệm</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 9. Bố cục > */}
                    <div
                      className="relative"
                      onMouseEnter={() => setActiveSubmenu("layout")}
                    >
                      <div className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "layout" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}>
                        <div className="flex items-center gap-2.5">
                          <Columns2 className="h-3.5 w-3.5 text-slate-600" />
                          <span>Bố cục</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "layout" && (
                        <div className="absolute left-full top-0 ml-1 z-50 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                          <button
                            onClick={() => handleInsertLayout("divider")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Columns2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Chia 2 cột song song</span>
                          </button>
                          <button
                            onClick={() => handleInsertLayout("divider")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <MinusIcon className="h-3.5 w-3.5 text-slate-500" />
                            <span>Đường kẻ ngang</span>
                          </button>
                          <button
                            onClick={() => handleInsertLayout("page_break")}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <SplitSquareVertical className="h-3.5 w-3.5 text-slate-500" />
                              <span>Ngắt trang</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Ctrl+↵</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    {/* 10. Liên kết */}
                    <button
                      onMouseEnter={() => setActiveSubmenu(null)}
                      onClick={() => {
                        const url = prompt("Nhập liên kết URL:");
                        if (url) {
                          const linkBlock: DocItem = {
                            id: "link-" + Date.now(),
                            content: `[Liên kết tham khảo: ${url}](${url})`,
                            type: "multiple_choice",
                            options: {},
                          };
                          setQuestions([...questions, linkBlock]);
                        }
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <LinkIcon className="h-3.5 w-3.5 text-slate-600" />
                      <span>Liên kết</span>
                    </button>

                    {/* 11. Ngắt trang */}
                    <button
                      onMouseEnter={() => setActiveSubmenu(null)}
                      onClick={() => handleInsertLayout("page_break")}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <SplitSquareVertical className="h-3.5 w-3.5 text-slate-600" />
                        <span>Ngắt trang</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+↵</span>
                    </button>

                    {/* 12. Đường kẻ ngang */}
                    <button
                      onMouseEnter={() => setActiveSubmenu(null)}
                      onClick={() => handleInsertLayout("divider")}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <MinusIcon className="h-3.5 w-3.5 text-slate-600" />
                      <span>Đường kẻ ngang</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setTeacherMode(!teacherMode)}
                className="rounded px-2 py-0.5 hover:bg-slate-100"
              >
                {teacherMode ? "Xem bản giáo viên" : "Xem bản học sinh"}
              </button>

              <button
                onClick={handleShuffleQuestions}
                className="rounded px-2 py-0.5 hover:bg-slate-100"
              >
                Trộn đề
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mời đồng nghiệp nhận +3 đề */}
          <button
            onClick={() => setShowQuotaModal(true)}
            className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100"
          >
            <Gift className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden sm:inline">Mời đồng nghiệp (+3 đề)</span>
            <span className="sm:hidden">+3 đề</span>
          </button>

          {/* Chia sẻ */}
          <button
            onClick={handleShare}
            className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-500" />
            Chia sẻ
          </button>

          {/* Xem kho đề của tôi */}
          <Link
            href="/exams"
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline">Xem kho đề của tôi</span>
          </Link>

          {/* Hỏi AI Toggle Button */}
          <button
            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition shadow-sm ${
              aiSidebarOpen
                ? "bg-primary text-primary-foreground"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Hỏi AI
          </button>

          {/* User Badge: Avatar + Name + Daily Quota */}
          <div className="flex items-center gap-2 pl-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm">
              {userInitial}
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-semibold leading-tight text-slate-800">
                {userDisplayName}
              </p>
              <p className="text-[11px] font-medium text-emerald-600">
                🎯 {Math.max(0, dailyQuota - dailyUsed)}/{dailyQuota} đề free hôm nay
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Backdrop for open dropdown menus */}
      {showActiveMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowActiveMenu(null);
            setActiveSubmenu(null);
          }}
        />
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-16 right-6 z-50 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          ✓ Đã sao chép liên kết đề thi vào clipboard!
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. RICH TEXT FORMATTING TOOLBAR                                */}
      {/* ============================================================== */}
      <div className="flex h-11 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-3 backdrop-blur-sm sm:px-4">
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto text-slate-700">
          {/* Undo / Redo */}
          <button title="Hoàn tác (Ctrl+Z)" className="rounded p-1.5 hover:bg-slate-100">
            <Undo2 className="h-4 w-4" />
          </button>
          <button title="Làm lại (Ctrl+Y)" className="rounded p-1.5 hover:bg-slate-100">
            <Redo2 className="h-4 w-4" />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            title="In đề thi"
            className="rounded p-1.5 hover:bg-slate-100"
          >
            <Printer className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Zoom */}
          <div className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer">
            <span>{zoom}%</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Style */}
          <div className="hidden items-center gap-1 rounded px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer sm:flex">
            <span>Văn bản thường</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>

          {/* Font Family */}
          <div className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-slate-100 cursor-pointer">
            <span>{fontFamily}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </div>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Font Size */}
          <div className="flex items-center rounded border border-slate-200 bg-slate-50">
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="px-1.5 py-0.5 text-xs hover:bg-slate-200"
            >
              -
            </button>
            <span className="w-6 text-center text-xs font-medium">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              className="px-1.5 py-0.5 text-xs hover:bg-slate-200"
            >
              +
            </button>
          </div>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Formatting: Bold, Italic, Underline */}
          <button
            onClick={() => setIsBold(!isBold)}
            className={`rounded p-1.5 font-bold hover:bg-slate-100 ${isBold ? "bg-slate-200 text-slate-900" : ""}`}
            title="In đậm"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`rounded p-1.5 italic hover:bg-slate-100 ${isItalic ? "bg-slate-200 text-slate-900" : ""}`}
            title="In nghiêng"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsUnderline(!isUnderline)}
            className={`rounded p-1.5 underline hover:bg-slate-100 ${isUnderline ? "bg-slate-200 text-slate-900" : ""}`}
            title="Gạch chân"
          >
            <Underline className="h-4 w-4" />
          </button>

          {/* Math Equation */}
          <button
            onClick={() => {
              setAiPrompt("Chèn công thức toán vào câu hỏi");
            }}
            title="Công thức toán LaTeX"
            className="flex items-center rounded p-1.5 hover:bg-slate-100"
          >
            <Sigma className="h-4 w-4 text-primary" />
          </button>

          {/* Text Color / Highlight */}
          <div className="flex items-center rounded p-1 hover:bg-slate-100 cursor-pointer" title="Màu chữ">
            <span className="text-xs font-bold text-slate-900 border-b-2 border-slate-900 px-0.5">A</span>
          </div>
          <button title="Bút dạ quang" className="rounded p-1.5 hover:bg-slate-100">
            <Highlighter className="h-4 w-4 text-amber-500" />
          </button>

          {/* Mode preview toggle */}
          <button
            onClick={() => setTeacherMode(!teacherMode)}
            className="ml-2 flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            title="Bật/Tắt hiển thị đáp án và lời giải"
          >
            {teacherMode ? <Eye className="h-3.5 w-3.5 text-blue-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
            <span className="hidden md:inline">{teacherMode ? "Hiện đáp án" : "Ẩn đáp án"}</span>
          </button>
        </div>

        {/* Word count & Total questions */}
        <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
          <span>{questions.length} câu hỏi</span>
          <span>•</span>
          <span>Thang điểm: 10</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. DOCUMENT RULER BAR (THƯỚC ĐO CĂN LỀ A4)                     */}
      {/* ============================================================== */}
      <div className="relative flex h-5 w-full shrink-0 items-center justify-center border-b border-slate-200 bg-slate-50 select-none">
        <div className="flex w-[820px] items-center justify-between px-8 text-[9px] text-slate-400">
          <div className="h-2 w-2 border-t-4 border-l-2 border-r-2 border-blue-600 border-l-transparent border-r-transparent" />
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((num) => (
            <span key={num} className="font-mono">
              {num}
            </span>
          ))}
          <div className="h-2 w-2 border-t-4 border-l-2 border-r-2 border-blue-600 border-l-transparent border-r-transparent" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. THREE-COLUMN MAIN WORKSPACE                                 */}
      {/* ============================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ============================================================ */}
        {/* LEFT COLUMN: TÀI LIỆU (MỤC LỤC & MẪU ĐỀ THI)                */}
        {/* ============================================================ */}
        {leftSidebarOpen ? (
          <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
              <span className="text-sm font-semibold text-slate-700">Tài liệu</span>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                title="Thu gọn thanh tài liệu"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs: Mục lục | Mẫu đề thi */}
            <div className="p-3">
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setActiveLeftTab("toc")}
                  className={`flex-1 rounded-md py-1.5 transition ${
                    activeLeftTab === "toc"
                      ? "bg-white font-semibold text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Mục lục
                </button>
                <button
                  onClick={() => setActiveLeftTab("templates")}
                  className={`flex-1 rounded-md py-1.5 transition ${
                    activeLeftTab === "templates"
                      ? "bg-white font-semibold text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Mẫu đề thi
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {activeLeftTab === "toc" ? (
                questions.length === 0 ? (
                  <div className="mt-8 flex flex-col items-center justify-center text-center text-slate-400">
                    <List className="mb-3 h-8 w-8 stroke-[1.5] text-slate-300" />
                    <p className="px-4 text-xs leading-relaxed">
                      Tiêu đề và các câu hỏi sẽ hiện ở đây để bạn di chuyển nhanh trong đề.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      CÁC CÂU HỎI ({questions.length})
                    </p>
                    {questions.map((q, idx) => {
                      let label = `Câu ${idx + 1}:`;
                      let preview = q.content ? q.content.replace(/\$[^$]*\$/g, "[công thức]") : "";
                      if (q.blockType === "section_title") {
                        label = "§ Phần:";
                        preview = q.sectionTitle || "Tiêu đề phần";
                      } else if (q.blockType === "header_custom") {
                        label = "Đầu đề:";
                        preview = q.headerType === "two_col" ? "Đầu đề hai cột" : q.headerType === "centered" ? "Tên đề căn giữa" : "Thông tin đề";
                      } else if (q.blockType === "svg") {
                        label = "📐 Hình:";
                        preview = q.svgType === "sheet_box" ? "Tấm nhôm và hộp" : q.svgType === "heater" ? "Sơ đồ máy sưởi" : "Biển phóng xạ";
                      } else if (q.blockType === "table") {
                        label = "▦ Bảng:";
                        preview = "Bảng dữ liệu";
                      } else if (q.blockType === "callout") {
                        label = "💡 Lưu ý:";
                        preview = q.content;
                      } else if (q.blockType === "divider") {
                        label = "―";
                        preview = "Đường kẻ ngang";
                      } else if (q.blockType === "page_break") {
                        label = "📄";
                        preview = "Ngắt trang";
                      }
                      return (
                        <button
                          key={q.id}
                          onClick={() => scrollToQuestion(idx)}
                          className="group flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-slate-100"
                        >
                          <span className="font-semibold text-blue-600 shrink-0">{label}</span>
                          <span className="truncate text-slate-600 group-hover:text-slate-900">
                            {preview}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      onClick={handleAddQuestion}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm câu hỏi
                    </button>
                  </div>
                )
              ) : (
                /* Templates Tab */
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    CẤU TRÚC MA TRẬN CHUẨN
                  </p>
                  <div
                    onClick={() => {
                      executeAiGenerate("Soạn đề giữa kì I Toán 4 gồm trắc nghiệm và tự luận thang điểm 10");
                    }}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 transition hover:border-primary hover:bg-blue-50/30"
                  >
                    <p className="text-xs font-semibold text-slate-800">Đề giữa kì I Toán 4</p>
                    <p className="mt-1 text-[11px] text-slate-500">Trắc nghiệm + Đúng/Sai + Tự luận</p>
                  </div>

                  <div
                    onClick={() => {
                      executeAiGenerate("Soạn đề kiểm tra 15 phút Toán khối 10 chương Mệnh đề và Tập hợp");
                    }}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 transition hover:border-primary hover:bg-blue-50/30"
                  >
                    <p className="text-xs font-semibold text-slate-800">Kiểm tra 15 phút Toán 10</p>
                    <p className="mt-1 text-[11px] text-slate-500">10 câu trắc nghiệm nhanh</p>
                  </div>

                  <div
                    onClick={() => {
                      executeAiGenerate("Soạn đề thi học kì I môn Toán khối 12 chuẩn ma trận 2025");
                    }}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 transition hover:border-primary hover:bg-blue-50/30"
                  >
                    <p className="text-xs font-semibold text-slate-800">Đề thi học kì I chuẩn 2025</p>
                    <p className="mt-1 text-[11px] text-slate-500">Đầy đủ 3 phần format mới Bộ GD</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        ) : (
          <button
            onClick={() => setLeftSidebarOpen(true)}
            title="Mở thanh tài liệu"
            className="flex h-10 w-9 items-center justify-center border-r border-b border-slate-200 bg-white text-slate-500 hover:text-slate-800"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {/* ============================================================ */}
        {/* CENTER COLUMN: A4 DOCUMENT CANVAS                            */}
        {/* ============================================================ */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
          <div
            style={{
              fontFamily: fontFamily === "Times New Roman" ? "'Times New Roman', Times, serif" : fontFamily,
              fontSize: `${fontSize}px`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
            className="w-[820px] min-h-[1160px] shrink-0 rounded-sm border border-slate-200/80 bg-white p-12 shadow-[0_4px_24px_rgba(0,0,0,0.06)] print:shadow-none print:border-none print:m-0 print:p-8"
          >
            {/* Standard Vietnamese School Exam Header */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-300 text-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-900">
                  SỞ GIÁO DỤC VÀ ĐÀO TẠO
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  TRƯỜNG ....................................................
                </p>
                <p className="text-[11px] text-slate-500 italic mt-0.5">Mã đề thi: 101</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-900">
                  ĐỀ KIỂM TRA ĐÁNH GIÁ GIỮA KỲ I
                </p>
                <p className="text-xs font-bold text-slate-800">
                  Môn: {subject} - Khối {grade}
                </p>
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  Thời gian làm bài: {duration} phút (không kể thời gian phát đề)
                </p>
              </div>
            </div>

            {/* Student info line */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-600 italic">
              <span>Họ và tên học sinh: .....................................................................</span>
              <span>Lớp: ................. SBD: .........</span>
            </div>

            {/* Questions Container */}
            <div className="mt-8 space-y-6">
              {questions.length === 0 ? (
                /* Blank state: Prompt to write or use AI */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-base text-slate-400 italic">Bắt đầu soạn đề...</p>
                  <p className="mt-2 text-xs text-slate-400 max-w-sm">
                    Gợi ý: Nhập câu hỏi thủ công hoặc sử dụng <strong>Trợ lý AI</strong> ở khung bên phải để tự động tạo toàn bộ đề thi chuẩn ma trận trong tích tắc.
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={handleAddQuestion}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4 text-slate-500" /> Thêm câu hỏi thủ công
                    </button>
                    <button
                      onClick={() => executeAiGenerate("Soạn đề giữa kì I Toán 4 gồm trắc nghiệm, đúng-sai và tự luận, thang điểm 10 kèm đáp án chi tiết")}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      <Sparkles className="h-4 w-4" /> AI tạo đề mẫu ngay
                    </button>
                  </div>
                </div>
              ) : (
                /* Render questions list */
                questions.map((q, idx) => {
                  const opts = (typeof q.options === "object" && q.options !== null ? q.options : {}) as Record<string, string>;
                  const isEditingThis = editingQuestionId === q.id;

                  // 1. Custom Header
                  if (q.blockType === "header_custom") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative mb-4 rounded-lg border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa đầu đề" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {q.headerType === "two_col" && (
                          <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-800 pb-3 text-center">
                            <div className="text-xs font-semibold uppercase leading-relaxed text-slate-800">
                              <p>SỞ GIÁO DỤC VÀ ĐÀO TẠO ...</p>
                              <p className="font-bold">TRƯỜNG THPT CHUYÊN ...</p>
                              <p className="font-normal text-[11px] text-slate-600">ĐỀ THI KHẢO SÁT CHẤT LƯỢNG</p>
                            </div>
                            <div className="text-xs font-semibold uppercase leading-relaxed text-slate-800">
                              <p className="font-bold">KỲ THI TỐT NGHIỆP THPT NĂM 2025</p>
                              <p className="text-primary font-bold">MÔN THI: {subject.toUpperCase()}</p>
                              <p className="font-normal text-[11px] text-slate-600">Thời gian làm bài: 90 phút (không kể phát đề)</p>
                            </div>
                          </div>
                        )}
                        {q.headerType === "centered" && (
                          <div className="text-center border-b-2 border-slate-800 pb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">BỘ GIÁO DỤC VÀ ĐÀO TẠO</p>
                            <h2 className="text-sm sm:text-base font-extrabold uppercase mt-1 text-slate-900">
                              ĐỀ THI THAM KHẢO KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2025
                            </h2>
                            <p className="text-xs font-semibold text-slate-700 mt-1">
                              Môn: {subject} - Lớp {grade} | Thời gian làm bài: 90 phút
                            </p>
                          </div>
                        )}
                        {q.headerType === "student_info" && (
                          <div className="rounded border border-slate-300 p-2.5 text-xs text-slate-800 bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>Họ và tên thí sinh: ....................................................................................</div>
                              <div>Số báo danh: .....................</div>
                              <div>Mã đề: <span className="font-bold">101</span></div>
                            </div>
                          </div>
                        )}
                        {q.headerType === "grading_guide" && (
                          <div className="text-center border-b-2 border-slate-800 pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM CHI TIẾT</h3>
                            <p className="text-[11px] text-slate-500 italic mt-0.5">(Tài liệu lưu hành nội bộ - Bản dành cho giáo viên)</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 2. Section Title
                  if (q.blockType === "section_title") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa phần" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="rounded-md bg-slate-100/90 px-3.5 py-2 font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide border-l-4 border-slate-800">
                          {q.sectionTitle || q.content}
                        </div>
                      </div>
                    );
                  }

                  // 3. Divider
                  if (q.blockType === "divider") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-4">
                        <div className="absolute -top-3 right-1 hidden items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa đường kẻ" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <hr className="border-t-2 border-slate-300" />
                      </div>
                    );
                  }

                  // 4. Page Break
                  if (q.blockType === "page_break") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-6">
                        <div className="absolute top-0 right-1 hidden items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa ngắt trang" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="border-b-2 border-dashed border-slate-300 py-1.5 text-center text-[11px] text-slate-400 font-mono tracking-widest bg-slate-50/70 select-none">
                          --- NGẮT TRANG (TRANG MỚI) ---
                        </div>
                      </div>
                    );
                  }

                  // 5. Callout / Notice
                  if (q.blockType === "callout") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-2 right-2 hidden items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa ghi chú" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-900 font-medium flex items-start gap-2.5 shadow-sm">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">{q.content}</div>
                        </div>
                      </div>
                    );
                  }

                  // 6. Dotted Lines
                  if (q.blockType === "dotted_lines") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-0 right-1 hidden items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa dòng kẻ chấm" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-3.5 py-2 text-slate-400 font-mono tracking-[0.25em] text-xs select-none">
                          <div>...................................................................................................................................</div>
                          <div>...................................................................................................................................</div>
                          <div>...................................................................................................................................</div>
                        </div>
                      </div>
                    );
                  }

                  // 7. Bubble Sheet
                  if (q.blockType === "bubble_sheet") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-4 rounded-lg border border-slate-300 bg-white p-4">
                        <div className="absolute top-2 right-2 hidden items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa phiếu" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h4 className="text-center text-xs font-bold uppercase tracking-wider mb-3 text-slate-800">PHIẾU TRẢ LỜI TRẮC NGHIỆM</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-1.5 border border-slate-200 rounded p-1.5 justify-between">
                              <span className="font-semibold text-slate-700">{i + 1}</span>
                              <div className="flex gap-1">
                                {["A", "B", "C", "D"].map((c) => (
                                  <span key={c} className="h-5 w-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-600 hover:bg-slate-800 hover:text-white cursor-pointer select-none">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 8. Image
                  if (q.blockType === "image") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-4 flex flex-col items-center">
                        <div className="absolute top-2 right-2 hidden items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa hình" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {q.imageUrl && (
                          <img src={q.imageUrl} alt="Hình minh họa" className="max-h-80 max-w-full rounded border border-slate-200 shadow-sm" />
                        )}
                      </div>
                    );
                  }

                  // 9. Table
                  if (q.blockType === "table") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa bảng" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {q.content && <p className="text-xs font-semibold text-slate-800 mb-2">{q.content}</p>}
                        <div className="overflow-x-auto rounded border border-slate-300">
                          <table className="w-full text-xs border-collapse">
                            <tbody>
                              {(q.tableRows || [["Ô 1", "Ô 2"], ["Ô 3", "Ô 4"]]).map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx === 0 ? "bg-slate-100 font-semibold" : ""}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="border border-slate-300 p-2 text-center text-slate-700">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  // 10. Passage
                  if (q.blockType === "passage") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleStartEdit(q)} title="Sửa câu" className="rounded p-1 text-slate-500 hover:bg-slate-100"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        {q.passageContent && (
                          <div className="mb-3 rounded-r-md border-l-4 border-blue-500 bg-blue-50/40 p-3.5 text-xs text-slate-700 leading-relaxed italic">
                            <p className="font-bold not-italic text-blue-900 mb-1">Đoạn ngữ liệu:</p>
                            {q.passageContent}
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">Câu {idx + 1}.</span>
                          <div className="flex-1 leading-relaxed text-slate-800"><LatexRenderer content={q.content} /></div>
                        </div>
                        {Object.keys(opts).length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 pl-6 sm:grid-cols-4">
                            {["A", "B", "C", "D"].map((key) => {
                              if (!opts[key]) return null;
                              const isCorrect = q.correct_answer === key;
                              return (
                                <div key={key} className={`flex items-start gap-1.5 text-slate-800 ${teacherMode && isCorrect ? "font-semibold text-green-700 underline underline-offset-4" : ""}`}>
                                  <span className="font-bold">{key}.</span>
                                  <div><LatexRenderer content={opts[key]} /></div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 11. True / False (Format 2025)
                  if (q.blockType === "true_false") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleStartEdit(q)} title="Sửa câu" className="rounded p-1 text-slate-500 hover:bg-slate-100"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa câu" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">Câu {idx + 1}.</span>
                          <div className="flex-1 leading-relaxed text-slate-800"><LatexRenderer content={q.content} /></div>
                        </div>
                        <div className="mt-3 overflow-hidden rounded border border-slate-200">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-2 text-left font-semibold text-slate-700">Mệnh đề / Khẳng định</th>
                                <th className="p-2 w-16 text-center font-semibold text-slate-700">Đúng</th>
                                <th className="p-2 w-16 text-center font-semibold text-slate-700">Sai</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {(q.trueFalseItems || []).map((tf, tfIdx) => (
                                <tr key={tfIdx} className="hover:bg-slate-50/50">
                                  <td className="p-2 text-slate-800">
                                    <span className="font-bold">{tf.label})</span> <LatexRenderer content={tf.statement} />
                                  </td>
                                  <td className="p-2 text-center">
                                    {teacherMode && tf.isCorrect ? (
                                      <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Đ</span>
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border border-slate-300 mx-auto" />
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    {teacherMode && !tf.isCorrect ? (
                                      <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">S</span>
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border border-slate-300 mx-auto" />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {teacherMode && q.explanation && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Đáp án: {q.correct_answer}</span>
                            </div>
                            <div className="leading-relaxed"><LatexRenderer content={q.explanation} /></div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 12. Short Answer (Format 2025)
                  if (q.blockType === "short_answer") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleStartEdit(q)} title="Sửa câu" className="rounded p-1 text-slate-500 hover:bg-slate-100"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa câu" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">Câu {idx + 1}.</span>
                          <div className="flex-1 leading-relaxed text-slate-800"><LatexRenderer content={q.content} /></div>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs pl-6">
                          <span className="font-semibold text-slate-700">Đáp số:</span>
                          <div className="h-8 w-36 rounded border border-slate-300 bg-slate-50/50 flex items-center justify-center font-mono font-bold text-slate-800">
                            {teacherMode ? q.correct_answer : ""}
                          </div>
                        </div>
                        {teacherMode && q.explanation && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Lời giải chi tiết:</span>
                            </div>
                            <div className="leading-relaxed"><LatexRenderer content={q.explanation} /></div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 13. Essay
                  if (q.blockType === "essay") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleStartEdit(q)} title="Sửa câu" className="rounded p-1 text-slate-500 hover:bg-slate-100"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa câu" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">Câu {idx + 1}.</span>
                          <div className="flex-1 leading-relaxed text-slate-800 font-normal"><LatexRenderer content={q.content} /></div>
                        </div>
                        <div className="mt-3 space-y-3 py-2 text-slate-300 font-mono tracking-widest text-xs select-none">
                          <div>...................................................................................................................................</div>
                          <div>...................................................................................................................................</div>
                        </div>
                        {teacherMode && (q.explanation || q.correct_answer) && (
                          <div className="mt-3.5 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Hướng dẫn giải:</span>
                            </div>
                            <div className="leading-relaxed"><LatexRenderer content={q.explanation || q.correct_answer || ""} /></div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 14. SVG Illustration (Screenshot 2)
                  if (q.blockType === "svg") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa hình" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">Câu {idx + 1}.</span>
                          <div className="flex-1 leading-relaxed text-slate-800 font-normal"><LatexRenderer content={q.content} /></div>
                        </div>
                        {/* Centered SVG diagram */}
                        <div className="my-3 flex justify-center">
                          {q.svgType === "sheet_box" && <SheetBoxSvg onDelete={() => handleDeleteQuestion(q.id)} />}
                          {q.svgType === "heater" && <HeaterCircuitSvg onDelete={() => handleDeleteQuestion(q.id)} />}
                          {q.svgType === "radiation" && <RadiationHazardSvg onDelete={() => handleDeleteQuestion(q.id)} />}
                        </div>
                        {/* Options */}
                        {Object.keys(opts).length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 pl-6 sm:grid-cols-4">
                            {["A", "B", "C", "D"].map((key) => {
                              if (!opts[key]) return null;
                              const isCorrect = q.correct_answer === key;
                              return (
                                <div key={key} className={`flex items-start gap-1.5 text-slate-800 ${teacherMode && isCorrect ? "font-semibold text-green-700 underline underline-offset-4" : ""}`}>
                                  <span className="font-bold">{key}.</span>
                                  <div><LatexRenderer content={opts[key]} /></div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {teacherMode && q.explanation && (
                          <div className="mt-3.5 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Đáp án đúng: {q.correct_answer}</span>
                            </div>
                            <div className="leading-relaxed"><LatexRenderer content={q.explanation} /></div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 15. Standard MCQ (Default)
                  return (
                    <div
                      key={q.id}
                      id={`question-anchor-${idx}`}
                      className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50"
                    >
                      {/* Floating actions menu */}
                      <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                        <button
                          onClick={() => handleStartEdit(q)}
                          title="Chỉnh sửa câu hỏi"
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateQuestion(q)}
                          title="Nhân bản câu hỏi"
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Xóa câu hỏi"
                          className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Question Stem */}
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-900 shrink-0">
                          Câu {idx + 1}.
                        </span>
                        <div className="flex-1 leading-relaxed text-slate-800 font-normal">
                          <LatexRenderer content={q.content} />
                        </div>
                      </div>

                      {/* Options (A, B, C, D) */}
                      {Object.keys(opts).length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 pl-6 sm:grid-cols-4">
                          {["A", "B", "C", "D"].map((key) => {
                            if (!opts[key]) return null;
                            const isCorrect = q.correct_answer === key;

                            return (
                              <div
                                key={key}
                                className={`flex items-start gap-1.5 text-slate-800 ${
                                  teacherMode && isCorrect
                                    ? "font-semibold text-green-700 underline underline-offset-4"
                                    : ""
                                }`}
                              >
                                <span className="font-bold">{key}.</span>
                                <div>
                                  <LatexRenderer content={opts[key]} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Teacher mode: Explanation & Answer */}
                      {teacherMode && q.explanation && (
                        <div className="mt-3.5 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                          <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                            <span>Đáp án đúng: {q.correct_answer}</span>
                          </div>
                          <div className="leading-relaxed">
                            <LatexRenderer content={q.explanation} />
                          </div>
                        </div>
                      )}

                      {/* Inline Edit Form if this question is being edited */}
                      {isEditingThis && (
                        <div className="mt-3 rounded-lg border border-primary/40 bg-white p-4 shadow-md">
                          <p className="text-xs font-semibold text-slate-700 mb-2">Chỉnh sửa câu {idx + 1}:</p>
                          <textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                            className="w-full rounded border border-slate-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            rows={3}
                          />

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {["A", "B", "C", "D"].map((k) => (
                              <div key={k} className="flex items-center gap-1">
                                <span className="text-xs font-bold">{k}:</span>
                                <input
                                  type="text"
                                  value={editForm.options[k] || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      options: { ...editForm.options, [k]: e.target.value },
                                    })
                                  }
                                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 flex items-center gap-4">
                            <label className="text-xs font-medium text-slate-700">Đáp án đúng:</label>
                            <select
                              value={editForm.correct_answer}
                              onChange={(e) => setEditForm({ ...editForm, correct_answer: e.target.value })}
                              className="rounded border border-slate-200 px-2 py-1 text-xs"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </div>

                          <div className="mt-3">
                            <label className="text-xs font-medium text-slate-700 mb-1 block">Lời giải chi tiết:</label>
                            <textarea
                              value={editForm.explanation}
                              onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                              className="w-full rounded border border-slate-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              rows={2}
                            />
                          </div>

                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              onClick={() => setEditingQuestionId(null)}
                              className="rounded px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              Lưu thay đổi
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* End of paper footer */}
              {questions.length > 0 && (
                <div className="pt-8 text-center text-xs text-slate-500 font-semibold tracking-wider">
                  <p>---------- HẾT ----------</p>
                  <p className="mt-1 font-normal italic text-slate-400">
                    Cán bộ coi thi không giải thích gì thêm.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: TRỢ LÝ AI SOẠN ĐỀ (EXACT MATCHING SCREENSHOT)   */}
        {/* ============================================================ */}
        {aiSidebarOpen ? (
          <aside className="flex w-[390px] shrink-0 flex-col border-l border-slate-200 bg-white">
            {/* Header: Title + Trí nhớ badge + Actions */}
            <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">Trợ lý AI soạn đề</span>
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Trí nhớ
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setAiStatusMessage(null);
                    setAiPrompt("");
                  }}
                  title="Làm mới cuộc trò chuyện"
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setAiSidebarOpen(false)}
                  title="Đóng trợ lý AI"
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Headline with Typewriter / Cursor Look */}
              <div className="py-2 text-center">
                <h3 className="text-lg font-semibold leading-snug text-blue-600">
                  Giữa kì I rồi, soạn đề Toán 4 theo cấu trúc thầy cô hay dùng nhé?
                  <span className="inline-block animate-pulse font-normal text-slate-400">|</span>
                </h3>
              </div>

              {/* Status Message */}
              {aiStatusMessage && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 shadow-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>{aiStatusMessage}</span>
                </div>
              )}

              {/* Suggestions Cards (Exact matching user screenshot) */}
              <div className="space-y-2.5">
                {/* Card 1 */}
                <div
                  onClick={() =>
                    handleSelectSuggestion(
                      "Soạn đề giữa kì I Toán 4 gồm trắc nghiệm, đúng-sai và tự luận, thang điểm 10 kèm đáp án chi tiết"
                    )
                  }
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <p className="text-xs font-medium leading-relaxed text-slate-700 group-hover:text-blue-600">
                    Soạn đề giữa kì I Toán 4 gồm trắc nghiệm, đúng-sai và tự luận, thang điểm 10 kèm đáp án chi tiết
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-purple-700">
                    <Clock className="h-3 w-3" />
                    <span>Theo cách bạn hay ra đề</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div
                  onClick={() =>
                    handleSelectSuggestion(
                      "Ra 3 đề giữa kì I Toán 4 song song, mức 8+, 9+, 10 điểm, có câu vận dụng thực tế"
                    )
                  }
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <p className="text-xs font-medium leading-relaxed text-slate-700 group-hover:text-blue-600">
                    Ra 3 đề giữa kì I Toán 4 song song, mức 8+, 9+, 10 điểm, có câu vận dụng thực tế
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-purple-700">
                    <Clock className="h-3 w-3" />
                    <span>Theo cách bạn hay ra đề</span>
                  </div>
                </div>

                {/* Card 3 */}
                <div
                  onClick={() =>
                    handleSelectSuggestion(
                      "Soạn đề giữa kì I Toán 6: tập hợp, chia hết - ƯCLN - BCNN, kèm đáp án và thang điểm"
                    )
                  }
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <p className="text-xs font-medium leading-relaxed text-slate-700 group-hover:text-blue-600">
                    Soạn đề giữa kì I Toán 6: tập hợp, chia hết - ƯCLN - BCNN, kèm đáp án và thang điểm
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                    <Calendar className="h-3 w-3" />
                    <span>Đang mùa kiểm tra giữa kì I</span>
                  </div>
                </div>
              </div>

              {/* Source Knowledge Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    NGUỒN CHO TRỢ LÝ
                  </span>
                  <span className="text-[11px] text-slate-400">Chọn đề mẫu, ma trận từ kho tài liệu</span>
                </div>
                <button
                  onClick={() => setActiveLeftTab("templates")}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm từ kho
                </button>
              </div>
            </div>

            {/* Bottom Input Area (Exact match with screenshot) */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="rounded-2xl border border-slate-300 bg-white p-2.5 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      executeAiGenerate();
                    }
                  }}
                  placeholder="Nhập yêu cầu tạo, sửa, giải đề thi..."
                  rows={2}
                  className="w-full resize-none border-none p-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />

                <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                  {/* Left icons: Image, Attachment */}
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      title="Tải ảnh đề thi lên (OCR)"
                      className="rounded p-1 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Đính kèm file tài liệu"
                      className="rounded p-1 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Right: Difficulty & Send button */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <span>Mức:</span>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value)}
                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-700 focus:outline-none"
                      >
                        <option value="Dễ">Dễ</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Khó">Khó</option>
                        <option value="Vận dụng cao">Vận dụng cao</option>
                      </select>
                    </div>

                    <button
                      onClick={() => executeAiGenerate()}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow transition hover:bg-slate-800 disabled:opacity-40"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="mt-2 text-center text-[10px] text-slate-400">
                Trợ lý AI có thể mắc sai sót. Hãy kiểm tra kỹ nội dung nhé.
              </p>
            </div>
          </aside>
        ) : null}
      </div>

      {/* Quota Exhausted & Viral Referral Modal */}
      <QuotaExhaustedModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        referralCode={userReferralCode}
        dailyQuota={dailyQuota}
        dailyUsed={dailyUsed}
        userId={user?.id || "TEACHER"}
      />
    </div>
  );
}
