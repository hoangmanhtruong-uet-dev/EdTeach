import { Question } from "@/lib/api/exams";
import { QuestionPreview } from "@/types/marketplace";

interface ConvertQuestionOptions {
  startX?: number;
  startY?: number;
  includeExplanation?: boolean;
  isDarkTheme?: boolean;
  subject?: string;
  grade?: number;
}

const DIFFICULTY_MAP: Record<string, string> = {
  easy: 'Nhận biết',
  medium: 'Thông hiểu',
  hard: 'Vận dụng',
  very_hard: 'Vận dụng cao',
};

/**
 * Tách văn bản thành nhiều dòng với chiều dài dòng tối đa (tránh tràn khung Excalidraw)
 */
function wrapText(text: string, maxCharsPerLine = 48): string[] {
  if (!text) return [];
  const words = text.replace(/\r\n/g, '\n').split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Chuyển đổi một câu hỏi sang nhóm đối tượng Excalidraw (Card Element)
 */
export function convertQuestionToExcalidrawCard(
  question: Question | QuestionPreview | any,
  options: ConvertQuestionOptions = {}
): Record<string, unknown>[] {
  const startX = options.startX ?? 120;
  const startY = options.startY ?? 100;
  const isDark = options.isDarkTheme ?? false;
  const includeExplanation = options.includeExplanation ?? false;
  const cardWidth = 640;

  const groupId = `card_grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const elements: Record<string, unknown>[] = [];

  // Theme colors
  const borderColor = isDark ? '#38bdf8' : '#2563eb';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#475569';
  const headerBg = isDark ? '#1e293b' : '#eff6ff';
  const headerText = isDark ? '#38bdf8' : '#1d4ed8';

  // 1. Phân tích nội dung câu hỏi
  const orderNum = question.order || 1;
  const diffLabel = DIFFICULTY_MAP[question.difficulty || 'medium'] || 'Thông hiểu';
  const subjectTag = options.subject ? `${options.subject} ${options.grade ? options.grade : ''}` : '';

  const wrappedQuestion = wrapText(question.content || 'Nội dung câu hỏi', 52);
  const questionTextHeight = wrappedQuestion.length * 26;

  // 2. Phân tích phương án trắc nghiệm hoặc tiểu mục
  let optionsTextHeight = 0;
  const optionLines: string[] = [];

  if (Array.isArray(question.options) && question.options.length > 0) {
    question.options.forEach((opt: string) => {
      const wrapped = wrapText(opt, 50);
      optionLines.push(...wrapped);
    });
    optionsTextHeight = optionLines.length * 24 + 10;
  } else if (Array.isArray(question.sub_questions) && question.sub_questions.length > 0) {
    question.sub_questions.forEach((sub: any) => {
      const subLabel = sub.sub_label || 'a';
      const wrapped = wrapText(`${subLabel}) ${sub.content}`, 50);
      optionLines.push(...wrapped);
    });
    optionsTextHeight = optionLines.length * 24 + 10;
  }

  // 3. Phân tích lời giải (nếu có)
  let explanationHeight = 0;
  const explanationLines: string[] = [];
  if (includeExplanation && (question.explanation || question.correct_answer)) {
    if (question.correct_answer) {
      explanationLines.push(`Đáp án chuẩn: ${question.correct_answer}`);
    }
    if (question.explanation) {
      explanationLines.push(...wrapText(`Hướng dẫn giải: ${question.explanation}`, 50));
    }
    explanationHeight = explanationLines.length * 24 + 40;
  }

  // Tổng chiều cao thẻ
  const totalCardHeight = Math.max(
    180,
    55 + questionTextHeight + 20 + optionsTextHeight + explanationHeight + 25
  );

  // ================= 1. KHUNG THẺ CHÍNH (Background Card) =================
  elements.push({
    id: `rect_bg_${groupId}`,
    type: 'rectangle',
    x: startX,
    y: startY,
    width: cardWidth,
    height: totalCardHeight,
    strokeColor: borderColor,
    backgroundColor: cardBg,
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    roundness: { type: 3 },
    groupIds: [groupId],
  });

  // ================= 2. THANH TIÊU ĐỀ THẺ (Header Banner) =================
  elements.push({
    id: `header_bg_${groupId}`,
    type: 'rectangle',
    x: startX,
    y: startY,
    width: cardWidth,
    height: 44,
    strokeColor: borderColor,
    backgroundColor: headerBg,
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    roundness: { type: 3 },
    groupIds: [groupId],
  });

  // Chữ trên tiêu đề (CÂU SỐ + ĐỘ KHÓ + MÔN)
  const headerTitle = `CÂU ${orderNum}  •  [${diffLabel.toUpperCase()}]${subjectTag ? '  •  ' + subjectTag.toUpperCase() : ''}`;
  elements.push({
    id: `header_txt_${groupId}`,
    type: 'text',
    x: startX + 16,
    y: startY + 12,
    text: headerTitle,
    fontSize: 16,
    fontFamily: 2,
    textAlign: 'left',
    verticalAlign: 'top',
    strokeColor: headerText,
    groupIds: [groupId],
  });

  // ================= 3. NỘI DUNG CÂU HỎI (Question Text) =================
  let currentY = startY + 56;

  elements.push({
    id: `q_content_${groupId}`,
    type: 'text',
    x: startX + 20,
    y: currentY,
    text: wrappedQuestion.join('\n'),
    fontSize: 18,
    fontFamily: 2,
    textAlign: 'left',
    verticalAlign: 'top',
    strokeColor: textColor,
    groupIds: [groupId],
  });

  currentY += questionTextHeight + 16;

  // ================= 4. CÁC PHƯƠNG ÁN (Options / Sub-questions) =================
  if (optionLines.length > 0) {
    // Đường gạch ngăn cách mảnh
    elements.push({
      id: `sep_line_${groupId}`,
      type: 'line',
      x: startX + 20,
      y: currentY - 6,
      width: cardWidth - 40,
      height: 0,
      points: [[0, 0], [cardWidth - 40, 0]],
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      strokeWidth: 1,
      strokeStyle: 'dashed',
      roughness: 0,
      groupIds: [groupId],
    });

    elements.push({
      id: `options_txt_${groupId}`,
      type: 'text',
      x: startX + 24,
      y: currentY + 6,
      text: optionLines.join('\n'),
      fontSize: 16,
      fontFamily: 2,
      textAlign: 'left',
      verticalAlign: 'top',
      strokeColor: subTextColor,
      groupIds: [groupId],
    });

    currentY += optionsTextHeight + 10;
  }

  // ================= 5. KHỐI LỜI GIẢI CHI TIẾT (Nếu có) =================
  if (explanationLines.length > 0) {
    const expBoxHeight = explanationHeight - 10;
    elements.push({
      id: `exp_bg_${groupId}`,
      type: 'rectangle',
      x: startX + 16,
      y: currentY + 4,
      width: cardWidth - 32,
      height: expBoxHeight,
      strokeColor: '#10b981',
      backgroundColor: isDark ? '#064e3b33' : '#ecfdf5',
      fillStyle: 'solid',
      strokeWidth: 1.5,
      strokeStyle: 'solid',
      roughness: 0,
      roundness: { type: 3 },
      groupIds: [groupId],
    });

    elements.push({
      id: `exp_txt_${groupId}`,
      type: 'text',
      x: startX + 28,
      y: currentY + 14,
      text: explanationLines.join('\n'),
      fontSize: 15,
      fontFamily: 2,
      textAlign: 'left',
      verticalAlign: 'top',
      strokeColor: isDark ? '#6ee7b7' : '#047857',
      groupIds: [groupId],
    });
  }

  return elements;
}
