"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
  QrCode,
  AlertCircle,
  Zap,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface PaymentOrder {
  id: string;
  order_code: string;
  amount: number;
  credits: number;
  status: string;
  bank_id: string;
  account_no: string;
  account_name: string;
  qr_url: string;
  created_at: string;
}

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: {
    credits: number;
    price: string;
    amount: number;
  } | null;
  onSuccess: (newBalance: number) => void;
}

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  selectedPlan,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const { refreshWallet } = useAuth();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Polling ref to avoid stale closure
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Khởi tạo đơn hàng khi mở modal
  useEffect(() => {
    if (!isOpen || !selectedPlan) {
      setOrder(null);
      setIsPaid(false);
      setError(null);
      stopPolling();
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsPaid(false);

    async function createOrder() {
      try {
        const res = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: selectedPlan!.amount,
            credits: selectedPlan!.credits,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Không thể khởi tạo đơn nạp tiền.");
        }

        if (isMounted) {
          setOrder(data.order);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Lỗi kết nối.");
          setLoading(false);
        }
      }
    }

    createOrder();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [isOpen, selectedPlan, stopPolling]);

  // Polling kiểm tra trạng thái thanh toán từ SePay
  useEffect(() => {
    if (!order || isPaid) return;

    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payment/check-status?order_code=${order.order_code}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            setIsPaid(true);
            setNewBalance(data.current_balance);
            stopPolling();
            refreshWallet();
            onSuccess(data.current_balance);
          }
        }
      } catch (e) {
        // silent fail on network blips
      }
    }, 2500);

    return () => {
      stopPolling();
    };
  }, [order, isPaid, onSuccess, refreshWallet, stopPolling]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Mock test thanh toán
  const handleMockPay = async () => {
    if (!order || isSimulating) return;
    setIsSimulating(true);
    try {
      const res = await fetch("/api/payment/mock-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_code: order.order_code }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsPaid(true);
        setNewBalance(data.new_balance);
        stopPolling();
        refreshWallet();
        onSuccess(data.new_balance);
      } else {
        alert(data.error || "Lỗi giả lập thanh toán.");
      }
    } catch (err: any) {
      alert("Lỗi kết nối khi giả lập: " + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Thanh toán VietQR Tự động</h2>
              <p className="text-xs text-muted-foreground">
                Tự động cộng Credits ngay sau khi ngân hàng khớp lệnh
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopPolling();
              onClose();
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[80vh] overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Đang tạo mã VietQR theo đơn hàng...</p>
              <p className="text-xs text-muted-foreground mt-1">Vui lòng chờ trong giây lát</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <p className="font-medium text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Đóng
              </button>
            </div>
          ) : isPaid ? (
            /* Success Screen */
            <div className="py-8 text-center animate-in zoom-in-95 duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/50 mb-4 shadow-sm">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                Thanh toán thành công!
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Đã cộng <strong className="text-foreground">+{order?.credits} Credits</strong> vào ví của Thầy/Cô.
              </p>
              {newBalance !== null && (
                <div className="mx-auto mt-4 max-w-xs rounded-xl bg-muted/60 p-3 border border-border">
                  <p className="text-xs text-muted-foreground">Số dư hiện tại:</p>
                  <p className="text-lg font-bold text-primary">{newBalance.toLocaleString()} credits</p>
                </div>
              )}
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    stopPolling();
                    onClose();
                  }}
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  Xong & Quay lại Ví
                </button>
              </div>
            </div>
          ) : (
            /* Payment QR Screen */
            <div className="space-y-5">
              {/* Package badge */}
              <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Gói đã chọn:</span>
                  <p className="font-bold text-foreground">
                    {order?.credits} Credits ({order?.amount.toLocaleString()}đ)
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Xử lý tự động 24/7
                </div>
              </div>

              {/* QR Code and Instructions */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-card border border-border p-4 rounded-xl">
                <div className="relative group flex flex-col items-center">
                  <div className="rounded-xl border-2 border-primary/20 p-2 bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order?.qr_url}
                      alt="VietQR Code"
                      className="h-44 w-44 object-contain rounded-lg"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Quét bằng App ngân hàng bất kỳ
                  </span>
                </div>

                {/* Account Details with 1-Click Copy */}
                <div className="flex-1 space-y-2.5 w-full text-xs">
                  <div>
                    <span className="text-muted-foreground">Ngân hàng thụ hưởng:</span>
                    <p className="font-semibold text-sm text-foreground uppercase">{order?.bank_id}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm bg-muted/50 px-2 py-1.5 rounded-lg border border-border">
                      <span>{order?.account_no}</span>
                      <button
                        onClick={() => handleCopy(order?.account_no || "", "acc")}
                        className="text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        {copiedField === "acc" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Tên người nhận:</span>
                    <p className="font-semibold text-sm text-foreground uppercase">{order?.account_name}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Số tiền:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm text-primary bg-primary/10 px-2 py-1.5 rounded-lg border border-primary/20">
                      <span>{order?.amount.toLocaleString()} đ</span>
                      <button
                        onClick={() => handleCopy(String(order?.amount || ""), "amt")}
                        className="text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        {copiedField === "amt" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Nội dung chuyển khoản (bắt buộc):</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1.5 rounded-lg border border-amber-500/30">
                      <span>{order?.order_code}</span>
                      <button
                        onClick={() => handleCopy(order?.order_code || "", "code")}
                        className="text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        {copiedField === "code" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Listening Radar */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </div>
                  <span className="text-muted-foreground">
                    Đang đợi hệ thống ngân hàng xác nhận giao dịch...
                  </span>
                </div>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>

              {/* Dev Mode Test Simulator Button */}
              <div className="pt-1 border-t border-dashed border-border flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  (Test Mode) Kiểm thử nạp ngay mà không cần chuyển thật:
                </span>
                <button
                  type="button"
                  onClick={handleMockPay}
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors disabled:opacity-50"
                >
                  {isSimulating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                  )}
                  ⚡ Giả lập Chuyển thành công
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
