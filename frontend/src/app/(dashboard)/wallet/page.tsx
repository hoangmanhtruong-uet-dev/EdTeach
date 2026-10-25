"use client";

import { useEffect, useState } from "react";
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Clock, CreditCard, Gift, Loader2 } from "lucide-react";
import { getUserWallet, getWalletTransactions, Wallet, WalletTxn } from "@/lib/api/wallet";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";

const pricingPlans = [
  { credits: 50, price: "49.000đ", amount: 49000, perCredit: "980đ", popular: false },
  { credits: 100, price: "89.000đ", amount: 89000, perCredit: "890đ", popular: true },
  { credits: 200, price: "159.000đ", amount: 159000, perCredit: "795đ", popular: false },
  { credits: 500, price: "349.000đ", amount: 349000, perCredit: "698đ", popular: false },
];

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
  }, []);

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
      <h1 className="text-2xl font-bold">Ví Credits</h1>

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
              <p className="text-2xl font-bold text-green-600">Hoạt động</p>
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
              <div className="py-8 text-center text-sm text-muted-foreground">
                Chưa có giao dịch nào
              </div>
            ) : (
              txns.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4">
                  <div
                    className={`rounded-lg p-2 ${
                      tx.amount < 0
                        ? "bg-red-100 dark:bg-red-950/40"
                        : tx.type === "purchase"
                        ? "bg-green-100 dark:bg-green-950/40"
                        : "bg-purple-100 dark:bg-purple-950/40"
                    }`}
                  >
                    {tx.amount < 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    ) : tx.type === "purchase" ? (
                      <CreditCard className="h-4 w-4 text-green-600" />
                    ) : (
                      <Gift className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tx.description || "Giao dịch"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        tx.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString()} credits
                    </p>
                    <p className="text-xs text-muted-foreground">Mã: {tx.id.slice(0, 8)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top-up plans */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Nạp Credits</h2>
            <div className="space-y-3">
              {pricingPlans.map((plan, idx) => {
                const isSelected = selectedPlanIndex === idx;
                return (
                  <button
                    key={plan.credits}
                    onClick={() => setSelectedPlanIndex(idx)}
                    className={`relative w-full rounded-lg border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                        : "border-border hover:bg-muted/60"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                        Phổ biến
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{plan.credits} credits</p>
                        <p className="text-xs text-muted-foreground">{plan.perCredit}/credit</p>
                      </div>
                      <p className="text-lg font-bold text-primary">{plan.price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Nạp ngay qua VietQR ({pricingPlans[selectedPlanIndex].price})
            </button>
          </div>
        </div>
      </div>

      {/* VietQR / SePay Checkout Modal */}
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