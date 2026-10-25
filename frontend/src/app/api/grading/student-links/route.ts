import { NextRequest, NextResponse } from "next/server";
import {
  createStudentSubmissionLink,
  getStudentSubmissionLinksBySession,
  getStudentSubmissionsBySession,
} from "@/lib/grading/student-submission-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      sessionName,
      subject,
      grade,
      className,
      durationMinutes = 60,
      questionCount = 20,
      sheetType = "20",
      answerKey = {},
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Thiếu sessionId của kỳ thi." },
        { status: 400 }
      );
    }

    const link = createStudentSubmissionLink({
      sessionId,
      sessionName,
      subject,
      grade,
      className,
      durationMinutes: parseInt(durationMinutes.toString()) || 60,
      questionCount: parseInt(questionCount.toString()) || 20,
      sheetType,
      answerKey,
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const linkUrl = `${protocol}://${host}/grading/submit/${link.token}`;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(
      linkUrl
    )}`;

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        linkUrl,
        qrUrl,
      },
    });
  } catch (err: any) {
    console.error("Create student link error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tạo link nộp bài." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Thiếu tham số sessionId." },
        { status: 400 }
      );
    }

    const links = getStudentSubmissionLinksBySession(sessionId);
    const submissions = getStudentSubmissionsBySession(sessionId);

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";

    const formattedLinks = links.map((l) => {
      const linkUrl = `${protocol}://${host}/grading/submit/${l.token}`;
      return {
        ...l,
        linkUrl,
        qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(
          linkUrl
        )}`,
      };
    });

    return NextResponse.json({
      success: true,
      links: formattedLinks,
      submissions,
    });
  } catch (err: any) {
    console.error("Get student links error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải thông tin liên kết." },
      { status: 500 }
    );
  }
}
