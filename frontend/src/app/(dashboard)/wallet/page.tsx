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
} from "lucide-react";
import { getUserWallet, getWalletTransactions, Wallet, WalletTxn } from "@/lib/api/wallet";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";

const pricingPlans = [
  { credits: 50, price: "49.000đ", amount: 49000, perCredit: "980đ", popular: false },
  { credits: 100, price: "89.000đ", amount: 89000, perCredit: "890đ", popular: true },
  { credits: 200, price: "159.000đ", amount: 159000, perCredit: "795đ", popular: false },
  { credits: 500, price: "349.000đ", amount: 349000, perCredit: "698đ", popular: false },
];

function WalletContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("status");
  const creditsParam = searchParams.get("credits");

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentStatus === "PAID");

  async function loadData() {
    try {
      const [w, t] = await Promise.all([
        getUserWallet(),
        getWalletTransactions(20, 0),
      ]);
      setWallet(w);
      setTxns(t.transactions);
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
      // Re-fetch after 2 seconds to make sure webhook completed
      setTimeout(loadData, 2000);
    }
  }, [paymentStatus]);

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
              <p className="font-bold text-sm">Thanh toán PayOS thành công!</p>
              <p className="text-xs text-emerald-700">
                Giao dịch đã được xác nhận. {creditsParam ? `+${creditsParam} Credits` : "Credits"} đã được cộng vào ví của bạn.
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
          <h1 className="text-2xl font-bold">Ví Credits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý số dư và nạp credits tự động qua cổng PayOS / VietQR
          </p>
        </div>
      </div>

      {/* Balance cards */}
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
            <div className="rounded-lg bg-red-100 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng số giao dịch</p>
              <p className="text-2xl font-bold">{txns.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2.5">
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái ví</p>
              <p className="text-2xl font-bold text-green-600">Hoạt động (PayOS 24/7)</p>
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

        {/* Pricing plans */}
        <div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Nạp Credits</h2>
            <div className="space-y-3">
              {pricingPlans.map((plan, idx) => {
                const isSelected = selectedPlanIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPlanIndex(idx)}
                    className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Phổ biến nhất
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-base">{plan.credits} Credits</p>
                        <p className="text-xs text-muted-foreground">{plan.perCredit}/credit</p>
                      </div>
                      <span className="text-lg font-bold text-primary">{plan.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Nạp ngay qua PayOS ({pricingPlans[selectedPlanIndex].price})
            </button>
          </div>
        </div>
      </div>

      {/* PayOS / VietQR Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={pricingPlans[selectedPlanIndex]}
        onSuccess={(newBal) => {
          setWallet((prev) => (prev ? { ...prev, balance: newBal } : prev));
          loadData();
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
