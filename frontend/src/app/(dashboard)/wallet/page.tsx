"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { getUserWallet, getWalletTransactions, Wallet, WalletTxn } from "@/lib/api/wallet";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { useAuth } from "@/context/auth-context";

const proPlan = {
  name: "Gói Giáo Viên PRO",
  price: "99.000đ",
  amount: 99000,
  credits: 30000,
  period: "/tháng",
  isPro: true,
};

const pricingPlans = [
  { credits: 50, price: "49.000đ", amount: 49000, perCredit: "980đ", popular: false, isPro: false },
  { credits: 100, price: "89.000đ", amount: 89000, perCredit: "890đ", popular: true, isPro: false },
  { credits: 200, price: "159.000đ", amount: 159000, perCredit: "795đ", popular: false, isPro: false },
  { credits: 500, price: "349.000đ", amount: 349000, perCredit: "698đ", popular: false, isPro: false },
];

function WalletContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");
  const creditsParam = searchParams.get("credits");
  const tierParam = searchParams.get("tier");
  const planParam = searchParams.get("plan");

  const { profile, refreshProfile, refreshWallet } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<any>(pricingPlans[1]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentStatus === "PAID");

  const isProUser = profile?.tier === "pro" || profile?.tier === "school";

  async function loadData() {
    try {
      const [w, t] = await Promise.all([
        getUserWallet(),
        getWalletTransactions(20, 0),
      ]);
      setWallet(w);
      setTxns(t.transactions);
      await refreshProfile();
    } catch (err) {
      console.error("Failed to load wallet data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    if (paymentStatus === "PAID") {
      setShowSuccessBanner(true);
      setTimeout(() => {
        loadData();
        refreshProfile();
      }, 2000);
    }
  }, [paymentStatus]);

  // Nếu user truy cập từ nút nâng cấp ?plan=pro, mở ngay modal checkout PRO
  useEffect(() => {
    if (planParam === "pro" && !isProUser) {
      setCheckoutTargetPlan(proPlan);
      setIsCheckoutOpen(true);
    }
  }, [planParam, isProUser]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;

  return (
    <div className="space-y-6">
      {/* Banner PayOS thanh toán thành công */}
      {showSuccessBanner && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {tierParam === "pro"
                  ? "Thanh toán thành công! Chúc mừng bạn đã lên Gói PRO Giáo Viên."
                  : "Thanh toán PayOS thành công!"}
              </p>
              <p className="text-xs text-emerald-700">
                {tierParam === "pro"
                  ? "Toàn bộ 54+ Phòng Thí Nghiệm 3D độc quyền và +30.000 credits soạn đề AI đã được kích hoạt cho tài khoản của bạn."
                  : `Giao dịch đã được xác nhận. ${creditsParam ? `+${creditsParam} Credits` : "Credits"} đã được cộng vào ví của bạn.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-xs font-semibold px-2 py-1 rounded-md bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ví Credits & Gói Dịch Vụ</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý số dư, nâng cấp Gói PRO và nạp credits tự động qua cổng PayOS / VietQR 24/7
          </p>
        </div>
      </div>

      {/* Balance & Tier cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <WalletIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
              <p className="text-2xl font-bold">{balance.toLocaleString()} credits</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2.5 ${isProUser ? "bg-amber-100" : "bg-slate-100"}`}>
              <Sparkles className={`h-5 w-5 ${isProUser ? "text-amber-600" : "text-slate-500"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hạng tài khoản</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${isProUser ? "text-amber-600" : "text-slate-700"}`}>
                  {isProUser ? "GÓI PRO" : "GÓI FREE"}
                </p>
                {isProUser && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    VIP
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cổng thanh toán</p>
              <p className="text-2xl font-bold text-green-600">PayOS 24/7</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transaction history */}
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="font-semibold">Lịch sử giao dịch</h2>
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <Clock className="h-4 w-4" /> Xem tất cả
            </button>
          </div>
          <div className="divide-y divide-border">
            {txns.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Chưa có giao dịch nào</p>
            ) : (
              txns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        txn.amount < 0
                          ? "bg-red-50 text-red-600 dark:bg-red-950/50"
                          : "bg-green-50 text-green-600 dark:bg-green-950/50"
                      }`}
                    >
                      {txn.amount < 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{txn.description || txn.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold ${
                      txn.amount < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {txn.amount < 0 ? `${txn.amount}` : `+${txn.amount}`} credits
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pricing plans & PRO Package */}
        <div className="space-y-4">
          {/* Card GÓI PRO NÂNG CẤP */}
          <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-sm relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gói Khuyên Dùng
              </span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                {proPlan.period}
              </span>
            </div>

            <h3 className="text-xl font-bold text-neutral-900">{proPlan.name}</h3>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-600">{proPlan.price}</span>
              <span className="text-xs text-neutral-500">/tháng</span>
            </div>

            <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
              Mở khóa toàn bộ học liệu 3D và tối đa sức mạnh AI soạn đề bám sát chuẩn Bộ GD&ĐT 2025.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-neutral-700 border-t border-amber-200/60 pt-3">
              <li className="flex items-center gap-2 font-semibold text-neutral-900">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cộng thêm <strong>+30.000 Credits</strong> soạn đề AI vào ví</span>
              </li>
              <li className="flex items-center gap-2 font-semibold text-neutral-900">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mở khóa toàn bộ <strong>54+ Phòng Thí Nghiệm 3D</strong> (Lý, Hóa, Sinh, Địa)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đủ soạn ~60 đề AI Tiêu chuẩn hoặc ~20 đề AI Chuyên sâu</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chấm trắc nghiệm OMR & Mobile Scanner không giới hạn</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tải file Word (.docx) & PDF chuẩn Bộ GD&ĐT không giới hạn</span>
              </li>
            </ul>

            <button
              onClick={() => {
                setCheckoutTargetPlan(proPlan);
                setIsCheckoutOpen(true);
              }}
              disabled={isProUser}
              className={`mt-5 flex w-full items-center justify-center rounded-xl py-3 text-xs font-bold transition shadow-sm cursor-pointer ${
                isProUser
                  ? "bg-emerald-600 text-white opacity-80 cursor-default"
                  : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20"
              }`}
            >
              <Sparkles className="mr-1.5 inline h-4 w-4" />
              {isProUser ? "Bạn đang sử dụng Gói PRO" : "Nâng cấp Gói PRO ngay (99.000đ)"}
            </button>
          </div>

          {/* Gói nạp Credits lẻ */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Hoặc Nạp Thêm Credits Lẻ</h2>
            <div className="space-y-2.5">
              {pricingPlans.map((plan, idx) => {
                const isSelected = selectedPlanIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedPlanIndex(idx);
                      setCheckoutTargetPlan(plan);
                    }}
                    className={`relative rounded-xl border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                        Phổ biến
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{plan.credits} Credits</p>
                        <p className="text-[11px] text-muted-foreground">{plan.perCredit}/credit</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{plan.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setCheckoutTargetPlan(pricingPlans[selectedPlanIndex]);
                setIsCheckoutOpen(true);
              }}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="mr-1.5 inline h-4 w-4" />
              Nạp {pricingPlans[selectedPlanIndex].credits} Credits ({pricingPlans[selectedPlanIndex].price})
            </button>
          </div>
        </div>
      </div>

      {/* PayOS / VietQR Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={checkoutTargetPlan}
        onSuccess={(newBal) => {
          setWallet((prev) => (prev ? { ...prev, balance: newBal } : prev));
          loadData();
          refreshProfile();
        }}
      />
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
