// In-memory Realtime Session Store for Remote Mobile Camera Scanning
// Persists across requests via globalThis

export interface RemoteSubmission {
  id: string;
  studentName?: string;
  studentCode?: string;
  imageBase64: string;
  timestamp: number;
}

export interface LatestResult {
  studentName: string;
  studentCode: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  timestamp: number;
}

export interface RemoteSession {
  token: string;
  pin: string;
  sessionId: string;
  userId: string;
  sessionName: string;
  subject: string;
  grade: string;
  questionCount: number;
  answerKey: Record<number, string>;
  sheetType: string;
  connected: boolean;
  connectedAt?: number;
  lastActiveAt: number;
  pendingSubmissions: RemoteSubmission[];
  latestResult?: LatestResult;
}

declare global {
  // eslint-disable-next-line no-var
  var __remoteCamSessions: Map<string, RemoteSession> | undefined;
}

const sessions: Map<string, RemoteSession> =
  globalThis.__remoteCamSessions || (globalThis.__remoteCamSessions = new Map());

// Helper to generate a 4-digit PIN
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper to generate a token
function generateToken(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let res = "cam_";
  for (let i = 0; i < 8; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function createRemoteSession(params: {
  sessionId: string;
  userId: string;
  sessionName: string;
  subject: string;
  grade: string;
  questionCount: number;
  answerKey: Record<number, string>;
  sheetType: string;
}): RemoteSession {
  // Cleanup expired sessions (> 2 hours old)
  const now = Date.now();
  for (const [key, s] of sessions.entries()) {
    if (now - s.lastActiveAt > 2 * 60 * 60 * 1000) {
      sessions.delete(key);
    }
  }

  const token = generateToken();
  const pin = generatePin();

  const newSession: RemoteSession = {
    token,
    pin,
    sessionId: params.sessionId,
    userId: params.userId,
    sessionName: params.sessionName,
    subject: params.subject,
    grade: params.grade,
    questionCount: params.questionCount,
    answerKey: params.answerKey,
    sheetType: params.sheetType,
    connected: false,
    lastActiveAt: now,
    pendingSubmissions: [],
  };

  sessions.set(token, newSession);
  return newSession;
}

export function getRemoteSession(tokenOrPin: string): RemoteSession | null {
  const clean = tokenOrPin.trim();
  // Try by token
  if (sessions.has(clean)) {
    const s = sessions.get(clean)!;
    s.lastActiveAt = Date.now();
    return s;
  }
  // Try by PIN
  for (const s of sessions.values()) {
    if (s.pin === clean) {
      s.lastActiveAt = Date.now();
      return s;
    }
  }
  return null;
}

export function connectRemoteSession(tokenOrPin: string): RemoteSession | null {
  const session = getRemoteSession(tokenOrPin);
  if (!session) return null;
  session.connected = true;
  session.connectedAt = Date.now();
  session.lastActiveAt = Date.now();
  return session;
}

export function submitPhotoToSession(
  token: string,
  submission: Omit<RemoteSubmission, "id" | "timestamp">
): RemoteSubmission | null {
  const session = sessions.get(token);
  if (!session) return null;

  const sub: RemoteSubmission = {
    ...submission,
    id: "sub_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    timestamp: Date.now(),
  };

  session.pendingSubmissions.push(sub);
  session.lastActiveAt = Date.now();
  return sub;
}

export function consumePendingSubmissions(token: string): RemoteSubmission[] {
  const session = sessions.get(token);
  if (!session) return [];
  const subs = [...session.pendingSubmissions];
  session.pendingSubmissions = [];
  session.lastActiveAt = Date.now();
  return subs;
}

export function reportSessionResult(
  token: string,
  result: LatestResult
): boolean {
  const session = sessions.get(token);
  if (!session) return false;
  session.latestResult = result;
  session.lastActiveAt = Date.now();
  return true;
}
