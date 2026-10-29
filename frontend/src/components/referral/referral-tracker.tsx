"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams?.get("ref");
    if (ref) {
      const cleanRef = ref.trim().toUpperCase();
      try {
        localStorage.setItem("eduteach_referral_code", cleanRef);
        // Lưu cookie trong 30 ngày để server route (như auth/callback) có thể đọc
        document.cookie = `eduteach_referral_code=${cleanRef}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (err) {
        console.warn("Save referral code error:", err);
      }
    }
  }, [searchParams]);

  return null;
}

