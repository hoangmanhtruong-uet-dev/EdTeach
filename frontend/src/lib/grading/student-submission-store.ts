// In-memory Realtime Store for Student Self-Submissions
// Persists across requests via globalThis in Next.js

export interface StudentSubmissionDetail {
  questionNumber: number;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface StudentSubmission {
  id: string;
  linkToken: string;
  sessionId: string;
  studentName: string;
  studentCode: string;
  className: string;
  examCode: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  emptyCount: number;
  totalQuestions: number;
  studentAnswers: Record<number, string>;
  details: StudentSubmissionDetail[];
  submittedAt: string;
  source: "student_self";
}

export interface StudentSubmissionLink {
  token: string;
  sessionId: string;
  sessionName: string;
  subject: string;
  grade: string;
  className: string;
  durationMinutes: number;
  createdAt: number;
  expiresAt: number;
  questionCount: number;
  sheetType: string;
  answerKey: Record<number, string>;
  isClosed: boolean;
  submissionsCount: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __studentSubmissionLinks: Map<string, StudentSubmissionLink> | undefined;
  // eslint-disable-next-line no-var
  var __studentSubmissions: Map<string, StudentSubmission> | undefined;
}

const links: Map<string, StudentSubmissionLink> =
  globalThis.__studentSubmissionLinks || (globalThis.__studentSubmissionLinks = new Map());

const submissions: Map<string, StudentSubmission> =
  globalThis.__studentSubmissions || (globalThis.__studentSubmissions = new Map());

// Helper to generate a friendly short token
function generateSubmissionToken(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let res = "";
  for (let i = 0; i < 8; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function createStudentSubmissionLink(params: {
  sessionId: string;
  sessionName: string;
  subject?: string;
  grade?: string;
  className?: string;
  durationMinutes: number;
  questionCount: number;
  sheetType?: string;
  answerKey?: Record<number, string>;
}): StudentSubmissionLink {
  // Clean expired links older than 24 hours
  const now = Date.now();
  for (const [token, l] of links.entries()) {
    if (now - l.expiresAt > 24 * 60 * 60 * 1000) {
      links.delete(token);
    }
  }

  const token = generateSubmissionToken();
  const expiresAt = now + Math.max(5, Math.min(params.durationMinutes, 120)) * 60 * 1000;

  const newLink: StudentSubmissionLink = {
    token,
    sessionId: params.sessionId,
    sessionName: params.sessionName || "Kỳ thi trắc nghiệm",
    subject: params.subject || "Toán",
    grade: params.grade || "10",
    className: (params.className || "").trim(),
    durationMinutes: params.durationMinutes,
    createdAt: now,
    expiresAt,
    questionCount: params.questionCount || 20,
    sheetType: params.sheetType || "20",
    answerKey: params.answerKey || {},
    isClosed: false,
    submissionsCount: 0,
  };

  links.set(token, newLink);
  return newLink;
}

export function getStudentSubmissionLink(token: string): StudentSubmissionLink | null {
  const link = links.get(token);
  if (!link) return null;
  return link;
}

export function getStudentSubmissionLinksBySession(sessionId: string): StudentSubmissionLink[] {
  const result: StudentSubmissionLink[] = [];
  for (const l of links.values()) {
    if (l.sessionId === sessionId) {
      result.push(l);
    }
  }
  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export function closeStudentSubmissionLink(token: string): boolean {
  const link = links.get(token);
  if (!link) return false;
  link.isClosed = true;
  return true;
}

export function submitStudentExam(params: {
  linkToken: string;
  studentName: string;
  studentCode: string;
  className?: string;
  examCode?: string;
  studentAnswers: Record<number, string>;
}): { success: boolean; submission?: StudentSubmission; error?: string } {
  const link = links.get(params.linkToken);
  if (!link) {
    return { success: false, error: "Liên kết nộp bài không tồn tại." };
  }

  const now = Date.now();
  if (link.isClosed || now > link.expiresAt) {
    return { success: false, error: "Thời hạn nhận bài của liên kết này đã kết thúc." };
  }

  const questionCount = link.questionCount || Object.keys(link.answerKey).length || 20;
  let correctCount = 0;
  let incorrectCount = 0;
  let emptyCount = 0;
  const details: StudentSubmissionDetail[] = [];

  for (let q = 1; q <= questionCount; q++) {
    const studentAns = (params.studentAnswers[q] || "").trim().toUpperCase();
    const correctAns = (link.answerKey[q] || "").trim().toUpperCase() || "A";

    if (!studentAns) {
      emptyCount++;
      details.push({
        questionNumber: q,
        studentAnswer: "",
        correctAnswer: correctAns,
        isCorrect: false,
      });
    } else if (studentAns === correctAns) {
      correctCount++;
      details.push({
        questionNumber: q,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect: true,
      });
    } else {
      incorrectCount++;
      details.push({
        questionNumber: q,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect: false,
      });
    }
  }

  const rawScore = (correctCount / questionCount) * 10;
  const score = Math.round(rawScore * 100) / 100;

  const submissionId = "sub_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const newSubmission: StudentSubmission = {
    id: submissionId,
    linkToken: params.linkToken,
    sessionId: link.sessionId,
    studentName: params.studentName.trim() || "Học sinh",
    studentCode: params.studentCode.trim() || `${1000 + link.submissionsCount + 1}`,
    className: params.className?.trim() || link.className || "",
    examCode: params.examCode?.trim() || "101",
    score,
    correctCount,
    incorrectCount,
    emptyCount,
    totalQuestions: questionCount,
    studentAnswers: params.studentAnswers,
    details,
    submittedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " + new Date().toLocaleDateString("vi-VN"),
    source: "student_self",
  };

  submissions.set(submissionId, newSubmission);
  link.submissionsCount += 1;

  return { success: true, submission: newSubmission };
}

export function getStudentSubmissionsBySession(sessionId: string): StudentSubmission[] {
  const result: StudentSubmission[] = [];
  for (const sub of submissions.values()) {
    if (sub.sessionId === sessionId) {
      result.push(sub);
    }
  }
  return result.sort((a, b) => b.id.localeCompare(a.id));
}
