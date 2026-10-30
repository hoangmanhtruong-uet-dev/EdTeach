"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Store,
  Search,
  Filter,
  Download,
  Star,
  BookOpen,
  Eye,
  Sparkles,
  Award,
  Globe,
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  ExternalLink,
  PlusCircle,
  Coins,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Building,
  CreditCard,
  UserCheck,
  Layers,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { MarketplaceItem } from "@/types/marketplace";
import { exportMarketplaceExamToDocx } from "@/lib/marketplace/export-docx";
import { getUserExams, Exam } from "@/lib/api/exams";

export default function MarketplacePage() {
  const router = useRouter();
  const { user, profile, wallet, refreshWallet } = useAuth();

  // State danh sách
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all"); // 'all' | 'free' | 'paid'
  const [activeTab, setActiveTab] = useState<"all" | "hot" | "purchased" | "my_listings">("all");

  // State Modal Xem Trước (Preview)
  const [previewItem, setPreviewItem] = useState<MarketplaceItem | null>(null);
  const [previewTab, setPreviewTab] = useState<"matrix" | "questions">("questions");

  // State Modal Mua Đề (Purchase)
  const [buyingItem, setBuyingItem] = useState<MarketplaceItem | null>(null);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccessItem, setBuySuccessItem] = useState<MarketplaceItem | null>(null);

  // State Modal Đăng Bán Đề (Sell Exam)
  const [showSellModal, setShowSellModal] = useState(false);
  const [userExams, setUserExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [sellTitle, setSellTitle] = useState("");
  const [sellSubject, setSellSubject] = useState("Toán");
  const [sellGrade, setSellGrade] = useState("12");
  const [sellPrice, setSellPrice] = useState(100);
  const [sellDescription, setSellDescription] = useState("");
  const [isSubmittingSell, setIsSubmittingSell] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);

  // State Modal Quản lý Rút tiền (Payout)
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutStats, setPayoutStats] = useState<any | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState(2000);
  const [bankName, setBankName] = useState("MB Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // State Modal Cào Web
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<any | null>(null);

  // State Download Word & Clone Studio
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);

  // Load danh sách items
  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketplace/items");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Lỗi tải chợ đề thi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Load kho đề của giáo viên khi mở modal đăng bán
  const handleOpenSellModal = async () => {
    setShowSellModal(true);
    setSellError(null);
    try {
      const res = await getUserExams(50);
      setUserExams(res.exams || []);
    } catch (err) {
      console.warn("Không thể tải danh sách đề của bạn:", err);
    }
  };

  // Load thông tin Payout
  const handleOpenPayoutModal = async () => {
    setShowPayoutModal(true);
    setPayoutMessage(null);
    setPayoutError(null);
    try {
      const res = await fetch("/api/marketplace/payout");
      const data = await res.json();
      if (data.success) {
        setPayoutStats(data.stats);
        setPayoutHistory(data.requests || []);
      }
    } catch (err) {
      console.warn("Lỗi tải thông tin payout:", err);
    }
  };

  // Xử lý gửi yêu cầu rút tiền
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutMessage(null);

    if (payoutAmount < 2000) {
      setPayoutError("Hạn mức rút tối thiểu là 2.000 credits (tương đương 200.000 VNĐ).");
      return;
    }

    try {
      setIsSubmittingPayout(true);
      const res = await fetch("/api/marketplace/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_credits: payoutAmount,
          bank_name: bankName,
          account_number: accountNumber,
          account_holder: accountHolder,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPayoutError(data.error || "Không thể gửi yêu cầu rút tiền.");
        return;
      }

      setPayoutMessage(data.message);
      refreshWallet();
      // Reload stats
      const statsRes = await fetch("/api/marketplace/payout");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setPayoutStats(statsData.stats);
        setPayoutHistory(statsData.requests || []);
      }
    } catch (err: any) {
      setPayoutError("Lỗi kết nối: " + err.message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Xử lý đăng bán đề mới
  const handleSubmitSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellError(null);

    if (!sellTitle.trim()) {
      setSellError("Vui lòng nhập tiêu đề đề thi.");
      return;
    }

    try {
      setIsSubmittingSell(true);
      const res = await fetch("/api/marketplace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sellTitle,
          subject: sellSubject,
          grade: sellGrade,
          price_credits: sellPrice,
          description: sellDescription,
          exam_id: selectedExamId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSellError(data.error || "Không thể đăng đề thi.");
        return;
      }

      setShowSellModal(false);
      setSellTitle("");
      setSellDescription("");
      loadItems();
      alert("🎉 Chúc mừng Thầy/Cô đã đăng bán đề thi thành công lên Sàn!");
    } catch (err: any) {
      setSellError("Lỗi kết nối: " + err.message);
    } finally {
      setIsSubmittingSell(false);
    }
  };

  // Xử lý Mua đề thi
  const handleConfirmBuy = async () => {
    if (!buyingItem) return;
    try {
      setIsProcessingBuy(true);
      setBuyError(null);

      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: buyingItem.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setBuyError(data.error || "Giao dịch không thành công.");
        return;
      }

      // Mua thành công
      refreshWallet();
      setBuySuccessItem(data.item);
      setBuyingItem(null);
      loadItems();
    } catch (err: any) {
      setBuyError("Lỗi giao dịch: " + err.message);
    } finally {
      setIsProcessingBuy(false);
    }
  };

  // Xử lý Sao chép vào Studio
  const handleCloneToStudio = async (item: MarketplaceItem) => {
    try {
      setCloningId(item.id);
      const res = await fetch("/api/marketplace/clone-to-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert("Lỗi sao chép: " + (data.error || "Vui lòng thử lại"));
        return;
      }

      // Điều hướng ngay sang Studio chỉnh sửa
      router.push(`/exams/${data.exam_id}`);
    } catch (err: any) {
      alert("Lỗi kết nối: " + err.message);
    } finally {
      setCloningId(null);
    }
  };

  // Tải Word docx
  const handleDownloadDocx = async (item: MarketplaceItem) => {
    try {
      setDownloadingId(item.id);

      // Nếu chưa có exam_data đầy đủ, gọi API lấy chi tiết
      let targetItem = item;
      if (!item.exam_data) {
        const res = await fetch(`/api/marketplace/items/${item.id}`);
        const data = await res.json();
        if (data.success && data.item) {
          targetItem = data.item;
        }
      }

      await exportMarketplaceExamToDocx(targetItem);
    } catch (err: any) {
      alert("Lỗi tải file Word: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // Bóc tách đề từ web
  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      setImportError("Vui lòng nhập đường link bài viết hoặc đề thi.");
      return;
    }

    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(null);

      const res = await fetch("/api/exams/import-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportError(data.error || "Không thể bóc tách đề từ liên kết này.");
        return;
      }

      setImportSuccess(data);
    } catch (err: any) {
      setImportError("Lỗi kết nối: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Lọc danh sách items hiển thị
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSubject = selectedSubject === "all" || item.subject === selectedSubject;
      const matchGrade = selectedGrade === "all" || item.grade.toString() === selectedGrade;
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.seller_name.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      let matchPrice = true;
      if (priceFilter === "free") matchPrice = item.price_credits === 0;
      if (priceFilter === "paid") matchPrice = item.price_credits > 0;

      let matchTab = true;
      if (activeTab === "hot") matchTab = item.downloads_count >= 200 || item.rating >= 4.9;
      if (activeTab === "purchased") matchTab = !!item.is_purchased;
      if (activeTab === "my_listings") matchTab = !!item.is_owner;

      return matchSubject && matchGrade && matchSearch && matchPrice && matchTab;
    });
  }, [items, selectedSubject, selectedGrade, search, priceFilter, activeTab]);

  const userBalance = wallet?.balance ?? 0;
  const isProUser = (profile as any)?.subscription_tier === "pro";

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & VÍ DOANH THU & ACTION BUTTONS */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">Chợ Đề Thi Giáo Viên</h1>
            <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Bản Quyền 2025
            </span>
          </div>
          <p className="text-xs text-blue-100/80 leading-relaxed">
            Sàn thương mại điện tử chuyên biệt cho giáo viên. Tải đề thi chuẩn ma trận Bộ GD&ĐT 2025,
            xuất file Word (.docx) kèm lời giải hoặc sao chép thẳng vào Studio để chỉnh sửa.
          </p>
        </div>

        {/* Nút hành động chính */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Badge Số dư ví */}
          <Link
            href="/wallet"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition text-xs font-semibold backdrop-blur-md"
            title="Nhấp để nạp thêm credits"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span>
              Ví: <strong className="text-amber-300">{userBalance.toLocaleString("vi-VN")}</strong> cr
            </span>
            <span className="text-[10px] text-blue-200">
              (~{(userBalance * 100).toLocaleString("vi-VN")}đ)
            </span>
          </Link>

          {/* Nút Rút tiền & Doanh thu */}
          <button
            onClick={handleOpenPayoutModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Ví Bán Đề & Rút Tiền</span>
          </button>

          {/* Nút Đăng bán đề mới */}
          <button
            onClick={handleOpenSellModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Đăng Bán Đề Thi</span>
          </button>

          {/* Nút Nhập link đề từ web */}
          <button
            onClick={() => {
              setShowImportModal(true);
              setImportError(null);
              setImportSuccess(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 text-xs font-medium border border-white/10 transition cursor-pointer"
            title="Tự động bóc tách từ VnDoc, VietJack, Thuvienhoclieu..."
          >
            <Globe className="w-3.5 h-3.5 text-cyan-300" />
            <span>Cào link web</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CHÍNH SÁCH HOA HỒNG SÀN (KÍCH CẦU PRO) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-border flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">Bản quyền & Chuẩn Ma Trận 2025</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              100% đề thi có cấu trúc Phần I, II, III và lời giải chi tiết từng bước.
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Hoa hồng sàn ưu đãi: PRO nhận 90%</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                PRO 10%
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Tài khoản PRO chiết khấu chỉ 10%. Tài khoản Thường chiết khấu 20%.
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">Rút tiền về VietQR 24/7</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Quy đổi 1 Credit = 100 VNĐ. Rút tiền tự động về mọi ngân hàng từ 200.000đ.
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABS & FILTER BAR */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-2xs space-y-3">
        {/* Hàng Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "all"
                  ? "bg-neutral-900 text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Tất cả đề ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("hot")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeTab === "hot"
                  ? "bg-amber-500 text-neutral-950 font-black"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>Đề nổi bật ⭐</span>
            </button>
            <button
              onClick={() => setActiveTab("purchased")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeTab === "purchased"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đề tôi đã mua</span>
            </button>
            <button
              onClick={() => setActiveTab("my_listings")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeTab === "my_listings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Đề của tôi đang bán</span>
            </button>
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Hiển thị <strong>{filteredItems.length}</strong> đề thi
          </div>
        </div>

        {/* Hàng Filters & Search */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên đề, giáo viên, chuyên đề..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Môn */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs border border-border rounded-xl px-3 py-2 bg-white text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Tất cả môn học</option>
              <option value="Toán">Toán học</option>
              <option value="Vật lí">Vật lí</option>
              <option value="Hóa học">Hóa học</option>
              <option value="Sinh học">Sinh học</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Ngữ văn">Ngữ văn</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Địa lí">Địa lí</option>
            </select>

            {/* Filter Khối Lớp */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="text-xs border border-border rounded-xl px-3 py-2 bg-white text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Tất cả khối lớp</option>
              <option value="12">Lớp 12 (Ôn thi tốt nghiệp)</option>
              <option value="11">Lớp 11</option>
              <option value="10">Lớp 10</option>
              <option value="9">Lớp 9 (Luyện thi vào 10)</option>
            </select>

            {/* Filter Mức giá */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="text-xs border border-border rounded-xl px-3 py-2 bg-white text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Tất cả mức giá</option>
              <option value="free">Miễn phí (0 cr)</option>
              <option value="paid">Có phí (&gt; 0 cr)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. DANH SÁCH CARD ĐỀ THI */}
      {/* ========================================================= */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Đang tải danh sách đề thi...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isOwnedOrPurchased = item.is_purchased || item.is_owner || item.price_credits === 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Subject, Grade, Rating */}
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px]">
                        {item.subject} • Lớp {item.grade}
                      </span>
                      {item.seller_tier === "pro" && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Award className="w-3 h-3 text-amber-600" />
                          PRO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{item.rating}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({item.downloads_count} lượt tải)
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-foreground text-sm mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3.5">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Author & Exam Meta */}
                  <div className="text-xs text-muted-foreground mb-4 pb-3 border-b border-border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1">
                        <span>{item.seller_name}</span>
                        {item.is_owner && (
                          <span className="text-[10px] text-blue-600 font-bold">(Đề của bạn)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Giáo viên xác thực</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground text-xs">
                        {item.question_count} câu hỏi
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Có giải chi tiết</div>
                    </div>
                  </div>
                </div>

                {/* Footer Price & Buttons */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div>
                    {item.price_credits === 0 ? (
                      <span className="text-emerald-600 font-black text-sm">Miễn phí</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-primary">
                          {item.price_credits}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          cr (~{(item.price_credits * 100).toLocaleString("vi-VN")}đ)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center gap-1.5">
                    {isOwnedOrPurchased ? (
                      <>
                        <button
                          onClick={() => handleCloneToStudio(item)}
                          disabled={cloningId === item.id}
                          className="px-2.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Sao chép vào Studio của tôi để chỉnh sửa"
                        >
                          {cloningId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          <span>Mở Studio</span>
                        </button>

                        <button
                          onClick={() => handleDownloadDocx(item)}
                          disabled={downloadingId === item.id}
                          className="px-2.5 py-1.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground font-semibold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                          title="Tải file Word (.docx) kèm ma trận & lời giải"
                        >
                          {downloadingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Word</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPreviewItem(item);
                            setPreviewTab("questions");
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Xem thử</span>
                        </button>

                        <button
                          onClick={() => {
                            setBuyingItem(item);
                            setBuyError(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Mua đề</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center max-w-xl mx-auto shadow-2xs">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">
            Không tìm thấy đề thi phù hợp
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Thầy/Cô hãy thử tìm từ khóa khác hoặc đăng tải bộ đề đầu tiên lên Sàn để kiếm thu nhập!
          </p>
          <button
            onClick={handleOpenSellModal}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng bán đề ngay</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL XEM TRƯỚC ĐỀ THI (PREVIEW MODAL) */}
      {/* ========================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-border relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Modal */}
            <div className="mb-4 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px]">
                  {previewItem.subject} - Lớp {previewItem.grade}
                </span>
                <span className="text-xs text-muted-foreground">
                  Tác giả: <strong>{previewItem.seller_name}</strong>
                </span>
              </div>
              <h2 className="text-lg font-black text-foreground">{previewItem.title}</h2>
            </div>

            {/* Tabs Preview */}
            <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
              <button
                onClick={() => setPreviewTab("questions")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  previewTab === "questions"
                    ? "bg-neutral-900 text-white"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Câu hỏi xem trước (3-5 câu)
              </button>
              <button
                onClick={() => setPreviewTab("matrix")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  previewTab === "matrix"
                    ? "bg-neutral-900 text-white"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Ma trận đề thi chuẩn 2025
              </button>
            </div>

            {/* Nội dung Preview */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {previewTab === "questions" ? (
                <div className="space-y-4">
                  {previewItem.preview_data.sample_questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>Câu {q.order || idx + 1}:</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed whitespace-pre-line">{q.content}</p>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-border text-[11px]"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Banner Khóa Bản Quyền */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-amber-950 text-sm">
                      Mở khóa toàn bộ {previewItem.question_count} câu hỏi & lời giải chi tiết
                    </div>
                    <p className="text-[11px] text-amber-900/80 max-w-md mx-auto">
                      Đáp án chính xác 100%, lời giải từng bước, file Word chuẩn Bộ GD&ĐT và quyền sao chép
                      chỉnh sửa trong Studio.
                    </p>
                  </div>
                </div>
              ) : (
                /* Tab Ma trận */
                <div className="space-y-4">
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-border space-y-3">
                    <h4 className="font-bold text-foreground">Cấu trúc câu hỏi định dạng 2025:</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-3 rounded-xl border border-border">
                        <div className="text-lg font-black text-primary">
                          {previewItem.preview_data.matrix.multiple_choice_count}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Phần I: 4 Lựa chọn
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-border">
                        <div className="text-lg font-black text-amber-600">
                          {previewItem.preview_data.matrix.true_false_count}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Phần II: Đúng / Sai
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-border">
                        <div className="text-lg font-black text-emerald-600">
                          {previewItem.preview_data.matrix.short_answer_count}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Phần III: Trả lời ngắn
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-2xl p-4 border border-border space-y-3">
                    <h4 className="font-bold text-foreground">Phân bổ mức độ nhận thức:</h4>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="bg-white p-2.5 rounded-xl border border-border">
                        <div className="font-bold text-foreground">Nhận biết</div>
                        <div className="text-sm font-black text-blue-600 mt-1">
                          {previewItem.preview_data.matrix.difficulty_distribution.easy} câu
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-border">
                        <div className="font-bold text-foreground">Thông hiểu</div>
                        <div className="text-sm font-black text-indigo-600 mt-1">
                          {previewItem.preview_data.matrix.difficulty_distribution.medium} câu
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-border">
                        <div className="font-bold text-foreground">Vận dụng</div>
                        <div className="text-sm font-black text-amber-600 mt-1">
                          {previewItem.preview_data.matrix.difficulty_distribution.hard} câu
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-border">
                        <div className="font-bold text-foreground">Vận dụng cao</div>
                        <div className="text-sm font-black text-rose-600 mt-1">
                          {previewItem.preview_data.matrix.difficulty_distribution.very_hard} câu
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Giá bộ đề:</span>
                <div className="text-base font-black text-primary">
                  {previewItem.price_credits === 0
                    ? "Miễn phí"
                    : `${previewItem.price_credits} credits (~${(previewItem.price_credits * 100).toLocaleString("vi-VN")}đ)`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-neutral-50"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    const item = previewItem;
                    setPreviewItem(null);
                    setBuyingItem(item);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Coins className="w-4 h-4" />
                  <span>Mua đề ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL XÁC NHẬN MUA ĐỀ (PURCHASE MODAL) */}
      {/* ========================================================= */}
      {buyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border relative">
            <button
              onClick={() => setBuyingItem(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Xác nhận mở khóa đề thi</h3>
                <p className="text-xs text-muted-foreground">Thanh toán an toàn bằng Credits ví</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-border mb-4 space-y-2 text-xs">
              <div className="font-bold text-foreground text-sm line-clamp-2">{buyingItem.title}</div>
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-border">
                <span>Tác giả:</span>
                <strong className="text-foreground">{buyingItem.seller_name}</strong>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Số câu hỏi:</span>
                <strong className="text-foreground">{buyingItem.question_count} câu</strong>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Giá mở khóa:</span>
                <strong className="text-primary font-bold">
                  {buyingItem.price_credits} credits (~{(buyingItem.price_credits * 100).toLocaleString("vi-VN")}đ)
                </strong>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Số dư ví hiện tại:</span>
                <strong className="text-foreground">{userBalance.toLocaleString("vi-VN")} credits</strong>
              </div>
            </div>

            {buyError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{buyError}</p>
                  <Link
                    href="/wallet"
                    className="inline-flex items-center gap-1 font-bold underline mt-1.5 text-rose-800"
                  >
                    <span>Nạp thêm Credits qua VietQR ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuyingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-neutral-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={isProcessingBuy}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessingBuy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận trừ {buyingItem.price_credits} cr</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL SAU KHI MUA THÀNH CÔNG */}
      {/* ========================================================= */}
      {buySuccessItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-foreground">Mở khóa thành công!</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Bộ đề <strong>{buySuccessItem.title}</strong> đã được thêm vào thư viện sở hữu của Thầy/Cô.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleCloneToStudio(buySuccessItem)}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Sao chép & Mở chỉnh sửa trong Studio</span>
              </button>

              <button
                onClick={() => handleDownloadDocx(buySuccessItem)}
                className="w-full py-2.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Tải file Word (.docx) kèm lời giải</span>
              </button>

              <button
                onClick={() => setBuySuccessItem(null)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                Tiếp tục xem các đề khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MODAL ĐĂNG BÁN ĐỀ THI (SELL EXAM MODAL) */}
      {/* ========================================================= */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowSellModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Đăng bán đề thi lên Sàn</h3>
                <p className="text-xs text-muted-foreground">Kiếm thu nhập thụ động từ bộ đề độc quyền của bạn</p>
              </div>
            </div>

            <form onSubmit={handleSubmitSell} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Chọn đề từ kho */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Chọn đề từ "Kho đề thi của tôi" (hoặc nhập mới bên dưới)
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedExamId(id);
                    const found = userExams.find((ex) => ex.id === id);
                    if (found) {
                      setSellTitle(found.name);
                      setSellSubject(found.subject || "Toán");
                      setSellGrade(found.grade || "12");
                    }
                  }}
                  className="w-full text-xs p-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Nhập tiêu đề tùy ý --</option>
                  {userExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.subject} - Lớp {ex.grade})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu đề đề thi */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Tiêu đề đề thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sellTitle}
                  onChange={(e) => setSellTitle(e.target.value)}
                  placeholder="Ví dụ: Đề thi thử Tốt nghiệp THPT 2025 môn Toán - Đề số 02"
                  className="w-full text-xs p-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Môn học */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">Môn học</label>
                  <select
                    value={sellSubject}
                    onChange={(e) => setSellSubject(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Vật lí">Vật lí</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lí">Địa lí</option>
                  </select>
                </div>

                {/* Khối lớp */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">Khối lớp</label>
                  <select
                    value={sellGrade}
                    onChange={(e) => setSellGrade(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="12">Lớp 12</option>
                    <option value="11">Lớp 11</option>
                    <option value="10">Lớp 10</option>
                    <option value="9">Lớp 9</option>
                  </select>
                </div>
              </div>

              {/* Giá bán Credits */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Giá bán (Credits) <span className="text-muted-foreground font-normal">(1 cr = 100 VNĐ)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-40 text-xs p-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-bold text-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    = {(sellPrice * 100).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
              </div>

              {/* Box Tính Toán Lợi Nhuận Bán Hàng */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-border space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center justify-between">
                  <span>Ước tính thu nhập mỗi lượt tải:</span>
                  <span className="text-emerald-600 font-black">
                    +{Math.round(sellPrice * (isProUser ? 0.9 : 0.8))} credits (~
                    {(Math.round(sellPrice * (isProUser ? 0.9 : 0.8)) * 100).toLocaleString("vi-VN")}đ)
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <p>• Loại tài khoản: <strong>{isProUser ? "Gói PRO (Hưởng 90% doanh thu)" : "Gói Thường (Hưởng 80% doanh thu)"}</strong></p>
                  <p>• Phí vận hành sàn: <strong>{isProUser ? "10%" : "20%"}</strong></p>
                  {!isProUser && (
                    <p className="text-amber-700 font-medium pt-1">
                      💡 Mẹo: Nâng cấp tài khoản PRO để giảm phí sàn còn 10% và nhận 90% doanh thu trọn đời!
                    </p>
                  )}
                </div>
              </div>

              {/* Mô tả đề thi */}
              <div>
                <label className="block font-semibold text-foreground mb-1">Mô tả tóm tắt bộ đề</label>
                <textarea
                  rows={3}
                  value={sellDescription}
                  onChange={(e) => setSellDescription(e.target.value)}
                  placeholder="Điểm nổi bật của đề, mức độ phân hóa, có lời giải chi tiết..."
                  className="w-full text-xs p-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {sellError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {sellError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingSell}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingSell ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đăng bán lên Sàn...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Đăng Bán Ngay Lên Chợ</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MODAL VÍ BÁN ĐỀ & RÚT TIỀN (PAYOUT MODAL) */}
      {/* ========================================================= */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Doanh Thu Bán Đề & Rút Tiền</h3>
                <p className="text-xs text-muted-foreground">Rút tiền về tài khoản ngân hàng qua VietQR 24/7</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Thống kê doanh thu */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-neutral-50 p-3 rounded-2xl border border-border text-center">
                  <div className="text-base font-black text-emerald-600">
                    {(payoutStats?.total_earned_credits ?? 0).toLocaleString("vi-VN")} cr
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Tổng kiếm được</div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-2xl border border-border text-center">
                  <div className="text-base font-black text-foreground">
                    {payoutStats?.total_sales ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Lượt bán thành công</div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-2xl border border-border text-center">
                  <div className="text-base font-black text-primary">
                    {userBalance.toLocaleString("vi-VN")} cr
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Số dư khả dụng</div>
                </div>
              </div>

              {/* Form Yêu Cầu Rút Tiền */}
              <form onSubmit={handleSubmitPayout} className="space-y-3 p-4 rounded-2xl bg-neutral-50 border border-border">
                <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Tạo lệnh rút tiền về ngân hàng</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Số Credits muốn rút (Tối thiểu 2.000 cr = 200.000đ)
                  </label>
                  <input
                    type="number"
                    min="2000"
                    step="500"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs p-2 border border-border rounded-xl bg-white font-bold text-foreground"
                    required
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Quy đổi thực nhận:{" "}
                    <strong className="text-emerald-700 font-bold">
                      {(payoutAmount * 100).toLocaleString("vi-VN")} VNĐ
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Ngân hàng thụ hưởng
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full text-xs p-2 border border-border rounded-xl bg-white"
                    >
                      <option value="MB Bank">MB Bank (Quân Đội)</option>
                      <option value="Techcombank">Techcombank</option>
                      <option value="Vietcombank">Vietcombank</option>
                      <option value="Vietinbank">Vietinbank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="ACB">ACB</option>
                      <option value="TPBank">TPBank</option>
                      <option value="VPBank">VPBank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Số tài khoản ngân hàng
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0987654321..."
                      className="w-full text-xs p-2 border border-border rounded-xl bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Tên chủ tài khoản (viết hoa không dấu)
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                    className="w-full text-xs p-2 border border-border rounded-xl bg-white uppercase font-bold"
                    required
                  />
                </div>

                {payoutError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                    {payoutError}
                  </div>
                )}

                {payoutMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                    {payoutMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPayout ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi yêu cầu...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Gửi Yêu Cầu Rút {(payoutAmount * 100).toLocaleString("vi-VN")}đ</span>
                    </>
                  )}
                </button>
              </form>

              {/* Lịch sử rút tiền gần nhất */}
              <div>
                <h4 className="font-bold text-foreground text-xs mb-2">Lịch sử rút tiền gần đây</h4>
                {payoutHistory.length > 0 ? (
                  <div className="space-y-2">
                    {payoutHistory.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl border border-border bg-white flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <div className="font-bold text-foreground">
                            {req.amount_vnd.toLocaleString("vi-VN")} VNĐ ({req.amount_credits} cr)
                          </div>
                          <div className="text-muted-foreground text-[10px]">
                            {req.bank_name} • {req.account_number} ({req.account_holder})
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            req.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {req.status === "completed" ? "Đã chuyển tiền" : "Đang xử lý"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-[11px]">
                    Thầy/Cô chưa có lệnh rút tiền nào.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. MODAL NHẬP LINK ĐỀ THI TỪ WEB GIÁO DỤC (AI CÀO & BÓC TÁCH) */}
      {/* ========================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border relative">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Bóc tách đề thi từ trang web giáo dục
              </h3>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Dán đường link từ các trang chia sẻ tài liệu (VnDoc, VietJack, Thuvienhoclieu, Hoc247...).
              AI sẽ tự động đọc câu hỏi, đáp án và lưu thẳng vào kho đề của bạn.
            </p>

            {importSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm mb-1 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã bóc tách thành công {importSuccess.questionCount} câu hỏi!</span>
                  </div>
                  <p className="mt-1">
                    Đề thi: <strong>{importSuccess.examName}</strong> ({importSuccess.subject} - Lớp{" "}
                    {importSuccess.grade}) đã được lưu vào danh sách đề thi của bạn.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/exams/${importSuccess.examId}`}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở chỉnh sửa trong Studio</span>
                  </Link>

                  <button
                    onClick={() => {
                      setImportSuccess(null);
                      setImportUrl("");
                    }}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Nhập link khác
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Đường dẫn bài viết chứa đề thi
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://thuvienhoclieu.com/de-thi-giua-ki-1-toan-12..."
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    />
                  </div>
                </div>

                {importError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {importError}
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                  💡 <strong>Gợi ý:</strong> Bạn có thể copy link bất kỳ bài tập, đề kiểm tra hoặc ngân
                  hàng câu hỏi nào trên internet để AI chuyển đổi tự động sang định dạng EdTeach.
                </div>

                <button
                  type="button"
                  onClick={handleImportFromUrl}
                  disabled={isImporting}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI đang đọc trang web & bóc tách câu hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Bóc tách & Tải về kho đề của tôi</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
