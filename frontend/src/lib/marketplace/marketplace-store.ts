import { MarketplaceItem, MarketplacePurchase, PayoutRequest } from "@/types/marketplace";

// ========================================================
// MARKETPLACE STORE (Bộ đề mẫu chuẩn GDPT 2025 & Lưu trữ giao dịch)
// ========================================================

export const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    seller_id: "a0000000-0000-4000-8000-000000000001",
    seller_name: "Thầy Vũ Tuấn Anh",
    seller_tier: "pro",
    title: "Đề thi thử Tốt nghiệp THPT 2025 Môn Toán - Chuẩn Cấu trúc 3 Phần",
    subject: "Toán",
    grade: 12,
    description: "Đề thi mẫu chuẩn cấu trúc 3 phần mới nhất của Bộ GD&ĐT: Phần I (12 câu trắc nghiệm 4 lựa chọn), Phần II (4 câu Đúng/Sai 4 ý) và Phần III (6 câu Trả lời ngắn). Có lời giải chi tiết và ma trận đặc tả.",
    price_credits: 0,
    question_count: 22,
    tags: ["GDPT 2025", "THPT Quốc Gia", "Toán 12", "Đúng Sai", "Trả lời ngắn"],
    preview_data: {
      matrix: {
        total_questions: 22,
        multiple_choice_count: 12,
        true_false_count: 4,
        short_answer_count: 6,
        difficulty_distribution: { easy: 8, medium: 8, hard: 4, very_hard: 2 },
        duration_minutes: 90,
      },
      sample_questions: [
        {
          id: "q-toan-1",
          order: 1,
          type: "multiple_choice",
          content: "Cho hàm số y = f(x) có bảng biến thiên trên đoạn [-3; 3]. Giá trị cực đại của hàm số đã cho bằng:",
          options: ["A. -1", "B. 2", "C. 3", "D. 0"],
          difficulty: "easy",
        },
        {
          id: "q-toan-2",
          order: 13,
          type: "true_false",
          content: "Xét tính đúng/sai của các mệnh đề sau về vectơ trong không gian Oxyz:",
          sub_questions: [
            { id: "sub-a", sub_label: "a", content: "Vectơ đơn vị trên trục Ox là i = (1; 0; 0)." },
            { id: "sub-b", sub_label: "b", content: "Độ dài của vectơ u = (1; 2; 2) bằng 3." },
            { id: "sub-c", sub_label: "c", content: "Tích vô hướng của hai vectơ vuông góc luôn bằng 1." },
            { id: "sub-d", sub_label: "d", content: "Tọa độ trung điểm đoạn thẳng nối (2; 0; 0) và (0; 4; 0) là (1; 2; 0)." },
          ],
          difficulty: "medium",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-toan-1",
          order: 1,
          type: "multiple_choice",
          content: "Cho hàm số y = f(x) có bảng biến thiên trên đoạn [-3; 3]. Giá trị cực đại của hàm số đã cho bằng:",
          options: ["A. -1", "B. 2", "C. 3", "D. 0"],
          difficulty: "easy",
          correct_answer: "B",
          explanation: "Từ bảng biến thiên, tại điểm x = 1, đạo hàm đổi dấu từ dương sang âm và f(1) = 2. Vậy giá trị cực đại của hàm số là 2.",
        },
      ],
    },
    downloads_count: 148,
    rating: 4.9,
    review_count: 18,
    status: "published",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    seller_id: "a0000000-0000-4000-8000-000000000002",
    seller_name: "Cô Nguyễn Bích Trâm",
    seller_tier: "max",
    title: "Bộ Đề Vận Dụng Cao Vật Lý 12 - Chuyên đề Sóng Cơ & Giao Thoa Sóng",
    subject: "Vật lý",
    grade: 12,
    description: "Tuyển tập 28 câu hỏi vận dụng cao bám sát thực tiễn đời sống và thí nghiệm vật lý. Kèm video giải đa cách và mẹo nhớ 15s phục vụ giáo viên dạy đội tuyển và dạy thêm.",
    price_credits: 500,
    question_count: 28,
    tags: ["Vận dụng cao", "Vật lý 12", "Sóng cơ", "Thí nghiệm thực hành", "MAX VIP"],
    preview_data: {
      matrix: {
        total_questions: 28,
        multiple_choice_count: 16,
        true_false_count: 6,
        short_answer_count: 6,
        difficulty_distribution: { easy: 4, medium: 8, hard: 10, very_hard: 6 },
        duration_minutes: 50,
      },
      sample_questions: [
        {
          id: "q-ly-1",
          order: 1,
          type: "multiple_choice",
          content: "Trong thí nghiệm giao thoa sóng ở mặt nước với hai nguồn đồng pha S1, S2 cách nhau 18 cm, bước sóng lambda = 3 cm. Số điểm cực đại giao thoa trên đoạn nối hai nguồn là:",
          options: ["A. 11", "B. 13", "C. 9", "D. 12"],
          difficulty: "medium",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-ly-1",
          order: 1,
          type: "multiple_choice",
          content: "Trong thí nghiệm giao thoa sóng ở mặt nước với hai nguồn đồng pha S1, S2 cách nhau 18 cm, bước sóng lambda = 3 cm. Số điểm cực đại giao thoa trên đoạn nối hai nguồn là:",
          options: ["A. 11", "B. 13", "C. 9", "D. 12"],
          difficulty: "medium",
          correct_answer: "A",
          explanation: "Điều kiện cực đại: -S1S2 < k * lambda < S1S2 <=> -18 < 3k < 18 <=> -6 < k < 6. Do k nguyên nên k nhận 11 giá trị (-5 đến 5).",
        },
      ],
    },
    downloads_count: 62,
    rating: 5.0,
    review_count: 12,
    status: "published",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    seller_id: "a0000000-0000-4000-8000-000000000003",
    seller_name: "Thầy Đỗ Văn Sang",
    seller_tier: "pro",
    title: "Đề Khảo Sát Hóa Học 12 GDPT 2025 - Chuyên đề Este, Lipit & Hợp Chất Nitơ",
    subject: "Hóa học",
    grade: 12,
    description: "Bộ câu hỏi Đúng/Sai và Trả lời ngắn có liên hệ phòng thí nghiệm 3D và bài toán thực tế sản xuất xà phòng, mỡ động thực vật. Barem điểm rõ ràng 100%.",
    price_credits: 300,
    question_count: 24,
    tags: ["Hóa học 12", "Este Lipit", "GDPT 2025", "Đúng Sai", "Phòng TN 3D"],
    preview_data: {
      matrix: {
        total_questions: 24,
        multiple_choice_count: 14,
        true_false_count: 6,
        short_answer_count: 4,
        difficulty_distribution: { easy: 6, medium: 10, hard: 6, very_hard: 2 },
        duration_minutes: 50,
      },
      sample_questions: [
        {
          id: "q-hoa-1",
          order: 1,
          type: "multiple_choice",
          content: "Thủy phân hoàn toàn triglixerit X trong dung dịch NaOH đun nóng, thu được glixerol và hỗn hợp gồm natri stearat và natri panmitat theo tỉ lệ mol 2 : 1. Phân tử khối của X là:",
          options: ["A. 862", "B. 890", "C. 834", "D. 806"],
          difficulty: "hard",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-hoa-1",
          order: 1,
          type: "multiple_choice",
          content: "Thủy phân hoàn toàn triglixerit X trong dung dịch NaOH đun nóng, thu được glixerol và hỗn hợp gồm natri stearat và natri panmitat theo tỉ lệ mol 2 : 1. Phân tử khối của X là:",
          options: ["A. 862", "B. 890", "C. 834", "D. 806"],
          difficulty: "hard",
          correct_answer: "A",
          explanation: "Công thức phân tử X: (C17H35COO)2(C15H31COO)C3H5 -> M = 2*283 + 255 + 41 = 862 g/mol.",
        },
      ],
    },
    downloads_count: 95,
    rating: 4.8,
    review_count: 15,
    status: "published",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    seller_id: "a0000000-0000-4000-8000-000000000004",
    seller_name: "Cô Lê Hoàng Yến",
    seller_tier: "free",
    title: "Đề Ôn Tập Sinh Học 12 - Cơ Chế Di Truyền & Biến Dị Cấp Tế Bào",
    subject: "Sinh học",
    grade: 12,
    description: "Bộ 20 câu hỏi trọng tâm ôn tập thi giữa kỳ I bám sát chương trình sách giáo khoa mới (Kết nối tri thức, Chân trời sáng tạo, Cánh diều).",
    price_credits: 0,
    question_count: 20,
    tags: ["Sinh học 12", "Di truyền", "Giữa kỳ I", "SGK Mới", "Miễn phí"],
    preview_data: {
      matrix: {
        total_questions: 20,
        multiple_choice_count: 12,
        true_false_count: 4,
        short_answer_count: 4,
        difficulty_distribution: { easy: 8, medium: 8, hard: 4, very_hard: 0 },
        duration_minutes: 45,
      },
      sample_questions: [
        {
          id: "q-sinh-1",
          order: 1,
          type: "multiple_choice",
          content: "Bộ ba mã mở đầu trên phân tử mARN ở sinh vật nhân thực mã hóa cho axit amin nào sau đây?",
          options: ["A. Valin", "B. Metionin", "C. Fometionin", "D. Alanin"],
          difficulty: "easy",
        },
      ],
    },
    exam_data: {
      questions: [
        {
          id: "q-sinh-1",
          order: 1,
          type: "multiple_choice",
          content: "Bộ ba mã mở đầu trên phân tử mARN ở sinh vật nhân thực mã hóa cho axit amin nào sau đây?",
          options: ["A. Valin", "B. Metionin", "C. Fometionin", "D. Alanin"],
          difficulty: "easy",
          correct_answer: "B",
          explanation: "Ở sinh vật nhân thực, bộ ba mở đầu 5'-AUG-3' mã hóa cho axit amin Metionin (Met).",
        },
      ],
    },
    downloads_count: 215,
    rating: 4.7,
    review_count: 29,
    status: "published",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

// ========================================================
// GLOBAL IN-MEMORY PERSISTENCE FOR MARKETPLACE
// ========================================================

declare global {
  // eslint-disable-next-line no-var
  var __marketplaceItems: Map<string, MarketplaceItem> | undefined;
  // eslint-disable-next-line no-var
  var __marketplacePurchases: MarketplacePurchase[] | undefined;
  // eslint-disable-next-line no-var
  var __payoutRequests: PayoutRequest[] | undefined;
}

if (!globalThis.__marketplaceItems || globalThis.__marketplaceItems.size === 0) {
  globalThis.__marketplaceItems = new Map();
  for (const item of INITIAL_MARKETPLACE_ITEMS) {
    globalThis.__marketplaceItems.set(item.id, item);
  }
} else {
  // Đảm bảo các curated items luôn có mặt
  for (const item of INITIAL_MARKETPLACE_ITEMS) {
    if (!globalThis.__marketplaceItems.has(item.id)) {
      globalThis.__marketplaceItems.set(item.id, item);
    }
  }
}

if (!globalThis.__marketplacePurchases) {
  globalThis.__marketplacePurchases = [];
}

if (!globalThis.__payoutRequests) {
  globalThis.__payoutRequests = [];
}

export const marketplaceItemsStore = globalThis.__marketplaceItems!;
export const marketplacePurchasesStore = globalThis.__marketplacePurchases!;
export const payoutRequestsStore = globalThis.__payoutRequests!;
