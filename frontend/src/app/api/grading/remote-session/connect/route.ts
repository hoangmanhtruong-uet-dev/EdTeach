import { NextRequest, NextResponse } from "next/server";
import { connectRemoteSession } from "@/lib/grading/remote-cam-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, pin } = body;
    const identifier = token || pin;

    if (!identifier) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã Token hoặc PIN 4 số." },
        { status: 400 }
      );
    }

    const session = connectRemoteSession(identifier);
    if (!session) {
      return NextResponse.json(
        { error: "Mã kết nối không hợp lệ hoặc phiên đã hết hạn." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        token: session.token,
        sessionName: session.sessionName,
        subject: session.subject,
        grade: session.grade,
        questionCount: session.questionCount,
        sheetType: session.sheetType,
      },
    });
  } catch (err: any) {
    console.error("Connect remote session error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi kết nối phiên quét." },
      { status: 500 }
    );
  }
}
