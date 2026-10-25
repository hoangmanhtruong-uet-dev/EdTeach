import { NextRequest, NextResponse } from "next/server";
import {
  getStudentSubmissionLink,
  submitStudentExam,
  closeStudentSubmissionLink,
} from "@/lib/grading/student-submission-store";

interface RouteProps {
  params: Promise<{ token: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { token } = await params;
    const link = getStudentSubmissionLink(token);

    if (!link) {
      return NextResponse.json(
        { error: "Liên kết nộp bài không tồn tại hoặc đã bị xóa." },
        { status: 404 }
      );
    }

    const now = Date.now();
    const isExpired = link.isClosed || now > link.expiresAt;
    const remainingMs = Math.max(0, link.expiresAt - now);

    return NextResponse.json({
      success: true,
      link: {
        token: link.token,
        sessionName: link.sessionName,
        subject: link.subject,
        grade: link.grade,
        className: link.className,
        durationMinutes: link.durationMinutes,
        questionCount: link.questionCount,
        sheetType: link.sheetType,
        expiresAt: link.expiresAt,
        remainingMs,
        isExpired,
        isClosed: link.isClosed,
      },
    });
  } catch (err: any) {
    console.error("Get student link by token error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải liên kết nộp bài." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { token } = await params;
    const body = await req.json();

    const {
      studentName,
      studentCode,
      className,
      examCode,
      studentAnswers = {},
    } = body;

    if (!studentName || !studentName.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ và tên của học sinh." },
        { status: 400 }
      );
    }

    const result = submitStudentExam({
      linkToken: token,
      studentName,
      studentCode: studentCode || "",
      className,
      examCode,
      studentAnswers,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể nộp bài." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: result.submission,
    });
  } catch (err: any) {
    console.error("Submit student exam error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi nộp bài." },
      { status: 500 }
    );
  }
}
