"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Plus, Trash2, RotateCcw, Check } from "lucide-react";

export interface VariationMilestone {
  id: string;
  x: string;
  lineType: "single" | "double";
  leftY: string;
  rightY: string;
}

export interface VariationInterval {
  sign: "+" | "-" | "0";
}

export interface VariationTableData {
  formula: string;
  showYPrime: boolean;
  startX: string;
  startY: string;
  startYPos: "top" | "bottom";
  endX: string;
  endY: string;
  endYPos: "top" | "bottom";
  milestones: VariationMilestone[];
  intervals: VariationInterval[];
  width: number;
  heightY: number;
}

interface VariationTableModalProps {
  isOpen: boolean;
  initialData?: VariationTableData | null;
  onClose: () => void;
  onSave: (data: VariationTableData) => void;
}

// Preset samples (matching soandethi.com screenshot 1)
const PRESETS = [
  {
    name: "Bậc 3 có CĐ, CT",
    formula: "x^3 - 3x + 1",
    data: {
      formula: "x^3 - 3x + 1",
      showYPrime: true,
      startX: "-∞",
      startY: "-∞",
      startYPos: "bottom" as const,
      endX: "+∞",
      endY: "+∞",
      endYPos: "top" as const,
      milestones: [
        { id: "m1", x: "-1", lineType: "single" as const, leftY: "3", rightY: "3" },
        { id: "m2", x: "1", lineType: "single" as const, leftY: "-1", rightY: "-1" },
      ],
      intervals: [{ sign: "+" as const }, { sign: "-" as const }, { sign: "+" as const }],
      width: 440,
      heightY: 90,
    },
  },
  {
    name: "Bậc 3 nghịch biến",
    formula: "-x^3 - 3x",
    data: {
      formula: "-x^3 - 3x",
      showYPrime: true,
      startX: "-∞",
      startY: "+∞",
      startYPos: "top" as const,
      endX: "+∞",
      endY: "-∞",
      endYPos: "bottom" as const,
      milestones: [],
      intervals: [{ sign: "-" as const }],
      width: 400,
      heightY: 80,
    },
  },
  {
    name: "Bậc 4 trùng phương",
    formula: "x^4 - 2x^2 - 1",
    data: {
      formula: "x^4 - 2x^2 - 1",
      showYPrime: true,
      startX: "-∞",
      startY: "+∞",
      startYPos: "top" as const,
      endX: "+∞",
      endY: "+∞",
      endYPos: "top" as const,
      milestones: [
        { id: "m1", x: "-1", lineType: "single" as const, leftY: "-2", rightY: "-2" },
        { id: "m2", x: "0", lineType: "single" as const, leftY: "-1", rightY: "-1" },
        { id: "m3", x: "1", lineType: "single" as const, leftY: "-2", rightY: "-2" },
      ],
      intervals: [
        { sign: "-" as const },
        { sign: "+" as const },
        { sign: "-" as const },
        { sign: "+" as const },
      ],
      width: 480,
      heightY: 90,
    },
  },
  {
    name: "Parabol",
    formula: "x^2 - 2x",
    data: {
      formula: "x^2 - 2x",
      showYPrime: true,
      startX: "-∞",
      startY: "+∞",
      startYPos: "top" as const,
      endX: "+∞",
      endY: "+∞",
      endYPos: "top" as const,
      milestones: [
        { id: "m1", x: "1", lineType: "single" as const, leftY: "-1", rightY: "-1" },
      ],
      intervals: [{ sign: "-" as const }, { sign: "+" as const }],
      width: 400,
      heightY: 85,
    },
  },
  {
    name: "Phân thức bậc 1/1",
    formula: "(2x - 1)/(x - 1)",
    data: {
      formula: "(2x - 1)/(x - 1)",
      showYPrime: true,
      startX: "-∞",
      startY: "-2",
      startYPos: "bottom" as const,
      endX: "+∞",
      endY: "-2",
      endYPos: "top" as const,
      milestones: [
        { id: "m1", x: "1", lineType: "double" as const, leftY: "+∞", rightY: "-∞" },
      ],
      intervals: [{ sign: "+" as const }, { sign: "+" as const }],
      width: 440,
      heightY: 90,
    },
  },
  {
    name: "Phân thức bậc 2/1",
    formula: "(x^2 - x + 1)/(x - 1)",
    data: {
      formula: "(x^2 - x + 1)/(x - 1)",
      showYPrime: true,
      startX: "-∞",
      startY: "-∞",
      startYPos: "bottom" as const,
      endX: "+∞",
      endY: "+∞",
      endYPos: "top" as const,
      milestones: [
        { id: "m1", x: "0", lineType: "single" as const, leftY: "-1", rightY: "-1" },
        { id: "m2", x: "1", lineType: "double" as const, leftY: "-∞", rightY: "+∞" },
        { id: "m3", x: "2", lineType: "single" as const, leftY: "3", rightY: "3" },
      ],
      intervals: [
        { sign: "+" as const },
        { sign: "-" as const },
        { sign: "-" as const },
        { sign: "+" as const },
      ],
      width: 480,
      heightY: 95,
    },
  },
];

// Formula palette symbols
const QUICK_MATH = ["x^2", "x^n", "\\sqrt{x}", "\\frac{a}{b}", "+", "-", "=", "(x)"];

export function VariationTableModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: VariationTableModalProps) {
  const [data, setData] = useState<VariationTableData>(
    initialData || PRESETS[4].data // Default to Screenshot 1 & 2 format (Phân thức 1/1 with double line)
  );

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setData({
      ...preset.data,
      milestones: JSON.parse(JSON.stringify(preset.data.milestones)),
      intervals: JSON.parse(JSON.stringify(preset.data.intervals)),
    });
  };

  const handleAddMilestone = () => {
    const newM: VariationMilestone = {
      id: "m-" + Date.now(),
      x: "0",
      lineType: "single",
      leftY: "0",
      rightY: "0",
    };
    const nextMilestones = [...data.milestones, newM];
    // Recompute intervals: length should be milestones.length + 1
    const nextIntervals = Array.from({ length: nextMilestones.length + 1 }).map((_, i) =>
      data.intervals[i] || { sign: "+" }
    );
    setData({ ...data, milestones: nextMilestones, intervals: nextIntervals });
  };

  const handleRemoveMilestone = (idx: number) => {
    const nextMilestones = data.milestones.filter((_, i) => i !== idx);
    const nextIntervals = Array.from({ length: nextMilestones.length + 1 }).map((_, i) =>
      data.intervals[i] || { sign: "+" }
    );
    setData({ ...data, milestones: nextMilestones, intervals: nextIntervals });
  };

  const handleUpdateMilestone = (idx: number, updates: Partial<VariationMilestone>) => {
    const nextMilestones = [...data.milestones];
    nextMilestones[idx] = { ...nextMilestones[idx], ...updates };
    setData({ ...data, milestones: nextMilestones });
  };

  const handleUpdateIntervalSign = (idx: number, sign: "+" | "-" | "0") => {
    const nextIntervals = [...data.intervals];
    if (!nextIntervals[idx]) nextIntervals[idx] = { sign: "+" };
    nextIntervals[idx] = { ...nextIntervals[idx], sign };
    setData({ ...data, intervals: nextIntervals });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Bảng biến thiên</h3>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              Toán THPT
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live SVG Preview Box (Top matching Screenshot 1) */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center justify-center overflow-x-auto min-h-[160px]">
          <div className="rounded-lg border-2 border-blue-500 bg-white p-2 shadow-sm">
            <VariationTableRenderer data={data} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Xem trước trực quan bảng biến thiên sẽ chèn vào đề</p>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* Section 1: Vẽ bảng từ hàm số */}
          <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Vẽ bảng từ hàm số mẫu
              </span>
            </div>

            {/* Function input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={data.formula}
                onChange={(e) => setData({ ...data, formula: e.target.value })}
                placeholder="Nhập hàm số: x^3 - 3x + 1 hoặc (2x-1)/(x-1)"
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-md bg-slate-900 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Vẽ bảng
              </button>
            </div>

            {/* Preset quick buttons (Screenshot 1) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                    data.formula === p.formula
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Mốc x và chiều biến thiên (Screenshot 2) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Mốc x và chiều biến thiên ({data.milestones.length + 2} mốc)
              </span>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showYPrime}
                  onChange={(e) => setData({ ...data, showYPrime: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Hiện hàng y'</span>
              </label>
            </div>

            {/* 1. Mốc Đầu (Start) */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Đầu:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.startX}
                    onChange={(e) => setData({ ...data, startX: e.target.value })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 font-mono text-center text-xs"
                  />
                  <div className="flex gap-1">
                    {["-∞", "+∞"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setData({ ...data, startX: val })}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">y:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.startY}
                    onChange={(e) => setData({ ...data, startY: e.target.value })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 font-mono text-center text-xs"
                  />
                  <div className="flex gap-1">
                    {["-∞", "+∞"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setData({ ...data, startY: val })}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <select
                    value={data.startYPos}
                    onChange={(e) => setData({ ...data, startYPos: e.target.value as any })}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                  >
                    <option value="bottom">Dưới</option>
                    <option value="top">Trên</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Intervals and Milestones loop */}
            {data.milestones.map((m, mIdx) => (
              <React.Fragment key={m.id}>
                {/* Interval row */}
                <div className="flex items-center justify-between rounded bg-slate-100/70 px-3 py-1.5 text-[11px] text-slate-600">
                  <span>Khoảng {mIdx + 1}: y' mang dấu</span>
                  <div className="flex items-center gap-1.5">
                    {["+", "-", "0"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleUpdateIntervalSign(mIdx, s as any)}
                        className={`h-6 w-6 rounded border font-bold ${
                          data.intervals[mIdx]?.sign === s
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <span className="pl-1 italic text-slate-400">
                      {data.intervals[mIdx]?.sign === "+"
                        ? "↗ đồng biến"
                        : data.intervals[mIdx]?.sign === "-"
                        ? "↘ nghịch biến"
                        : "― không đổi"}
                    </span>
                  </div>
                </div>

                {/* Milestone Box */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Mốc {mIdx + 1}:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m.x}
                        onChange={(e) => handleUpdateMilestone(mIdx, { x: e.target.value })}
                        className="w-20 rounded border border-slate-300 px-2 py-1 font-mono text-center text-xs"
                      />
                      {/* Line type buttons: || or | */}
                      <div className="flex rounded border border-slate-200 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateMilestone(mIdx, { lineType: "single" })}
                          title="Vạch đơn (|)"
                          className={`px-2 py-0.5 text-xs font-bold ${
                            m.lineType === "single"
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          |
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateMilestone(mIdx, { lineType: "double" })}
                          title="Vạch kép tiệm cận (||)"
                          className={`px-2 py-0.5 text-xs font-bold ${
                            m.lineType === "double"
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          ||
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(mIdx)}
                        title="Xoá mốc này"
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Limit values (Trái / Phải) */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Trái:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={m.leftY}
                          onChange={(e) => handleUpdateMilestone(mIdx, { leftY: e.target.value })}
                          className="w-16 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-center text-xs"
                        />
                        <div className="flex gap-0.5">
                          {["-∞", "+∞"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleUpdateMilestone(mIdx, { leftY: val })}
                              className="rounded bg-slate-50 px-1 py-0.5 text-[9px] text-slate-600 hover:bg-slate-100"
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phải:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={m.rightY}
                          onChange={(e) => handleUpdateMilestone(mIdx, { rightY: e.target.value })}
                          className="w-16 rounded border border-slate-300 px-1.5 py-0.5 font-mono text-center text-xs"
                        />
                        <div className="flex gap-0.5">
                          {["-∞", "+∞"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleUpdateMilestone(mIdx, { rightY: val })}
                              className="rounded bg-slate-50 px-1 py-0.5 text-[9px] text-slate-600 hover:bg-slate-100"
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}

            {/* Last interval */}
            <div className="flex items-center justify-between rounded bg-slate-100/70 px-3 py-1.5 text-[11px] text-slate-600">
              <span>Khoảng {data.milestones.length + 1}: y' mang dấu</span>
              <div className="flex items-center gap-1.5">
                {["+", "-", "0"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleUpdateIntervalSign(data.milestones.length, s as any)}
                    className={`h-6 w-6 rounded border font-bold ${
                      data.intervals[data.milestones.length]?.sign === s
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Mốc Cuối (End) */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Cuối:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.endX}
                    onChange={(e) => setData({ ...data, endX: e.target.value })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 font-mono text-center text-xs"
                  />
                  <div className="flex gap-1">
                    {["-∞", "+∞"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setData({ ...data, endX: val })}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">y:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={data.endY}
                    onChange={(e) => setData({ ...data, endY: e.target.value })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 font-mono text-center text-xs"
                  />
                  <div className="flex gap-1">
                    {["-∞", "+∞"].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setData({ ...data, endY: val })}
                        className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <select
                    value={data.endYPos}
                    onChange={(e) => setData({ ...data, endYPos: e.target.value as any })}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                  >
                    <option value="top">Trên</option>
                    <option value="bottom">Dưới</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Add Milestone Button */}
            <button
              type="button"
              onClick={handleAddMilestone}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm mốc x trung gian
            </button>
          </div>

          {/* Section 3: Kích thước (Sliders) */}
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Kích thước bảng</span>
              <button
                type="button"
                onClick={() => setData({ ...data, width: 440, heightY: 90 })}
                className="text-[11px] font-medium text-blue-600 hover:underline"
              >
                Về mặc định
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Bề rộng:</span>
                  <span className="font-mono">{data.width}px</span>
                </div>
                <input
                  type="range"
                  min="320"
                  max="650"
                  step="10"
                  value={data.width}
                  onChange={(e) => setData({ ...data, width: parseInt(e.target.value) || 440 })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>Cao hàng y:</span>
                  <span className="font-mono">{data.heightY}px</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="160"
                  step="5"
                  value={data.heightY}
                  onChange={(e) => setData({ ...data, heightY: parseInt(e.target.value) || 90 })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
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

// Dynamic Variation Table SVG Renderer (Exact match with Screenshots 1 & 2)
export function VariationTableRenderer({ data }: { data: VariationTableData }) {
  const w = data.width || 440;
  const colXWidth = 45;
  const showYPrime = data.showYPrime !== false;
  const rowXHeight = 32;
  const rowYPrimeHeight = showYPrime ? 32 : 0;
  const rowYHeight = data.heightY || 90;
  const totalH = rowXHeight + rowYPrimeHeight + rowYHeight;

  const contentWidth = w - colXWidth;
  const totalCols = data.milestones.length + 1;
  const colWidth = contentWidth / totalCols;

  // Arrow lines and value positions for row y
  const yTopPos = rowXHeight + rowYPrimeHeight + 18;
  const yBottomPos = rowXHeight + rowYPrimeHeight + rowYHeight - 14;

  return (
    <svg
      width={w}
      height={totalH}
      viewBox={`0 0 ${w} ${totalH}`}
      className="font-serif select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="arrEnd"
          markerWidth="7"
          markerHeight="7"
          refX="5"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 1, 6 3.5, 0 6" fill="#0f172a" />
        </marker>
      </defs>

      {/* Outer border */}
      <rect x="0" y="0" width={w} height={totalH} fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />

      {/* Vertical separator for label column */}
      <line x1={colXWidth} y1="0" x2={colXWidth} y2={totalH} stroke="#0f172a" strokeWidth="1.2" />

      {/* Horizontal row separator lines */}
      <line x1="0" y1={rowXHeight} x2={w} y2={rowXHeight} stroke="#0f172a" strokeWidth="1.2" />
      {showYPrime && (
        <line
          x1="0"
          y1={rowXHeight + rowYPrimeHeight}
          x2={w}
          y2={rowXHeight + rowYPrimeHeight}
          stroke="#0f172a"
          strokeWidth="1.2"
        />
      )}

      {/* Label: x */}
      <text
        x={colXWidth / 2}
        y={rowXHeight / 2 + 5}
        fontSize="13"
        fontStyle="italic"
        fontWeight="bold"
        fill="#0f172a"
        textAnchor="middle"
      >
        x
      </text>

      {/* Label: y' */}
      {showYPrime && (
        <text
          x={colXWidth / 2}
          y={rowXHeight + rowYPrimeHeight / 2 + 5}
          fontSize="13"
          fontStyle="italic"
          fontWeight="bold"
          fill="#0f172a"
          textAnchor="middle"
        >
          y'
        </text>
      )}

      {/* Label: y */}
      <text
        x={colXWidth / 2}
        y={rowXHeight + rowYPrimeHeight + rowYHeight / 2 + 5}
        fontSize="13"
        fontStyle="italic"
        fontWeight="bold"
        fill="#0f172a"
        textAnchor="middle"
      >
        y
      </text>

      {/* Column values for x row */}
      {/* Start x */}
      <text
        x={colXWidth + 18}
        y={rowXHeight / 2 + 5}
        fontSize="12"
        fill="#0f172a"
        textAnchor="middle"
      >
        {data.startX}
      </text>

      {/* Milestones x and vertical lines */}
      {data.milestones.map((m, mIdx) => {
        const xPos = colXWidth + (mIdx + 1) * colWidth;
        return (
          <React.Fragment key={m.id}>
            {/* Milestone x text */}
            <text
              x={xPos}
              y={rowXHeight / 2 + 5}
              fontSize="12"
              fontWeight="bold"
              fill="#0f172a"
              textAnchor="middle"
            >
              {m.x}
            </text>

            {/* Vertical separator line at milestone */}
            {m.lineType === "double" ? (
              <>
                <line
                  x1={xPos - 2}
                  y1={rowXHeight}
                  x2={xPos - 2}
                  y2={totalH}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                />
                <line
                  x1={xPos + 2}
                  y1={rowXHeight}
                  x2={xPos + 2}
                  y2={totalH}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                />
              </>
            ) : (
              <line
                x1={xPos}
                y1={rowXHeight}
                x2={xPos}
                y2={totalH}
                stroke="#0f172a"
                strokeWidth="1"
                strokeDasharray={showYPrime ? "none" : "3 3"}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* End x */}
      <text
        x={w - 18}
        y={rowXHeight / 2 + 5}
        fontSize="12"
        fill="#0f172a"
        textAnchor="middle"
      >
        {data.endX}
      </text>

      {/* Signs in y' row */}
      {showYPrime &&
        data.intervals.map((inter, iIdx) => {
          const startXCol = colXWidth + iIdx * colWidth;
          const midX = startXCol + colWidth / 2;
          return (
            <text
              key={iIdx}
              x={midX}
              y={rowXHeight + rowYPrimeHeight / 2 + 5}
              fontSize="14"
              fontWeight="bold"
              fill={inter.sign === "+" ? "#2563eb" : inter.sign === "-" ? "#dc2626" : "#0f172a"}
              textAnchor="middle"
            >
              {inter.sign}
            </text>
          );
        })}

      {/* Variations in y row (Arrows + Values) */}
      {/* 1. If only 1 interval or rational function with 1 milestone */}
      {data.milestones.length === 1 && data.milestones[0].lineType === "double" ? (
        <>
          {/* Left interval arrow going up */}
          <text x={colXWidth + 18} y={yBottomPos} fontSize="12" fill="#0f172a" textAnchor="middle">
            {data.startY}
          </text>
          <line
            x1={colXWidth + 30}
            y1={yBottomPos - 4}
            x2={colXWidth + colWidth - 16}
            y2={yTopPos + 4}
            stroke="#0f172a"
            strokeWidth="1.4"
            markerEnd="url(#arrEnd)"
          />
          <text
            x={colXWidth + colWidth - 18}
            y={yTopPos}
            fontSize="12"
            fill="#0f172a"
            textAnchor="middle"
          >
            {data.milestones[0].leftY}
          </text>

          {/* Right interval arrow going up */}
          <text
            x={colXWidth + colWidth + 18}
            y={yBottomPos}
            fontSize="12"
            fill="#0f172a"
            textAnchor="middle"
          >
            {data.milestones[0].rightY}
          </text>
          <line
            x1={colXWidth + colWidth + 30}
            y1={yBottomPos - 4}
            x2={w - 28}
            y2={yTopPos + 4}
            stroke="#0f172a"
            strokeWidth="1.4"
            markerEnd="url(#arrEnd)"
          />
          <text x={w - 18} y={yTopPos} fontSize="12" fill="#0f172a" textAnchor="middle">
            {data.endY}
          </text>
        </>
      ) : (
        /* Standard Polynomial Curve (e.g. Bậc 3, Bậc 4) */
        data.intervals.map((inter, iIdx) => {
          const x1 = colXWidth + iIdx * colWidth + (iIdx === 0 ? 18 : 0);
          const x2 = colXWidth + (iIdx + 1) * colWidth - (iIdx === data.intervals.length - 1 ? 18 : 0);
          const isUp = inter.sign === "+";

          const valStart =
            iIdx === 0
              ? data.startY
              : data.milestones[iIdx - 1]?.rightY || data.milestones[iIdx - 1]?.leftY;
          const valEnd =
            iIdx === data.intervals.length - 1
              ? data.endY
              : data.milestones[iIdx]?.leftY || data.milestones[iIdx]?.rightY;

          const y1 = isUp ? yBottomPos : yTopPos;
          const y2 = isUp ? yTopPos : yBottomPos;

          return (
            <React.Fragment key={iIdx}>
              {iIdx === 0 && (
                <text x={x1} y={y1} fontSize="12" fill="#0f172a" textAnchor="middle">
                  {valStart}
                </text>
              )}
              <line
                x1={x1 + 10}
                y1={isUp ? y1 - 4 : y1 + 4}
                x2={x2 - 10}
                y2={isUp ? y2 + 4 : y2 - 4}
                stroke="#0f172a"
                strokeWidth="1.4"
                markerEnd="url(#arrEnd)"
              />
              <text x={x2} y={y2} fontSize="12" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                {valEnd}
              </text>
            </React.Fragment>
          );
        })
      )}
    </svg>
  );
}
