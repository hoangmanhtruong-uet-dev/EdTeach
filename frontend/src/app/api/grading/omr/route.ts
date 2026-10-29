import { NextRequest, NextResponse } from "next/server";

const AI_SERVICE_BASE =
  process.env.INTERNAL_AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://localhost:8000";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "";

export async function GET() {
  try {
    const res = await fetch(`${AI_SERVICE_BASE}/ai/omr/templates`, {
      headers: {
        ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Lỗi kết nối AI Service: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Không thể kết nối dịch vụ OMR: ${err.message}` },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "grade_single";

    if (action === "download_pdf") {
      const sheetType = body.sheetType === "2025" ? "bgd_2025" : "classic_50";
      const examTitle = body.examTitle || "KỲ THI TRẮC NGHIỆM ĐỊNH KỲ";

      const res = await fetch(`${AI_SERVICE_BASE}/ai/omr/generate-sheet-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
        },
        body: JSON.stringify({
          sheet_type: sheetType,
          exam_title: examTitle,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: errorText }, { status: res.status });
      }

      const pdfArrayBuffer = await res.arrayBuffer();
      return new NextResponse(pdfArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="phieu_trac_nghiem_${sheetType}.pdf"`,
        },
      });
    }

    if (action === "grade_batch") {
      const sheetType = body.sheetType === "2025" ? "bgd_2025" : "classic_50";
      const res = await fetch(`${AI_SERVICE_BASE}/ai/omr/grade-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
        },
        body: JSON.stringify({
          items: body.items,
          sheet_type: sheetType,
          answer_key: body.answerKey || {},
          return_annotated_images: Boolean(body.returnAnnotatedImages),
        }),
      });

      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Default: grade_single
    const sheetType = body.sheetType === "2025" ? "bgd_2025" : "classic_50";
    const res = await fetch(`${AI_SERVICE_BASE}/ai/omr/grade-single`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
      },
      body: JSON.stringify({
        image_base64: body.imageBase64,
        sheet_type: sheetType,
        answer_key: body.answerKey || {},
        return_annotated_image: body.returnAnnotatedImage !== false,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("OMR route error:", err);
    return NextResponse.json(
      { error: `Lỗi xử lý OMR: ${err.message}` },
      { status: 500 }
    );
  }
}

