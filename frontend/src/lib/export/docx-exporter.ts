import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import { ExamWithQuestions, Question } from "@/lib/api/exams";

function cleanMathSymbols(text: string): string {
  if (!text) return "";
  // Strip $ delimiters for Word export readability while preserving formula characters
  return text.replace(/\$\$/g, " ").replace(/\$/g, " ");
}

export async function exportExamToDocx(
  exam: ExamWithQuestions,
  includeAnswers = false,
  isPro = false
) {
  const children: (Paragraph | Table)[] = [];

  // 1. Header Information (Standard Vietnamese School Exam Header)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "TRƯỜNG THPT ............................",
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: (exam.name || "ĐỀ KIỂM TRA").toUpperCase(),
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Môn: ${exam.subject} - Lớp: ${exam.grade}`,
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Thời gian làm bài: ${(exam.config as any)?.duration_minutes || 45} phút`,
                    italics: true,
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(headerTable);

  // Student Info placeholder
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: "Họ và tên thí sinh: ................................................................ Số báo danh: ..................... Mã đề: 101",
          italics: true,
          size: 20,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: includeAnswers
            ? "--- ĐỀ THI KÈM HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT ---"
            : "--- ĐỀ THI CHÍNH THỨC ---",
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  // Sort questions by order_index
  const questions = [...(exam.questions || [])].sort(
    (a, b) => a.order_index - b.order_index
  );

  // 2. Render each question
  questions.forEach((q: Question, idx: number) => {
    const qNum = idx + 1;
    const content = cleanMathSymbols(q.content);

    // Question content
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: `Câu ${qNum} (${q.type.toUpperCase()}): `,
            bold: true,
            size: 22,
          }),
          new TextRun({
            text: content,
            size: 22,
          }),
        ],
      })
    );

    // Options for Multiple Choice
    if (q.type === "multiple_choice" && q.options && Array.isArray(q.options)) {
      q.options.forEach((opt: any) => {
        const optLabel = typeof opt === "string" ? opt : `${opt.key || ""}. ${opt.text || ""}`;
        children.push(
          new Paragraph({
            indent: { left: 400 },
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: cleanMathSymbols(optLabel),
                size: 21,
              }),
            ],
          })
        );
      });
    }

    // Options for True / False
    if (q.type === "true_false" && q.options && Array.isArray(q.options)) {
      q.options.forEach((opt: any, subIdx: number) => {
        const label = String.fromCharCode(97 + subIdx); // a, b, c, d
        const text = typeof opt === "string" ? opt : opt.text || "";
        children.push(
          new Paragraph({
            indent: { left: 400 },
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: `${label}) ${cleanMathSymbols(text)}`,
                size: 21,
              }),
            ],
          })
        );
      });
    }

    // If teacher answer view is included
    if (includeAnswers) {
      if (q.correct_answer) {
        children.push(
          new Paragraph({
            indent: { left: 200 },
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({
                text: `Đáp án đúng: ${cleanMathSymbols(String(q.correct_answer))}`,
                bold: true,
                color: "16A34A",
                size: 20,
              }),
            ],
          })
        );
      }
      if (q.explanation) {
        children.push(
          new Paragraph({
            indent: { left: 200 },
            spacing: { after: 150 },
            children: [
              new TextRun({
                text: "Lời giải chi tiết: ",
                bold: true,
                italics: true,
                color: "4B5563",
                size: 20,
              }),
              new TextRun({
                text: cleanMathSymbols(q.explanation),
                italics: true,
                color: "4B5563",
                size: 20,
              }),
            ],
          })
        );
      }
    }
  });

  // End of test marker
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: "---------- HẾT ----------",
          bold: true,
          size: 20,
        }),
      ],
    })
  );

  // Watermark footer for Free Tier (Lan tỏa thương hiệu tự nhiên)
  if (!isPro) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: "Đề thi được tạo tự động bởi EduTest AI - Nền tảng soạn đề thi thông minh cho giáo viên",
            italics: true,
            size: 16,
            color: "6B7280",
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `${(exam.name || "De_Thi").replace(/\s+/g, "_")}_${
    includeAnswers ? "Dap_An" : "De_Thi"
  }.docx`;
  saveAs(blob, fileName);
}