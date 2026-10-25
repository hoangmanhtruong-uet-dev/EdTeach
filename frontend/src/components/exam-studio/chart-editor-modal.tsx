"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Plus, Trash2, Check, BarChart3, LineChart, PieChart } from "lucide-react";

export interface ChartDataItem {
  id: string;
  label: string;
  value: number;
  color?: string;
}

export interface ChartConfigData {
  chartType: "bar" | "line" | "pie";
  title: string;
  yUnit?: string;
  xUnit?: string;
  items: ChartDataItem[];
  width: number;
  height: number;
}

interface ChartEditorModalProps {
  isOpen: boolean;
  initialData?: ChartConfigData | null;
  onClose: () => void;
  onSave: (data: ChartConfigData) => void;
}

const DEFAULT_BAR_CHART: ChartConfigData = {
  chartType: "bar",
  title: "BIỂU ĐỒ TẦN SỐ ĐIỂM SỐ HỌC KỲ I",
  yUnit: "Số học sinh",
  xUnit: "Điểm",
  items: [
    { id: "1", label: "Điểm 6", value: 12, color: "#3b82f6" },
    { id: "2", label: "Điểm 7", value: 24, color: "#3b82f6" },
    { id: "3", label: "Điểm 8", value: 28, color: "#3b82f6" },
    { id: "4", label: "Điểm 9", value: 16, color: "#3b82f6" },
    { id: "5", label: "Điểm 10", value: 8, color: "#3b82f6" },
  ],
  width: 360,
  height: 220,
};

const DEFAULT_LINE_CHART: ChartConfigData = {
  chartType: "line",
  title: "XU HƯỚNG SẢN LƯỢNG QUA CÁC THÁNG",
  yUnit: "Tấn",
  xUnit: "Tháng",
  items: [
    { id: "1", label: "T1", value: 20, color: "#2563eb" },
    { id: "2", label: "T2", value: 35, color: "#2563eb" },
    { id: "3", label: "T3", value: 48, color: "#2563eb" },
    { id: "4", label: "T4", value: 42, color: "#2563eb" },
    { id: "5", label: "T5", value: 65, color: "#2563eb" },
  ],
  width: 360,
  height: 220,
};

const DEFAULT_PIE_CHART: ChartConfigData = {
  chartType: "pie",
  title: "CƠ CẤU THÀNH PHẦN XUẤT KHẨU (%)",
  yUnit: "%",
  items: [
    { id: "1", label: "Nông sản", value: 40, color: "#3b82f6" },
    { id: "2", label: "Thủy sản", value: 25, color: "#10b981" },
    { id: "3", label: "Khoáng sản", value: 20, color: "#f59e0b" },
    { id: "4", label: "Dịch vụ khác", value: 15, color: "#8b5cf6" },
  ],
  width: 360,
  height: 220,
};

const COLOR_PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export function ChartEditorModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: ChartEditorModalProps) {
  const [data, setData] = useState<ChartConfigData>(initialData || DEFAULT_BAR_CHART);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSelectType = (type: "bar" | "line" | "pie") => {
    if (type === "bar") {
      setData({ ...DEFAULT_BAR_CHART, title: data.title || DEFAULT_BAR_CHART.title });
    } else if (type === "line") {
      setData({ ...DEFAULT_LINE_CHART, title: data.title || DEFAULT_LINE_CHART.title });
    } else {
      setData({ ...DEFAULT_PIE_CHART, title: data.title || DEFAULT_PIE_CHART.title });
    }
  };

  const handleAddItem = () => {
    const newItem: ChartDataItem = {
      id: "it-" + Date.now(),
      label: `Mục ${data.items.length + 1}`,
      value: 10,
      color: COLOR_PALETTE[data.items.length % COLOR_PALETTE.length],
    };
    setData({ ...data, items: [...data.items, newItem] });
  };

  const handleRemoveItem = (id: string) => {
    if (data.items.length <= 2) return;
    setData({ ...data, items: data.items.filter((it) => it.id !== id) });
  };

  const handleUpdateItem = (id: string, updates: Partial<ChartDataItem>) => {
    setData({
      ...data,
      items: data.items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Bộ soạn thảo biểu đồ thống kê</h3>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              Biểu đồ SVG
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live SVG Chart Preview */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center justify-center overflow-x-auto min-h-[220px]">
          <div className="rounded-lg border-2 border-blue-500 bg-white p-3 shadow-sm">
            <ChartSvgRenderer data={data} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Xem trước trực quan biểu đồ SVG theo số liệu thực</p>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          {/* Chart Type Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Dạng biểu đồ
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectType("bar")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 font-medium transition ${
                  data.chartType === "bar"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Biểu đồ Cột</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType("line")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 font-medium transition ${
                  data.chartType === "line"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <LineChart className="h-4 w-4" />
                <span>Biểu đồ Đường</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType("pie")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 font-medium transition ${
                  data.chartType === "pie"
                    ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <PieChart className="h-4 w-4" />
                <span>Biểu đồ Tròn (%)</span>
              </button>
            </div>
          </div>

          {/* Chart Title & Units */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Tiêu đề biểu đồ
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="Nhập tiêu đề: BIỂU ĐỒ TẦN SỐ ĐIỂM SỐ..."
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {data.chartType !== "pie" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Đơn vị trục tung (Y)</label>
                  <input
                    type="text"
                    value={data.yUnit || ""}
                    onChange={(e) => setData({ ...data, yUnit: e.target.value })}
                    placeholder="học sinh, %, tấn..."
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Đơn vị trục hoành (X)</label>
                  <input
                    type="text"
                    value={data.xUnit || ""}
                    onChange={(e) => setData({ ...data, xUnit: e.target.value })}
                    placeholder="Điểm, Năm, Nhóm..."
                    className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Data Items Table */}
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Bảng số liệu ({data.items.length} mục)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
              >
                <Plus className="h-3 w-3" /> Thêm cột/mục
              </button>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {data.items.map((it, idx) => (
                <div
                  key={it.id}
                  className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50/50 p-1.5"
                >
                  <span className="w-5 text-center font-bold text-slate-400 text-[11px]">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={it.label}
                    onChange={(e) => handleUpdateItem(it.id, { label: e.target.value })}
                    placeholder="Tên mục..."
                    className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    value={it.value}
                    onChange={(e) => handleUpdateItem(it.id, { value: parseFloat(e.target.value) || 0 })}
                    placeholder="Giá trị..."
                    className="w-20 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-center font-mono font-semibold"
                  />
                  <input
                    type="color"
                    value={it.color || "#3b82f6"}
                    onChange={(e) => handleUpdateItem(it.id, { color: e.target.value })}
                    title="Chọn màu"
                    className="h-7 w-7 rounded cursor-pointer border border-slate-300 bg-white p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.id)}
                    disabled={data.items.length <= 2}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(data);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Check className="h-4 w-4" /> Chèn vào đề thi
          </button>
        </div>
      </div>
    </div>
  );
}

// Dynamic SVG Chart Renderer
export function ChartSvgRenderer({ data }: { data: ChartConfigData }) {
  const w = data.width || 360;
  const h = data.height || 220;

  // 1. Bar Chart
  if (data.chartType === "bar") {
    const padL = 45;
    const padR = 25;
    const padT = 38;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxVal = Math.max(...data.items.map((i) => i.value), 10);
    const yTicks = [0, Math.round(maxVal / 2), maxVal];
    const barWidth = Math.max(16, Math.min(36, (plotW / data.items.length) * 0.6));
    const stepX = plotW / data.items.length;

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-sans select-none">
        {/* Title */}
        <text x={w / 2} y={20} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle">
          {data.title}
        </text>

        {/* Axes */}
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#334155" strokeWidth="1.5" />
        <line x1={padL} y1={padT + plotH} x2={padL} y2={padT} stroke="#334155" strokeWidth="1.5" />

        {/* Grid & Y Labels */}
        {yTicks.map((yv) => {
          const sy = padT + plotH - (yv / maxVal) * plotH;
          return (
            <g key={yv}>
              <line x1={padL} y1={sy} x2={padL + plotW} y2={sy} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padL - 6} y={sy + 3.5} fontSize="10" fill="#64748b" textAnchor="end">
                {yv}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.items.map((it, idx) => {
          const barH = (it.value / maxVal) * plotH;
          const bx = padL + idx * stepX + (stepX - barWidth) / 2;
          const by = padT + plotH - barH;

          return (
            <g key={it.id}>
              <rect x={bx} y={by} width={barWidth} height={barH} fill={it.color || "#3b82f6"} rx="2" />
              <text x={bx + barWidth / 2} y={by - 4} fontSize="10" fontWeight="bold" fill="#1e293b" textAnchor="middle">
                {it.value}
              </text>
              <text x={bx + barWidth / 2} y={padT + plotH + 16} fontSize="10" fill="#334155" textAnchor="middle">
                {it.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 2. Line Chart
  if (data.chartType === "line") {
    const padL = 45;
    const padR = 25;
    const padT = 38;
    const padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxVal = Math.max(...data.items.map((i) => i.value), 10);
    const stepX = plotW / Math.max(1, data.items.length - 1);

    const points = data.items.map((it, idx) => {
      const px = padL + idx * stepX;
      const py = padT + plotH - (it.value / maxVal) * plotH;
      return { px, py, it };
    });

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.px} ${p.py}`).join(" ");

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-sans select-none">
        <text x={w / 2} y={20} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle">
          {data.title}
        </text>

        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#334155" strokeWidth="1.5" />
        <line x1={padL} y1={padT + plotH} x2={padL} y2={padT} stroke="#334155" strokeWidth="1.5" />

        {/* Line curve */}
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" />

        {/* Dots & Labels */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.px} cy={p.py} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
            <text x={p.px} y={p.py - 6} fontSize="10" fontWeight="bold" fill="#1e293b" textAnchor="middle">
              {p.it.value}
            </text>
            <text x={p.px} y={padT + plotH + 16} fontSize="10" fill="#334155" textAnchor="middle">
              {p.it.label}
            </text>
          </g>
        ))}
      </svg>
    );
  }

  // 3. Pie Chart
  const totalVal = data.items.reduce((s, it) => s + it.value, 0) || 100;
  const cx = w * 0.38;
  const cy = h / 2 + 10;
  const r = 65;

  let currentAngle = -Math.PI / 2;
  const slices = data.items.map((it) => {
    const sliceAngle = (it.value / totalVal) * 2 * Math.PI;
    const startA = currentAngle;
    const endA = currentAngle + sliceAngle;
    currentAngle = endA;

    const x1 = cx + r * Math.cos(startA);
    const y1 = cy + r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA);
    const y2 = cy + r * Math.sin(endA);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const pct = Math.round((it.value / totalVal) * 100);

    return { pathData, it, pct };
  });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-sans select-none">
      <text x={w / 2} y={20} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle">
        {data.title}
      </text>

      {/* Slices */}
      {slices.map((s, idx) => (
        <path key={idx} d={s.pathData} fill={s.it.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]} stroke="#ffffff" strokeWidth="1.5" />
      ))}

      {/* Legend on Right */}
      <g transform={`translate(${w * 0.68}, 45)`}>
        {slices.map((s, idx) => (
          <g key={idx} transform={`translate(0, ${idx * 22})`}>
            <rect x="0" y="0" width="10" height="10" rx="2" fill={s.it.color || COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
            <text x="16" y="9" fontSize="10" fill="#334155">
              {s.it.label} ({s.pct}%)
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
