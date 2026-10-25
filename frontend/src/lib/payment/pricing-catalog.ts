/**
 * Bảng giá chính thức của EdTeach - Server-Side Source of Truth
 * Ngăn chặn tuyệt đối lỗ hổng Thao túng giá (Price Tampering)
 */

export interface PricingPackage {
  id: string;
  name: string;
  amount: number;
  credits: number;
  isPro: boolean;
}

export const PRICING_PACKAGES: Record<string, PricingPackage> = {
  pro_monthly: {
    id: "pro_monthly",
    name: "Gói Giáo Viên PRO",
    amount: 99000,
    credits: 500,
    isPro: true,
  },
  credits_50: {
    id: "credits_50",
    name: "Gói 50 Credits",
    amount: 49000,
    credits: 50,
    isPro: false,
  },
  credits_100: {
    id: "credits_100",
    name: "Gói 100 Credits",
    amount: 89000,
    credits: 100,
    isPro: false,
  },
  credits_200: {
    id: "credits_200",
    name: "Gói 200 Credits",
    amount: 159000,
    credits: 200,
    isPro: false,
  },
  credits_500: {
    id: "credits_500",
    name: "Gói 500 Credits",
    amount: 349000,
    credits: 500,
    isPro: false,
  },
};

/**
 * Xác thực và tìm gói nạp hợp lệ dựa trên amount và credits hoặc packageId
 */
export function validateAndResolvePackage(params: {
  packageId?: string;
  amount?: number;
  credits?: number;
  isPro?: boolean;
}): PricingPackage | null {
  const { packageId, amount, credits, isPro } = params;

  if (packageId && PRICING_PACKAGES[packageId]) {
    return PRICING_PACKAGES[packageId];
  }

  // Đối chiếu chặt chẽ theo amount và credits với bảng giá chuẩn
  for (const pkg of Object.values(PRICING_PACKAGES)) {
    if (pkg.amount === amount && pkg.credits === credits) {
      if (isPro !== undefined && pkg.isPro !== isPro) {
        continue;
      }
      return pkg;
    }
  }

  return null;
}
