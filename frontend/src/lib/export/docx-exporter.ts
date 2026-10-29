import {
  Document,
  Paragraph,
  TextRun,
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
  isPro = false,
  fontFamily = "Times New Roman"
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

  let realQuestionCounter = 0;

  // 2. Render each block / question
  questions.forEach((q: any) => {
    const blockType = q.blockType || q.type;

    // A. Section Title (Tiêu đề 1)
    if (blockType === "section_title") {
      children.push(
        new Paragraph({
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: q.sectionTitle || q.content,
              bold: true,
              size: 24,
              color: "0F172A",
              font: fontFamily,
            }),
          ],
        })
      );
      return;
    }

    // B. Heading 2 (Tiêu đề 2)
    if (blockType === "heading_2") {
      children.push(
        new Paragraph({
          spacing: { before: 220, after: 100 },
          children: [
            new TextRun({
              text: q.content,
              bold: true,
              size: 22,
              color: "1E293B",
              font: fontFamily,
            }),
          ],
        })
      );
      return;
    }

    // C. Heading 3 (Tiêu đề 3)
    if (blockType === "heading_3") {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: q.content,
              bold: true,
              size: 20,
              color: "334155",
              font: fontFamily,
            }),
          ],
        })
      );
      return;
    }

    // D. Passage / Trích dẫn đọc hiểu
    if (blockType === "passage") {
      children.push(
        new Paragraph({
          indent: { left: 400, right: 400 },
          spacing: { before: 180, after: 180 },
          children: [
            new TextRun({
              text: q.passageContent || q.content,
              italics: true,
              size: 21,
              font: fontFamily,
            }),
          ],
        })
      );
      return;
    }

    // E. Callout / Hộp ghi chú
    if (blockType === "callout") {
      children.push(
        new Paragraph({
          indent: { left: 240, right: 240 },
          spacing: { before: 160, after: 160 },
          children: [
            new TextRun({
              text: `[LƯU Ý] ${q.content}`,
              bold: true,
              size: 20,
              color: "B45309",
              font: fontFamily,
            }),
          ],
        })
      );
      return;
    }

    // F. Divider
    if (blockType === "divider" || blockType === "page_break") {
      return;
    }

    // G. Actual Question
    realQuestionCounter += 1;
    const qNum = realQuestionCounter;
    const content = cleanMathSymbols(q.content);

    // Question content
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: `Câu ${qNum}: `,
            bold: true,
            size: 22,
            font: fontFamily,
          }),
          new TextRun({
            text: content,
            size: 22,
            font: fontFamily,
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
    styles: {
      default: {
        document: {
          run: {
            font: fontFamily,
          },
        },
      },
    },
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

export async function exportShuffledExamsToDocx(
  examName: string,
  subject: string,
  grade: string,
  durationMinutes: number,
  shuffledVariants: Array<{
    code: string;
    questions: any[];
  }>,
  matrixRows: Array<{
    questionNum: number;
    answers: Record<string, string>;
  }>,
  isPro = false
) {
  const sections: any[] = [];

  // 1. Tạo section riêng cho từng mã đề thi (tự động phân trang)
  for (const variant of shuffledVariants) {
    const children: (Paragraph | Table)[] = [];

    // Header bảng chuẩn Bộ GD&ĐT
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
                      text: (examName || "ĐỀ KIỂM TRA").toUpperCase(),
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `Môn: ${subject || "Toán"} - Lớp: ${grade || "12"}`,
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `Thời gian làm bài: ${durationMinutes || 45} phút`,
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

    // Dòng họ tên thí sinh + MÃ ĐỀ NỔI BẬT
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        children: [
          new TextRun({
            text: "Họ và tên thí sinh: ................................................................ SBD: ................. ",
            italics: true,
            size: 20,
          }),
          new TextRun({
            text: `MÃ ĐỀ: ${variant.code}`,
            bold: true,
            size: 22,
            color: "B91C1C",
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
            text: `--- ĐỀ THI CHÍNH THỨC (MÃ ĐỀ ${variant.code}) ---`,
            bold: true,
            size: 22,
          }),
        ],
      })
    );

    // Danh sách câu hỏi của mã đề
    variant.questions.forEach((q: any, idx: number) => {
      const qNum = idx + 1;
      const content = cleanMathSymbols(q.content || "");

      children.push(
        new Paragraph({
          spacing: { before: 180, after: 100 },
          children: [
            new TextRun({
              text: `Câu ${qNum}: `,
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

      // Options
      if (q.options && Array.isArray(q.options)) {
        q.options.forEach((opt: any) => {
          const optLabel = typeof opt === "string" ? opt : `${opt.key || ""}. ${opt.text || ""}`;
          children.push(
            new Paragraph({
              indent: { left: 400 },
              spacing: { after: 60 },
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
    });

    // Kết thúc đề
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 200 },
        children: [
          new TextRun({
            text: `---------- HẾT MÃ ĐỀ ${variant.code} ----------`,
            bold: true,
            size: 20,
          }),
        ],
      })
    );

    sections.push({
      properties: {},
      children,
    });
  }

  // 2. Section cuối cùng: BẢNG MA TRẬN ĐỐI CHIẾU ĐÁP ÁN TỔNG HỢP
  const matrixChildren: (Paragraph | Table)[] = [];

  matrixChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: "BẢNG MA TRẬN ĐỐI CHIẾU ĐÁP ÁN TỔNG HỢP",
          bold: true,
          size: 26,
          color: "1D4ED8",
        }),
      ],
    })
  );

  matrixChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: `Áp dụng cho kỳ thi: ${examName} (Gồm các mã đề: ${shuffledVariants.map((v) => v.code).join(", ")})`,
          italics: true,
          size: 20,
        }),
      ],
    })
  );

  // Tạo bảng ma trận đáp án
  const tableHeaders = [
    new TableCell({
      width: { size: 20, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "CÂU HỎI", bold: true, size: 20 })],
        }),
      ],
    }),
    ...shuffledVariants.map((v) =>
      new TableCell({
        width: { size: Math.floor(80 / shuffledVariants.length), type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `MÃ ${v.code}`, bold: true, size: 20, color: "B91C1C" })],
          }),
        ],
      })
    ),
  ];

  const tableRows: TableRow[] = [
    new TableRow({ children: tableHeaders }),
  ];

  matrixRows.forEach((row) => {
    const rowCells = [
      new TableCell({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Câu ${row.questionNum}`, bold: true, size: 20 })],
          }),
        ],
      }),
      ...shuffledVariants.map((v) =>
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: row.answers[v.code] || "-",
                  bold: true,
                  size: 20,
                  color: "15803D",
                }),
              ],
            }),
          ],
        })
      ),
    ];
    tableRows.push(new TableRow({ children: rowCells }));
  });

  const matrixTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  matrixChildren.push(matrixTable);

  if (!isPro) {
    matrixChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 300 },
        children: [
          new TextRun({
            text: "Bộ đề và ma trận đáp án được tạo tự động bởi EduTest AI",
            italics: true,
            size: 16,
            color: "6B7280",
          }),
        ],
      })
    );
  }

  sections.push({
    properties: {},
    children: matrixChildren,
  });

  const doc = new Document({ sections });
  const blob = await Packer.toBlob(doc);
  const fileName = `${(examName || "Bo_De_Tron").replace(/\s+/g, "_")}_Ma_${shuffledVariants.map((v) => v.code).join("_")}.docx`;
  saveAs(blob, fileName);
}
