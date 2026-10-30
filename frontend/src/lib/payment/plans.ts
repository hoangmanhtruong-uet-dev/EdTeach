export interface PricingPlan {
  id: string;
  name: string;
  tier: "free" | "pro" | "max";
  price: string;
  amount: number;
  credits: number;
  period: string;
  billingCycle: "monthly" | "semester";
  badge?: string;
  popular?: boolean;
  features: string[];
  description: string;
}

export const PRO_MONTHLY: PricingPlan = {
  id: "pro_monthly",
  name: "Gói Giáo Viên PRO",
  tier: "pro",
  price: "149.000đ",
  amount: 149000,
  credits: 30000,
  period: "/tháng",
  billingCycle: "monthly",
  badge: "Khuyên dùng cho GV",
  popular: true,
  description: "Dành cho Giáo viên trường THCS / THPT đứng lớp tiêu chuẩn",
  features: [
    "Cộng +30.000 Credits/tháng vào ví",
    "Mở khóa toàn bộ 64+ Phòng Thí Nghiệm 3D & Bảng trắng tương tác",
    "Xuất file Word (.docx) & PDF sạch 100% (Không dính watermark của web)",
    "Trộn tối đa 4 mã đề chuẩn GDPT 2025 (kèm Barem ma trận đặc tả)",
    "Chấm trắc nghiệm OMR & lưu lịch sử theo từng lớp",
    "Xuất bảng điểm Excel & Thống kê 'Top câu hỏi cả lớp sai nhiều nhất'",
  ],
};

export const PRO_SEMESTER: PricingPlan = {
  id: "pro_semester",
  name: "Gói PRO Học Kỳ (5 Tháng)",
  tier: "pro",
  price: "599.000đ",
  amount: 599000,
  credits: 150000,
  period: "/học kỳ (5 tháng)",
  billingCycle: "semester",
  badge: "Tiết kiệm 20%",
  popular: true,
  description: "Đồng hành xuyên suốt một học kỳ thi cử trọn vẹn",
  features: [
    "Toàn bộ đặc quyền của Gói Giáo Viên PRO",
    "Cộng +150.000 Credits vào ví (30.000/tháng x 5 tháng)",
    "Tiết kiệm ngay 146.000đ so với gia hạn từng tháng",
    "Không lo hết lượt giữa các đợt thi Giữa kỳ và Cuối kỳ",
  ],
};

export const MAX_MONTHLY: PricingPlan = {
  id: "max_monthly",
  name: "Gói Luyện Thi MAX",
  tier: "max",
  price: "229.000đ",
  amount: 229000,
  credits: 100000,
  period: "/tháng",
  billingCycle: "monthly",
  badge: "Vũ khí Luyện thi VIP",
  description: "Dành cho Giáo viên Luyện thi / Dạy thêm chuyên nghiệp / Trung tâm",
  features: [
    "Bao gồm toàn bộ quyền lợi của Gói PRO",
    "Cộng +100.000 Credits/tháng (Ưu tiên AI DeepSeek-R1 suy luận sâu)",
    "Tải lên PDF/Ảnh đề cũ -> AI bóc tách & 'Nhân bản đề tương tự'",
    "Trộn đề công nghiệp: Trộn từ 8 đến 12 mã đề thi độc lập",
    "Đóng dấu Watermark thương hiệu riêng của Giáo viên / Lớp học chống lộ đề",
    "Giao đề Online qua Magic Link / QR: Học sinh làm trực tuyến tự chấm",
    "Tạo phiếu nhận xét cá nhân hóa từng học sinh bằng AI gửi Zalo phụ huynh",
    "Đặc quyền Chợ đề thi: Giảm 50% credit mua đề VIP & Phí sàn chỉ 5%",
  ],
};

export const MAX_SEMESTER: PricingPlan = {
  id: "max_semester",
  name: "Gói MAX Học Kỳ (5 Tháng)",
  tier: "max",
  price: "899.000đ",
  amount: 899000,
  credits: 500000,
  period: "/học kỳ (5 tháng)",
  billingCycle: "semester",
  badge: "Tiết kiệm 246.000đ",
  description: "Giải pháp tối thượng cho cả mùa ôn thi tuyển sinh & đại học",
  features: [
    "Toàn bộ đặc quyền của Gói Luyện Thi MAX",
    "Cộng +500.000 Credits khổng lồ vào ví",
    "Tiết kiệm 246.000đ so với thanh toán từng tháng",
    "Ưu tiên xử lý AI tốc độ cao trong các giờ cao điểm mùa thi",
  ],
};

export const CREDIT_PACKS = [
  { credits: 50, price: "49.000đ", amount: 49000, perCredit: "980đ", popular: false, isPro: false },
  { credits: 100, price: "89.000đ", amount: 89000, perCredit: "890đ", popular: true, isPro: false },
  { credits: 200, price: "159.000đ", amount: 159000, perCredit: "795đ", popular: false, isPro: false },
  { credits: 500, price: "349.000đ", amount: 349000, perCredit: "698đ", popular: false, isPro: false },
];

// ==============================================================================
// CHẾ ĐỘ THỬ NGHIỆM BETA: Mở khóa 100% tất cả tính năng sư phạm cao cấp
// (Bục Giảng Số 4.0, Bảng trắng không giới hạn, 54+ Phòng TN 3D, Trộn đề ma trận GDPT 2025,
// Xuất Word kép, Magic Link) cho mọi Thầy/Cô trải nghiệm.
// Riêng các tính năng tiêu tốn API token (Soạn đề AI, Sinh câu tương tự, Giải đa cách)
// được bảo vệ và kiểm soát qua số dư Credits (mỗi thành viên mới có sẵn 5.000 credits).
// ==============================================================================
export const IS_BETA_ALL_FEATURES_UNLOCKED = true;

/**
 * Kiểm tra xem người dùng có thực sự nạp tiền / đăng ký gói trả phí hay không
 * Dùng để phân luồng API Key:
 * - isRealPayingUser = true  -> Gọi GEMINI_API_KEY_PAID (Hạ tầng 2.000 RPM, bảo mật cao cấp)
 * - isRealPayingUser = false -> Gọi GEMINI_API_KEY_FREE (Hạ tầng Free tier, dùng 5.000 credits thử nghiệm)
 */
export function isRealPayingUser(profile: any): boolean {
  if (!profile) return false;
  const email = (profile.email || profile.user_metadata?.email || "").toLowerCase();
  const id = profile.id;
  if (
    email === "truongcri0101@gmail.com" ||
    email.includes("truongcri0101") ||
    id === "84493d6a-4eff-42af-bf7d-0da914f96e39"
  ) {
    return true;
  }
  return (
    profile.tier === "pro" ||
    profile.tier === "max" ||
    profile.tier === "school" ||
    (profile as any).subscription_tier === "pro" ||
    (profile as any).subscription_tier === "max" ||
    profile.preferences?.subscription_tier === "pro" ||
    profile.preferences?.subscription_tier === "max" ||
    (profile as any).user_metadata?.subscription_tier === "pro" ||
    (profile as any).user_metadata?.subscription_tier === "max"
  );
}

export function isMaxUser(profile: any): boolean {
  if (IS_BETA_ALL_FEATURES_UNLOCKED) return true;
  return isRealPayingUser(profile);
}

export function isProUser(profile: any): boolean {
  if (IS_BETA_ALL_FEATURES_UNLOCKED) return true;
  return isRealPayingUser(profile);
}

export function getTierName(profile: any): string {
  if (isRealPayingUser(profile)) {
    const email = (profile?.email || profile?.user_metadata?.email || "").toLowerCase();
    if (
      email === "truongcri0101@gmail.com" ||
      profile?.tier === "max" ||
      (profile as any)?.subscription_tier === "max"
    ) {
      return "GÓI LUYỆN THI MAX VIP";
    }
    return "GÓI GIÁO VIÊN PRO";
  }
  if (IS_BETA_ALL_FEATURES_UNLOCKED) return "BETA VIP (MỞ TOÀN BỘ TÍNH NĂNG)";
  if (isMaxUser(profile)) return "GÓI LUYỆN THI MAX";
  if (isProUser(profile)) return "GÓI GIÁO VIÊN PRO";
  return "GÓI MIỄN PHÍ";
}
