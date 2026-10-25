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
  checkout_url?: string;
}

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: {
    credits: number;
    price: string;
    amount: number;
    isPro?: boolean;
    name?: string;
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
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  // Polling ref to avoid stale closure
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Khởi tạo đơn hàng qua cổng PayOS khi mở modal
  useEffect(() => {
    if (!isOpen || !selectedPlan) {
      setOrder(null);
      setCheckoutUrl(null);
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
        // Ưu tiên tạo qua cổng PayOS
        const resPayos = await fetch("/api/payment/payos/create-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: selectedPlan!.amount,
            credits: selectedPlan!.credits,
            isPro: selectedPlan!.isPro || false,
          }),
        });

        const dataPayos = await resPayos.json();

        if (resPayos.ok && dataPayos.success) {
          if (isMounted) {
            setCheckoutUrl(dataPayos.checkoutUrl);
            setOrder({
              id: "payos_" + dataPayos.orderCode,
              order_code: dataPayos.orderCode.toString(),
              amount: dataPayos.amount,
              credits: selectedPlan!.credits,
              status: "pending",
              bank_id: "PayOS",
              account_no: dataPayos.accountNumber,
              account_name: dataPayos.accountName,
              qr_url: dataPayos.qrCode,
              created_at: new Date().toISOString(),
              checkout_url: dataPayos.checkoutUrl,
            });
            setLoading(false);
          }
          return;
        }

        // Fallback sang API create-order chuẩn nếu PayOS chưa khả dụng
        const res = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: selectedPlan!.amount,
            credits: selectedPlan!.credits,
            isPro: selectedPlan!.isPro || false,
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
          setError(err.message || "Lỗi kết nối máy chủ thanh toán.");
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

  // Polling kiểm tra trạng thái thanh toán tự động
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
      } catch {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Thanh toán PayOS / VietQR Tự động
              </h2>
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
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Đang tạo mã thanh toán PayOS bảo mật...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-foreground">Khởi tạo giao dịch thất bại</h3>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              <button
                onClick={() => onClose()}
                className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                Đóng và thử lại
              </button>
            </div>
          ) : isPaid ? (
            /* Trạng thái thanh toán thành công */
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Nạp tiền thành công!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Đã cộng{" "}
                  <strong className="text-primary font-bold">
                    +{selectedPlan?.credits} Credits
                  </strong>{" "}
                  vào tài khoản của bạn.
                </p>
              </div>

              {newBalance !== null && (
                <div className="px-5 py-2.5 rounded-xl bg-muted/60 border border-border text-sm font-medium">
                  Số dư ví hiện tại:{" "}
                  <span className="font-bold text-foreground">
                    {newBalance.toLocaleString()} credits
                  </span>
                </div>
              )}

              <button
                onClick={() => {
                  stopPolling();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition cursor-pointer"
              >
                Hoàn tất & Tiếp tục sử dụng
              </button>
            </div>
          ) : (
            /* Trạng thái hiển thị mã VietQR & Link PayOS */
            <div className="space-y-4">
              {/* Plan info pill */}
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Gói đã chọn: </span>
                  <span className="font-bold text-foreground">
                    {selectedPlan?.credits} Credits ({selectedPlan?.price})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-primary font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Xử lý tự động 24/7</span>
                </div>
              </div>

              {/* QR and Transfer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* QR Image Box */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border bg-white shadow-xs">
                  <img
                    src={order?.qr_url}
                    alt="VietQR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                  <span className="text-[11px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Quét bằng App ngân hàng bất kỳ
                  </span>
                </div>

                {/* Account Details */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Ngân hàng thụ hưởng:</span>
                    <p className="font-bold text-foreground text-sm">{order?.bank_id}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border">
                      <span>{order?.account_no}</span>
                      <button
                        onClick={() => handleCopy(order?.account_no || "", "acc")}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === "acc" ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Tên người nhận:</span>
                    <p className="font-bold text-foreground uppercase">{order?.account_name}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Số tiền:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
                      <span>{order?.amount?.toLocaleString()} đ</span>
                      <button
                        onClick={() => handleCopy(order?.amount?.toString() || "", "amount")}
                        className="text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === "amount" ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Nội dung chuyển khoản (bắt buộc):</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1.5 rounded-lg border border-amber-500/30">
                      <span>{order?.order_code}</span>
                      <button
                        onClick={() => handleCopy(order?.order_code || "", "code")}
                        className="text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === "code" ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PayOS Direct Checkout Button */}
              {checkoutUrl && (
                <div className="pt-2">
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Mở trang thanh toán bảo mật PayOS (Đầy đủ ngân hàng)</span>
                  </a>
                </div>
              )}

              {/* Status Listening Radar */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    Đang đợi PayOS xác nhận giao dịch...
                  </span>
                </div>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
