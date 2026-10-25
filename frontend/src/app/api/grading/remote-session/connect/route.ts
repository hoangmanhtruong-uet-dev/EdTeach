import { NextRequest, NextResponse } from "next/server";
import { connectRemoteSession } from "@/lib/grading/remote-cam-store";

// BẢO MẬT: Chống Brute-force mã PIN 4 số của máy quét camera
const pinAttemptStore = new Map<string, { attempts: number; lockedUntil: number }>();

function checkPinRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = pinAttemptStore.get(ip);
  if (!record) return { allowed: true };

  if (now < record.lockedUntil) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (now >= record.lockedUntil && record.attempts >= 5) {
    pinAttemptStore.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordPinFailure(ip: string): void {
  const now = Date.now();
  const record = pinAttemptStore.get(ip) || { attempts: 0, lockedUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockedUntil = now + 10 * 60 * 1000; // Khóa 10 phút sau 5 lần sai
  }
  pinAttemptStore.set(ip, record);
}

function resetPinAttempts(ip: string): void {
  pinAttemptStore.delete(ip);
}

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "ip_unknown";

    const rateCheck = checkPinRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Bạn đã nhập sai mã kết nối quá nhiều lần. Vui lòng thử lại sau ${rateCheck.waitSeconds} giây.`,
        },
        { status: 429 }
      );
    }

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
      recordPinFailure(clientIp);
      return NextResponse.json(
        { error: "Mã kết nối không hợp lệ hoặc phiên đã hết hạn." },
        { status: 404 }
      );
    }

    resetPinAttempts(clientIp);

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
