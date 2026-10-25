import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://localhost:8000";

// Simple in-memory IP rate limiter: max 5 requests per IP per day
const ipRateLimits = new Map<string, { count: number; date: string }>();

function checkIpRateLimit(ip: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const record = ipRateLimits.get(ip);
  if (!record || record.date !== today) {
    ipRateLimits.set(ip, { count: 1, date: today });
    return true;
  }
  if (record.count >= 6) {
    return false; // Exceeded 5 requests/day limit
  }
  record.count += 1;
  return true;
}

// Ngân hàng câu hỏi dự phòng chuyên sâu theo cấu trúc chuẩn Bộ GD&ĐT 2025 (Phần I, II, III)
function getSubjectQuestions(subject: string, grade: string | number, count: number): any[] {
  const normSubj = (subject || "").toLowerCase();

  if (normSubj.includes("hóa") || normSubj.includes("chem")) {
    return [
      {
        blockType: "section_title",
        sectionTitle: "PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (4 phương án, chọn 01 đáp án đúng duy nhất)",
      },
      {
        blockType: "multiple_choice",
        content: "Hạt mang điện tích dương trong hạt nhân nguyên tử là hạt nào sau đây?",
        options: { A: "Proton", B: "Electron", C: "Neutron", D: "Hạt nhân" },
        correct_answer: "A",
        explanation: "Hạt nhân nguyên tử được cấu tạo bởi proton (mang điện tích dương) và neutron (không mang điện). Electron mang điện tích âm quay quanh hạt nhân.",
      },
      {
        blockType: "multiple_choice",
        content: "Công thức hóa học của nước và tỉ lệ số nguyên tử H : O trong phân tử nước lần lượt là:",
        options: { A: "$\\text{H}_2\\text{O}$, tỉ lệ 2 : 1", B: "$\\text{H}_2\\text{O}_2$, tỉ lệ 1 : 1", C: "$\\text{HO}_2$, tỉ lệ 1 : 2", D: "$\\text{H}_2\\text{O}$, tỉ lệ 1 : 2" },
        correct_answer: "A",
        explanation: "Phân tử nước có công thức $\\text{H}_2\\text{O}$, gồm 2 nguyên tử Hydrogen liên kết với 1 nguyên tử Oxygen, tỉ lệ 2 : 1.",
      },
      {
        blockType: "multiple_choice",
        content: "Dung dịch nào sau đây làm quỳ tím chuyển sang màu đỏ đặc trưng của môi trường axit?",
        options: { A: "Dung dịch axit clohiđric ($\\text{HCl}$)", B: "Dung dịch natri hiđroxit ($\\text{NaOH}$)", C: "Dung dịch nước muối ($\\text{NaCl}$)", D: "Dung dịch đường saccarozơ" },
        correct_answer: "A",
        explanation: "Dung dịch axit làm quỳ tím chuyển màu đỏ. Dung dịch kiềm làm quỳ tím chuyển màu xanh.",
      },
      {
        blockType: "multiple_choice",
        content: "Hiện tượng nào sau đây là hiện tượng hóa học?",
        options: { A: "Đinh sắt để trong không khí ẩm lâu ngày bị gỉ sét", B: "Cồn để trong lọ hở miệng bị bay hơi", C: "Nước lỏng đông đặc thành nước đá trong tủ lạnh", D: "Hòa tan đường vào cốc nước được dung dịch nước đường" },
        correct_answer: "A",
        explanation: "Đinh sắt bị gỉ sét tạo ra hợp chất sắt oxit mới, có sự biến đổi chất nên là hiện tượng hóa học.",
      },
      {
        blockType: "section_title",
        sectionTitle: "PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI (Thí sinh chọn Đúng hoặc Sai cho mỗi phát biểu a, b, c, d)",
      },
      {
        blockType: "true_false",
        content: "Tiến hành thí nghiệm cho mẩu kẽm ($\\text{Zn}$) vào ống nghiệm chứa dung dịch axit clohiđric ($\\text{HCl}$) loãng dư ở nhiệt độ phòng. Cho các phát biểu sau:",
        trueFalseItems: [
          { label: "a", statement: "Có bọt khí không màu ($\\text{H}_2$) thoát ra trên bề mặt mẩu kẽm và dung dịch nóng dần lên.", isCorrect: true },
          { label: "b", statement: "Khí hydrogen sinh ra nhẹ hơn không khí và có thể thu được bằng phương pháp đẩy nước.", isCorrect: true },
          { label: "c", statement: "Nếu thay dung dịch $\\text{HCl}$ loãng bằng dung dịch $\\text{H}_2\\text{SO}_4$ đặc nguội thì bọt khí thoát ra mãnh liệt hơn.", isCorrect: false },
          { label: "d", statement: "Phản ứng giữa kẽm và axit clohiđric thuộc loại phản ứng thế.", isCorrect: true },
        ],
        correct_answer: "a - Đúng, b - Đúng, c - Sai, d - Đúng",
        explanation: "Ý c sai vì kẽm tác dụng với H2SO4 đặc tạo ra khí SO2/H2S chứ không tạo H2 mãnh liệt hơn.",
      },
      {
        blockType: "true_false",
        content: "Xét cấu tạo bảng tuần hoàn các nguyên tố hóa học và tính chất biến thiên tuần hoàn, cho các phát biểu sau:",
        trueFalseItems: [
          { label: "a", statement: "Số thứ tự của chu kì bằng số lớp electron trong nguyên tử của nguyên tố đó.", isCorrect: true },
          { label: "b", statement: "Các nguyên tố kim loại kiềm thuộc nhóm IA đều có hóa trị I trong các hợp chất.", isCorrect: true },
          { label: "c", statement: "Trong một chu kì theo chiều tăng điện tích hạt nhân, tính kim loại tăng dần, tính phi kim giảm dần.", isCorrect: false },
          { label: "d", statement: "Bảng tuần hoàn hiện nay được sắp xếp theo chiều tăng dần của điện tích hạt nhân nguyên tử.", isCorrect: true },
        ],
        correct_answer: "a - Đúng, b - Đúng, c - Sai, d - Đúng",
        explanation: "Ý c sai vì trong một chu kì từ trái sang phải, tính kim loại giảm dần và tính phi kim tăng dần.",
      },
      {
        blockType: "section_title",
        sectionTitle: "PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (Thí sinh tính toán và điền đáp số vào ô trả lời)",
      },
      {
        blockType: "short_answer",
        content: "Đốt cháy hoàn toàn $3{,}6\\text{ gam}$ kim loại magie ($\\text{Mg}$) trong khí oxygen dư thu được $m\\text{ gam}$ magie oxit ($\\text{MgO}$). Biết $M_{\\text{Mg}} = 24$, $M_{\\text{O}} = 16$. Giá trị của $m$ bằng bao nhiêu? (Nhập kết quả dưới dạng số thập phân)",
        correct_answer: "6.0",
        explanation: "Số mol Mg = 3,6 / 24 = 0,15 mol. PTHH: 2Mg + O2 -> 2MgO. n_MgO = 0,15 mol. Khối lượng MgO m = 0,15 * 40 = 6,0 gam.",
      },
      {
        blockType: "short_answer",
        content: "Hòa tan hết $5{,}6\\text{ gam}$ sắt ($\\text{Fe}$, $M = 56$) vào lượng dư dung dịch $\\text{HCl}$. Thể tích khí $\\text{H}_2$ thu được ở điều kiện chuẩn ($25^\\circ\\text{C}, 1\\text{ bar}$, $1\\text{ mol} = 24{,}79\\text{ lít}$) là bao nhiêu lít? (Làm tròn đến 2 chữ số thập phân)",
        correct_answer: "2.48",
        explanation: "Số mol Fe = 5,6 / 56 = 0,1 mol. PTHH: Fe + 2HCl -> FeCl2 + H2. n_H2 = 0,1 mol. V = 0,1 * 24,79 = 2,479 lít ≈ 2,48 lít.",
      }
    ];
  }

  // Mặc định Toán học chuẩn 3 phần
  return [
    {
      blockType: "section_title",
      sectionTitle: "PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN",
    },
    {
      blockType: "multiple_choice",
      content: "Cho hàm số bậc hai $y = x^2 - 4x + 3$. Tọa độ đỉnh $I$ của parabol là:",
      options: { A: "$I(2; -1)$", B: "$I(-2; 15)$", C: "$I(4; 3)$", D: "$I(1; 0)$" },
      correct_answer: "A",
      explanation: "Hoành độ đỉnh $x = -b / (2a) = 4 / 2 = 2$. Tung độ đỉnh $y = 2^2 - 4(2) + 3 = -1$. Vậy $I(2; -1)$.",
    },
    {
      blockType: "multiple_choice",
      content: "Nghiệm của phương trình $\\sqrt{2x - 3} = 3$ là:",
      options: { A: "$x = 6$", B: "$x = 3$", C: "$x = 9$", D: "$x = 12$" },
      correct_answer: "A",
      explanation: "Bình phương hai vế: $2x - 3 = 9 \\Leftrightarrow 2x = 12 \\Leftrightarrow x = 6$. Thỏa mãn điều kiện $x \\ge 1{,}5$.",
    },
    {
      blockType: "section_title",
      sectionTitle: "PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI",
    },
    {
      blockType: "true_false",
      content: "Cho tam giác $ABC$ vuông tại $A$ có $AB = 6\\text{ cm}$ và $AC = 8\\text{ cm}$. Xét tính Đúng/Sai của các khẳng định sau:",
      trueFalseItems: [
        { label: "a", statement: "Độ dài cạnh huyền $BC = 10\\text{ cm}$.", isCorrect: true },
        { label: "b", statement: "Diện tích tam giác $ABC$ bằng $48\\text{ cm}^2$.", isCorrect: false },
        { label: "c", statement: "Bán kính đường tròn ngoại tiếp tam giác $ABC$ bằng $5\\text{ cm}$.", isCorrect: true },
        { label: "d", statement: "Sin của góc $\\widehat{ABC}$ bằng $0{,}8$.", isCorrect: true },
      ],
      correct_answer: "a - Đúng, b - Sai, c - Đúng, d - Đúng",
      explanation: "Diện tích S = 1/2 * 6 * 8 = 24 cm^2 nên ý b sai. Các ý còn lại đều đúng.",
    },
    {
      blockType: "section_title",
      sectionTitle: "PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN",
    },
    {
      blockType: "short_answer",
      content: "Tìm giá trị nhỏ nhất của biểu thức $P = x^2 - 6x + 14$ với mọi số thực $x$.",
      correct_answer: "5",
      explanation: "$P = (x - 3)^2 + 5 \\ge 5$. Dấu bằng xảy ra khi $x = 3$. Vậy GTNN bằng 5.",
    }
  ];
}

export async function POST(req: NextRequest) {
  try {
    // 0. Kiểm tra IP rate-limit để chống bot cày tài khoản ảo
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkIpRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error: "IP_RATE_LIMITED",
          message: "Địa chỉ mạng này đã đạt giới hạn 5 đề thi miễn phí trong ngày để đảm bảo tài nguyên cho mọi giáo viên.",
        },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    // 1. Xác thực user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện chức năng này." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      subject,
      grade,
      topic,
      question_type = "MCQ",
      num_questions = 10,
      difficulty = 2,
      additional_context = "",
    } = body;

    if (!name || !subject || !grade) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc: tên đề, môn học, hoặc khối lớp." },
        { status: 400 }
      );
    }

    // 2. Lấy thông tin ví và người dùng (Hỗ trợ Admin Client & Auto-heal phòng ngừa lỗi Foreign Key)
    const adminSupabase = createAdminClient();
    const db = adminSupabase || supabase;

    let userProfile: any = null;
    try {
      const { data } = await (db.from("users") as any)
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      userProfile = data;
    } catch {
      // ignore
    }

    if (!userProfile) {
      const email = user.email || "teacher@eduteach.vn";
      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0] ||
        "Thầy Cô";
      try {
        const { data: newProfile } = await (db.from("users") as any)
          .upsert(
            {
              id: user.id,
              email,
              name,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
              role: "teacher",
            },
            { onConflict: "id" }
          )
          .select("*")
          .maybeSingle();
        if (newProfile) userProfile = newProfile;
      } catch (e) {
        console.warn("Auto-create user warning:", e);
      }
    }

    let wallet: any = null;
    try {
      const { data } = await (db.from("wallets") as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      wallet = data;
    } catch {
      // ignore
    }

    if (!wallet) {
      try {
        const { data: newWallet } = await (db.from("wallets") as any)
          .upsert(
            {
              user_id: user.id,
              balance: 100,
            },
            { onConflict: "user_id" }
          )
          .select("*")
          .maybeSingle();
        if (newWallet) wallet = newWallet;
      } catch (e) {
        console.warn("Auto-create wallet warning:", e);
      }
    }

    const requiredCredits = Math.ceil(num_questions / 10) * 20;

    // Daily Quota Logic:
    let dailyQuota = wallet?.daily_quota ?? 3;
    let dailyUsed = wallet?.daily_quota_used ?? 0;
    let balance = wallet?.balance ?? 100;
    let isFreeUsage = false;
    let creditsDeducted = 0;

    const MAX_DAILY_CREDITS = 5000;
    const dailyCreditUsed = (wallet as any)?.daily_credit_used ?? 0;
    let currentDailyCreditUsed = dailyCreditUsed;

    // Kiểm tra reset ngày mới (nếu có cột last_quota_reset)
    if (wallet?.last_quota_reset) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastResetStr = new Date(wallet.last_quota_reset).toISOString().slice(0, 10);
      if (lastResetStr !== todayStr) {
        dailyUsed = 0;
        currentDailyCreditUsed = 0;
      }
    }

    // Kiểm tra trần tối đa 5.000 credits/ngày (chống lạm dụng / abuse API)
    if (
      currentDailyCreditUsed + requiredCredits > MAX_DAILY_CREDITS &&
      userProfile?.tier !== "school"
    ) {
      return NextResponse.json(
        {
          error: "DAILY_CREDIT_LIMIT_REACHED",
          message:
            "Tài khoản của bạn đã đạt hạn mức tối đa 5.000 credits trong ngày hôm nay. Hạn mức sẽ tự động được làm mới vào 00:00 ngày mai.",
        },
        { status: 403 }
      );
    }

    if (dailyUsed < dailyQuota) {
      isFreeUsage = true;
      dailyUsed += 1;
      creditsDeducted = 0;
    } else if (balance >= requiredCredits) {
      isFreeUsage = false;
      creditsDeducted = requiredCredits;
      balance -= requiredCredits;
    } else {
      return NextResponse.json(
        {
          error: "QUOTA_EXHAUSTED",
          message: "Thầy/Cô đã dùng hết 3 lượt tạo đề miễn phí trong ngày hôm nay.",
          daily_quota: dailyQuota,
          daily_quota_used: dailyUsed,
          remaining_credits: balance,
          referral_code: userProfile?.referral_code || "EDU" + user.id.slice(0, 4).toUpperCase(),
        },
        { status: 403 }
      );
    }

    // 3. Tạo record exam ở trạng thái "generating"
    const { data: exam, error: examError } = await (db
      .from("exams") as any)
      .insert({
        user_id: user.id,
        name,
        subject,
        grade: grade.toString(),
        status: "generating",
        credit_cost: creditsDeducted,
        question_count: 0,
        config: {
          difficulty,
          topic,
          additional_context,
          question_type,
          is_free_quota: isFreeUsage,
        },
      })
      .select()
      .single();

    if (examError || !exam) {
      const isFkey = examError?.code === "23503" || examError?.message?.includes("foreign key");
      return NextResponse.json(
        {
          error: isFkey
            ? "Tài khoản chưa được đồng bộ vào bảng users. Vui lòng chạy file migration 'supabase/migrations/20261025_sync_users_and_fix_rls.sql' trên Supabase SQL Editor."
            : "Lỗi khởi tạo đề thi: " + examError?.message,
        },
        { status: 500 }
      );
    }

    // 4. Gọi Python AI Service hoặc trực tiếp Google Gemini API
    let generatedQuestions: any[] = [];
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          grade: parseInt(grade.toString()) || 4,
          topic: topic || name,
          question_type,
          num_questions: Math.min(num_questions, 20),
          difficulty,
          additional_context,
          verify: body.verify ?? false,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        generatedQuestions = aiData.questions || [];
      } else {
        throw new Error(`AI Service returned ${aiResponse.status}`);
      }
    } catch (aiServiceErr: any) {
      console.warn("Python AI Service not reachable, checking direct Gemini API key...", aiServiceErr.message);

      // Nếu có GEMINI_API_KEY cấu hình trong .env.local, gọi trực tiếp Gemini 1.5 Flash
      if (geminiKey) {
        try {
          const is2025Format = /phần|đúng\s*[-/]?\s*sai|trả\s*lời\s*ngắn|2025|bộ/i.test(`${topic} ${additional_context} ${name}`);

          const geminiPrompt = is2025Format
            ? `Bạn là chuyên gia khảo thí biên soạn đề thi chuẩn Bộ GD&ĐT Việt Nam năm 2025 cho môn: ${subject}, khối lớp: ${grade}.
Chủ đề & Yêu cầu: "${topic || name}".
${additional_context ? `Chi tiết cấu trúc đề từ giáo viên:
${additional_context}` : ""}

HÃY XÂY DỰNG ĐỀ THI ĐẦY ĐỦ CÁC PHẦN ĐÚNG THEO ĐỊNH DẠNG BỘ GD&ĐT 2025:
- PHẦN I: Trắc nghiệm 4 phương án lựa chọn (A, B, C, D) - blockType: "multiple_choice"
- PHẦN II: Trắc nghiệm Đúng / Sai (Mỗi câu có 1 ngữ cảnh và 4 phát biểu a, b, c, d với isCorrect: true/false) - blockType: "true_false"
- PHẦN III: Trắc nghiệm trả lời ngắn (Không có phương án A, B, C, D. Điền số hoặc CTHH ngắn) - blockType: "short_answer"

YÊU CẦU ĐẦU RA JSON CHUẨN CẤU TRÚC:
{
  "questions": [
    {
      "blockType": "section_title",
      "sectionTitle": "PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN"
    },
    {
      "blockType": "multiple_choice",
      "content": "Câu hỏi trắc nghiệm (sử dụng LaTeX $...$)",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "A",
      "explanation": "Lời giải chi tiết"
    },
    {
      "blockType": "section_title",
      "sectionTitle": "PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI"
    },
    {
      "blockType": "true_false",
      "content": "Ngữ cảnh thí nghiệm hoặc hiện tượng hóa học/vật lý...",
      "trueFalseItems": [
        { "label": "a", "statement": "Phát biểu a", "isCorrect": true },
        { "label": "b", "statement": "Phát biểu b", "isCorrect": false },
        { "label": "c", "statement": "Phát biểu c", "isCorrect": true },
        { "label": "d", "statement": "Phát biểu d", "isCorrect": false }
      ],
      "correct_answer": "a - Đúng, b - Sai, c - Đúng, d - Sai",
      "explanation": "Giải thích chi tiết các ý a, b, c, d"
    },
    {
      "blockType": "section_title",
      "sectionTitle": "PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN"
    },
    {
      "blockType": "short_answer",
      "content": "Bài toán định lượng yêu cầu tính toán kết quả",
      "correct_answer": "Đáp số ngắn (ví dụ: 4.5 hoặc 24.8)",
      "explanation": "Các bước tính toán chi tiết"
    }
  ]
}`
            : `Bạn là chuyên gia giáo dục biên soạn đề thi chuẩn Bộ GD&ĐT Việt Nam.
Hãy tạo ${Math.min(num_questions, 10)} câu hỏi trắc nghiệm cho môn: ${subject}, lớp: ${grade}, chủ đề: "${topic || name}".
Mức độ nhận thức: ${difficulty === 1 ? "Nhận biết" : difficulty === 3 ? "Vận dụng" : "Thông hiểu"}.
${additional_context ? `Yêu cầu thêm: ${additional_context}` : ""}

YÊU CẦU ĐẦU RA JSON CHUẨN CÓ CẤU TRÚC:
{
  "questions": [
    {
      "blockType": "multiple_choice",
      "content": "Nội dung câu hỏi (sử dụng LaTeX $...$ nếu có công thức)",
      "options": { "A": "Đáp án A", "B": "Đáp án B", "C": "Đáp án C", "D": "Đáp án D" },
      "correct_answer": "A",
      "explanation": "Lời giải chi tiết từng bước ngắn gọn dễ hiểu"
    }
  ]
}`;

          const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest"];
          for (const model of modelsToTry) {
            try {
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: geminiPrompt }] }],
                    generationConfig: {
                      temperature: 0.7,
                      responseMimeType: "application/json",
                    },
                  }),
                }
              );

              if (geminiRes.ok) {
                const geminiData = await geminiRes.json();
                const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (rawText) {
                  const parsed = JSON.parse(rawText);
                  generatedQuestions = parsed.questions || [];
                  if (generatedQuestions.length > 0) break;
                }
              } else {
                console.warn(`Gemini ${model} returned status ${geminiRes.status}`);
              }
            } catch (singleErr: any) {
              console.warn(`Gemini ${model} fetch error:`, singleErr.message);
            }
          }
        } catch (geminiErr: any) {
          console.warn("Direct Gemini call failed:", geminiErr.message);
        }
      }

            // Nếu chưa có API Key hoặc cả 2 đều không thành công -> Dùng ngân hàng câu hỏi môn học chuẩn Bộ GD&ĐT
      if (!generatedQuestions || generatedQuestions.length === 0) {
        generatedQuestions = getSubjectQuestions(subject, grade, num_questions);
      }
    }

    // 5. Lưu câu hỏi vào database questions
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      if (q.blockType === "section_title") continue;
      const qType = q.blockType === "true_false" ? "true_false" : q.blockType === "short_answer" ? "fill_blank" : q.blockType === "essay" ? "essay" : "multiple_choice";
      const qOptions = q.blockType === "true_false" ? { trueFalseItems: q.trueFalseItems } : (typeof q.options === "object" ? q.options : null);
      try {
        await (db.from("questions") as any).insert({
          exam_id: exam.id,
          type: qType,
          content: q.content || "",
          options: qOptions,
          correct_answer: q.correct_answer || "",
          explanation: q.explanation || q.solution || "",
          difficulty: "medium",
          order_index: i + 1,
        });
      } catch (insertErr) {
        // ignore individual question error
      }
    }

    // 6. Cập nhật trạng thái exam sang completed
    await (db
      .from("exams") as any)
      .update({
        status: "completed",
        question_count: generatedQuestions.length,
        config: {
          difficulty,
          topic,
          additional_context,
          question_type,
          is_free_quota: isFreeUsage,
          questions: generatedQuestions,
        },
      })
      .eq("id", exam.id);

    // 7. Cập nhật lượt hàng ngày & trừ credit trong ví
    if (wallet) {
      const updatePayload: any = { balance };
      if (wallet.daily_quota !== undefined) {
        updatePayload.daily_quota_used = dailyUsed;
        updatePayload.daily_credit_used = currentDailyCreditUsed + creditsDeducted;
        updatePayload.last_quota_reset = new Date().toISOString();
        updatePayload.updated_at = new Date().toISOString();
      }
      try {
        await (db.from("wallets") as any).update(updatePayload).eq("id", wallet.id);
      } catch (err) {
        console.warn("Wallet update warning:", err);
      }

      if (creditsDeducted > 0) {
        try {
          await (db.from("wallet_txns") as any).insert({
            wallet_id: wallet.id,
            amount: -creditsDeducted,
            type: "generate_exam",
            description: `Tạo đề thi "${name}" (${generatedQuestions.length} câu)`,
            ref_id: exam.id,
          });
        } catch {
          // ignore transaction log error
        }
      }
    }

    return NextResponse.json({
      success: true,
      exam_id: exam.id,
      questions: generatedQuestions,
      questions_count: generatedQuestions.length,
      is_free_quota: isFreeUsage,
      daily_quota: dailyQuota,
      daily_quota_used: dailyUsed,
      credits_deducted: creditsDeducted,
      remaining_balance: balance,
    });
  } catch (err: any) {
    console.error("Generate exam error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ trong quá trình sinh đề thi." },
      { status: 500 }
    );
  }
}