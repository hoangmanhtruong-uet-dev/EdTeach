import { NextRequest, NextResponse } from "next/server";
import { submitPhotoToSession } from "@/lib/grading/remote-cam-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, imageBase64, studentName, studentCode } = body;

    if (!token || !imageBase64) {
      return NextResponse.json(
        { error: "Thiếu token hoặc dữ liệu ảnh chụp bài thi." },
        { status: 400 }
      );
    }

    const sub = submitPhotoToSession(token, {
      imageBase64,
      studentName: studentName || "Học sinh",
      studentCode: studentCode || "",
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Phiên kết nối không tồn tại hoặc đã hết hạn." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: sub.id,
      timestamp: sub.timestamp,
    });
  } catch (err: any) {
    console.error("Submit photo error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi gửi ảnh bài thi." },
      { status: 500 }
    );
  }
}
