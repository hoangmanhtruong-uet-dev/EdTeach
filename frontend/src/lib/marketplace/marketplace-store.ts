import { MarketplaceItem, MarketplacePurchase, PayoutRequest } from "@/types/marketplace";

// ========================================================
// MARKETPLACE STORE (Không lưu mock test giả, chỉ lưu đề thật do giáo viên đăng tải)
// ========================================================

export const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [];

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

if (!globalThis.__marketplaceItems) {
  globalThis.__marketplaceItems = new Map();
} else {
  // Xóa sạch toàn bộ mock test cũ nếu có trong bộ nhớ dev server
  const mockPrefixes = ["mk-toan-", "mk-anh-", "mk-ly-", "mk-hoa-", "mk-van-"];
  for (const key of Array.from(globalThis.__marketplaceItems.keys())) {
    if (mockPrefixes.some((p) => key.startsWith(p))) {
      globalThis.__marketplaceItems.delete(key);
    }
  }
}

if (!globalThis.__marketplacePurchases) {
  globalThis.__marketplacePurchases = [];
}

if (!globalThis.__payoutRequests) {
  globalThis.__payoutRequests = [];
} else {
  // Xóa sạch dummy request cũ của seller giả
  globalThis.__payoutRequests = globalThis.__payoutRequests.filter(
    (r) => r.user_id !== "seller-tran-nam"
  );
}

export const marketplaceItemsStore = globalThis.__marketplaceItems!;
export const marketplacePurchasesStore = globalThis.__marketplacePurchases!;
export const payoutRequestsStore = globalThis.__payoutRequests!;
