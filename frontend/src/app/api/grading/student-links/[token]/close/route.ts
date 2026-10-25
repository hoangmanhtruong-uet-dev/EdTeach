import { NextRequest, NextResponse } from "next/server";
import { closeStudentSubmissionLink } from "@/lib/grading/student-submission-store";

interface RouteProps {
  params: Promise<{ token: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { token } = await params;
    const closed = closeStudentSubmissionLink(token);

    if (!closed) {
      return NextResponse.json(
        { error: "Liên kết nộp bài không tồn tại." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã đóng liên kết nhận bài thành công.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Lỗi đóng liên kết nộp bài." },
      { status: 500 }
    );
  }
}
