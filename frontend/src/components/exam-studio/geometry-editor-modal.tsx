"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Check, RotateCcw, Shapes, Box } from "lucide-react";

export type GeometryType =
  | "triangle_right_altitude" // Tam giác vuông đường cao AH
  | "triangle_median"         // Tam giác thường có trung tuyến AM
  | "circle_tangent"          // Đường tròn tâm O có tiếp tuyến
  | "quad_trapezoid"          // Hình thang vuông / hình chữ nhật
  | "pyramid_s_abc"           // Hình chóp S.ABC đáy tam giác, SA vuông góc đáy
  | "pyramid_s_abcd"          // Hình chóp S.ABCD đáy hình chữ nhật/vuông
  | "prism_triangular"        // Hình lăng trụ tam giác ABC.A'B'C'
  | "cone_cylinder";          // Khối nón / Khối trụ

export interface GeometryConfigData {
  geomType: GeometryType;
  title?: string;
  labels: {
    top?: string;     // S or A
    bottomL?: string; // B or A
    bottomR?: string; // C or B
    extra1?: string;  // H or D or M
    extra2?: string;  // O or C'
  };
  showAltitude: boolean;
  showRightAngles: boolean;
  showDashedLines: boolean;
  notes?: string;     // e.g. "SA ⊥ (ABC), AB = a, BC = 2a"
  width: number;
  height: number;
}

interface GeometryEditorModalProps {
  isOpen: boolean;
  initialData?: GeometryConfigData | null;
  onClose: () => void;
  onSave: (data: GeometryConfigData) => void;
}

const GEOM_PRESETS: Array<{
  id: GeometryType;
  name: string;
  category: "2d" | "3d";
  data: GeometryConfigData;
}> = [
  // 1. Tam giác vuông đường cao
  {
    id: "triangle_right_altitude",
    name: "Tam giác vuông đường cao AH",
    category: "2d",
    data: {
      geomType: "triangle_right_altitude",
      title: "Tam giác ABC vuông tại A, đường cao AH",
      labels: { top: "A", bottomL: "B", bottomR: "C", extra1: "H" },
      showAltitude: true,
      showRightAngles: true,
      showDashedLines: true,
      notes: "AH ⊥ BC; AB = c, AC = b, BC = a",
      width: 280,
      height: 200,
    },
  },
  // 2. Tam giác có trung tuyến AM
  {
    id: "triangle_median",
    name: "Tam giác có trung tuyến AM",
    category: "2d",
    data: {
      geomType: "triangle_median",
      title: "Tam giác ABC có đường trung tuyến AM",
      labels: { top: "A", bottomL: "B", bottomR: "C", extra1: "M" },
      showAltitude: true,
      showRightAngles: false,
      showDashedLines: true,
      notes: "M là trung điểm BC (MB = MC)",
      width: 280,
      height: 200,
    },
  },
  // 3. Đường tròn tâm O tiếp tuyến d
  {
    id: "circle_tangent",
    name: "Đường tròn (O) và tiếp tuyến",
    category: "2d",
    data: {
      geomType: "circle_tangent",
      title: "Đường tròn tâm O và tiếp tuyến tại M",
      labels: { top: "O", bottomL: "A", bottomR: "B", extra1: "M" },
      showAltitude: true,
      showRightAngles: true,
      showDashedLines: true,
      notes: "OM ⊥ d tại tiếp điểm M",
      width: 280,
      height: 200,
    },
  },
  // 4. Hình thang vuông ABCD
  {
    id: "quad_trapezoid",
    name: "Hình thang vuông ABCD",
    category: "2d",
    data: {
      geomType: "quad_trapezoid",
      title: "Hình thang ABCD vuông tại A và D",
      labels: { top: "A", bottomL: "D", bottomR: "C", extra1: "B" },
      showAltitude: true,
      showRightAngles: true,
      showDashedLines: false,
      notes: "AD ⊥ AB, AD ⊥ CD",
      width: 280,
      height: 200,
    },
  },
  // 5. Hình chóp S.ABC (SA vuông góc đáy)
  {
    id: "pyramid_s_abc",
    name: "Hình chóp S.ABC (SA ⊥ đáy)",
    category: "3d",
    data: {
      geomType: "pyramid_s_abc",
      title: "Hình chóp S.ABC có SA vuông góc mặt phẳng (ABC)",
      labels: { top: "S", bottomL: "A", bottomR: "C", extra1: "B" },
      showAltitude: true,
      showRightAngles: true,
      showDashedLines: true,
      notes: "SA ⊥ (ABC); tam giác ABC vuông tại B",
      width: 280,
      height: 220,
    },
  },
  // 6. Hình chóp S.ABCD (đáy hình chữ nhật)
  {
    id: "pyramid_s_abcd",
    name: "Hình chóp S.ABCD (SA ⊥ đáy)",
    category: "3d",
    data: {
      geomType: "pyramid_s_abcd",
      title: "Hình chóp S.ABCD có SA ⊥ (ABCD)",
      labels: { top: "S", bottomL: "A", bottomR: "C", extra1: "D", extra2: "B" },
      showAltitude: true,
      showRightAngles: true,
      showDashedLines: true,
      notes: "Đáy ABCD là hình vuông/chữ nhật",
      width: 280,
      height: 220,
    },
  },
  // 7. Hình lăng trụ tam giác ABC.A'B'C'
  {
    id: "prism_triangular",
    name: "Hình lăng trụ ABC.A'B'C'",
    category: "3d",
    data: {
      geomType: "prism_triangular",
      title: "Lăng trụ tam giác ABC.A'B'C'",
      labels: { top: "A'", bottomL: "A", bottomR: "C", extra1: "B", extra2: "C'" },
      showAltitude: true,
      showRightAngles: false,
      showDashedLines: true,
      notes: "Lăng trụ đứng có các mặt bên là hình chữ nhật",
      width: 280,
      height: 230,
    },
  },
  // 8. Khối nón tròn xoay
  {
    id: "cone_cylinder",
    name: "Khối nón tròn xoay đỉnh S",
    category: "3d",
    data: {
      geomType: "cone_cylinder",
      title: "Hình nón tròn xoay đỉnh S, đáy hình tròn tâm O",
      labels: { top: "S", bottomL: "A", bottomR: "B", extra1: "O" },
      showAltitude: true,
      showRightAngles: true,
      showDashedLines: true,
      notes: "SO là trục nón (SO = h), bán kính đáy OA = r",
      width: 280,
      height: 220,
    },
  },
];

export function GeometryEditorModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: GeometryEditorModalProps) {
  const [data, setData] = useState<GeometryConfigData>(
    initialData || GEOM_PRESETS[0].data
  );
  const [activeTab, setActiveTab] = useState<"2d" | "3d">("2d");

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      const matched = GEOM_PRESETS.find((p) => p.id === initialData.geomType);
      if (matched) setActiveTab(matched.category);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: (typeof GEOM_PRESETS)[0]) => {
    setData({ ...preset.data });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Bộ soạn thảo hình vẽ hình học</h3>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              Hình học SVG
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live SVG Geometry Preview */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center justify-center overflow-x-auto min-h-[220px]">
          <div className="rounded-lg border-2 border-blue-500 bg-white p-3 shadow-sm">
            <GeometrySvgRenderer data={data} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Xem trước trực quan hình học phẳng / không gian</p>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          {/* Category Tabs: 2D Phẳng vs 3D Không gian */}
          <div>
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold mb-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("2d")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition ${
                  activeTab === "2d" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Shapes className="h-3.5 w-3.5" />
                <span>Hình học phẳng (2D)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("3d")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition ${
                  activeTab === "3d" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Box className="h-3.5 w-3.5" />
                <span>Hình học không gian (3D)</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2">
              {GEOM_PRESETS.filter((p) => p.category === activeTab).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`rounded-lg border p-2 text-left transition ${
                    data.geomType === p.id
                      ? "border-blue-500 bg-blue-50/80 font-bold text-blue-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-xs">{p.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Labels & Vertices Configuration */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
            <span className="font-semibold text-slate-800 block">Tên các đỉnh & điểm</span>
            <div className="grid grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Đỉnh trên (S / A)</label>
                <input
                  type="text"
                  value={data.labels.top || ""}
                  onChange={(e) =>
                    setData({ ...data, labels: { ...data.labels, top: e.target.value } })
                  }
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-center font-bold font-serif text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Đỉnh đáy trái (A / B)</label>
                <input
                  type="text"
                  value={data.labels.bottomL || ""}
                  onChange={(e) =>
                    setData({ ...data, labels: { ...data.labels, bottomL: e.target.value } })
                  }
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-center font-bold font-serif text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Đỉnh đáy phải (C)</label>
                <input
                  type="text"
                  value={data.labels.bottomR || ""}
                  onChange={(e) =>
                    setData({ ...data, labels: { ...data.labels, bottomR: e.target.value } })
                  }
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-center font-bold font-serif text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Điểm phụ (H / D / O)</label>
                <input
                  type="text"
                  value={data.labels.extra1 || ""}
                  onChange={(e) =>
                    setData({ ...data, labels: { ...data.labels, extra1: e.target.value } })
                  }
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-center font-bold font-serif text-xs"
                />
              </div>
            </div>

            {/* Checkbox toggles */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showAltitude}
                  onChange={(e) => setData({ ...data, showAltitude: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Hiện đường cao</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showRightAngles}
                  onChange={(e) => setData({ ...data, showRightAngles: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Góc vuông (∟)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showDashedLines}
                  onChange={(e) => setData({ ...data, showDashedLines: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Nét khuất / đứt</span>
              </label>
            </div>
          </div>

          {/* Notes & Dimensions */}
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
            <label className="font-semibold text-slate-800 block text-[11px]">
              Ghi chú công thức / số liệu cạnh kèm theo hình
            </label>
            <input
              type="text"
              value={data.notes || ""}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="Vd: SA ⊥ (ABC), AB = a, BC = 2a..."
              className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
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

// Dynamic SVG Geometry Renderer for 2D & 3D
export function GeometrySvgRenderer({ data }: { data: GeometryConfigData }) {
  const w = data.width || 280;
  const h = data.height || 210;
  const top = data.labels.top || "A";
  const bL = data.labels.bottomL || "B";
  const bR = data.labels.bottomR || "C";
  const ex1 = data.labels.extra1 || "H";
  const ex2 = data.labels.extra2 || "D";

  // 1. Tam giác vuông đường cao AH
  if (data.geomType === "triangle_right_altitude") {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-serif select-none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,165 230,165 105,45" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.8" />
        {data.showAltitude && (
          <line x1="105" y1="45" x2="105" y2="165" stroke="#dc2626" strokeWidth="1.5" strokeDasharray={data.showDashedLines ? "4 3" : "none"} />
        )}
        {data.showRightAngles && (
          <>
            <rect x="105" y="153" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="1.2" />
          </>
        )}
        <text x="105" y="35" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{top}</text>
        <text x="35" y="172" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{bL}</text>
        <text x="245" y="172" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{bR}</text>
        {data.showAltitude && (
          <text x="105" y="182" fontSize="13" fontStyle="italic" fill="#dc2626" textAnchor="middle">{ex1}</text>
        )}
      </svg>
    );
  }

  // 2. Tam giác có trung tuyến AM
  if (data.geomType === "triangle_median") {
    const midX = (50 + 230) / 2;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-serif select-none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,165 230,165 140,45" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="140" y1="45" x2={midX} y2="165" stroke="#2563eb" strokeWidth="1.5" strokeDasharray={data.showDashedLines ? "4 3" : "none"} />
        <circle cx={midX} cy="165" r="2.5" fill="#2563eb" />
        <text x="140" y="35" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{top}</text>
        <text x="35" y="172" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{bL}</text>
        <text x="245" y="172" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{bR}</text>
        <text x={midX} y="182" fontSize="13" fontStyle="italic" fill="#2563eb" textAnchor="middle">{ex1}</text>
      </svg>
    );
  }

  // 3. Đường tròn tâm O và tiếp tuyến
  if (data.geomType === "circle_tangent") {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-serif select-none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="140" cy="100" r="55" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.8" />
        <circle cx="140" cy="100" r="2.5" fill="#0f172a" />
        {/* Tangent line at bottom M(140, 155) */}
        <line x1="40" y1="155" x2="240" y2="155" stroke="#2563eb" strokeWidth="1.5" />
        <line x1="140" y1="100" x2="140" y2="155" stroke="#dc2626" strokeWidth="1.5" strokeDasharray={data.showDashedLines ? "4 3" : "none"} />
        {data.showRightAngles && (
          <rect x="140" y="143" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="1.2" />
        )}
        <text x="140" y="90" fontSize="13" fontWeight="bold" fill="#0f172a" textAnchor="middle">{top}</text>
        <text x="140" y="174" fontSize="13" fontStyle="italic" fill="#dc2626" textAnchor="middle">{ex1}</text>
        <text x="235" y="148" fontSize="12" fontStyle="italic" fill="#2563eb">d</text>
      </svg>
    );
  }

  // 4. Hình thang vuông ABCD
  if (data.geomType === "quad_trapezoid") {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-serif select-none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="60,60 170,60 230,165 60,165" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.8" />
        {data.showRightAngles && (
          <>
            <rect x="60" y="60" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="1.2" />
            <rect x="60" y="153" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="1.2" />
          </>
        )}
        <text x="50" y="55" fontSize="14" fontWeight="bold" fill="#0f172a">{top}</text>
        <text x="175" y="55" fontSize="14" fontWeight="bold" fill="#0f172a">{ex1}</text>
        <text x="240" y="172" fontSize="14" fontWeight="bold" fill="#0f172a">{bR}</text>
        <text x="45" y="172" fontSize="14" fontWeight="bold" fill="#0f172a">{bL}</text>
      </svg>
    );
  }

  // 5. Hình chóp S.ABC (SA vuông góc đáy)
  if (data.geomType === "pyramid_s_abc") {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-serif select-none" xmlns="http://www.w3.org/2000/svg">
        {/* Hidden back edge AC */}
        <line x1="75" y1="130" x2="235" y2="155" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Height SA */}
        <line x1="75" y1="35" x2="75" y2="130" stroke="#0f172a" strokeWidth="1.8" strokeDasharray={data.showDashedLines ? "4 3" : "none"} />

        {/* Visible edges */}
        <polygon points="75,35 150,185 235,155" fill="none" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="75" y1="130" x2="150" y2="185" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="75" y1="35" x2="235" y2="155" stroke="#0f172a" strokeWidth="1.8" />

        {data.showRightAngles && (
          <rect x="75" y="118" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="1.2" />
        )}

        <text x="75" y="25" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{top}</text>
        <text x="60" y="135" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{bL}</text>
        <text x="150" y="202" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{ex1}</text>
        <text x="245" y="162" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{bR}</text>
      </svg>
    );
  }

  // 6. Hình chóp S.ABCD
  if (data.geomType === "pyramid_s_abcd") {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-serif select-none" xmlns="http://www.w3.org/2000/svg">
        {/* Hidden base edges AB, AD */}
        <line x1="80" y1="125" x2="200" y2="125" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="80" y1="125" x2="45" y2="175" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* Height SA */}
        <line x1="80" y1="30" x2="80" y2="125" stroke="#0f172a" strokeWidth="1.8" strokeDasharray={data.showDashedLines ? "4 3" : "none"} />

        {/* Visible edges */}
        <line x1="45" y1="175" x2="165" y2="175" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="165" y1="175" x2="200" y2="125" stroke="#0f172a" strokeWidth="1.8" />

        <line x1="80" y1="30" x2="45" y2="175" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="80" y1="30" x2="165" y2="175" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="80" y1="30" x2="200" y2="125" stroke="#0f172a" strokeWidth="1.8" />

        <text x="80" y="20" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{top}</text>
        <text x="70" y="125" fontSize="13" fontWeight="bold" fill="#0f172a">{bL}</text>
        <text x="32" y="182" fontSize="14" fontWeight="bold" fill="#0f172a">{ex1}</text>
        <text x="175" y="185" fontSize="14" fontWeight="bold" fill="#0f172a">{bR}</text>
        <text x="210" y="128" fontSize="13" fontWeight="bold" fill="#0f172a">{ex2}</text>
      </svg>
    );
  }

  // 7. Lăng trụ tam giác ABC.A'B'C'
  if (data.geomType === "prism_triangular") {
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-serif select-none" xmlns="http://www.w3.org/2000/svg">
        {/* Top Base A'B'C' */}
        <polygon points="65,55 145,75 210,45" fill="none" stroke="#0f172a" strokeWidth="1.8" />

        {/* Vertical lines */}
        <line x1="65" y1="55" x2="65" y2="155" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="145" y1="75" x2="145" y2="175" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="210" y1="45" x2="210" y2="145" stroke="#0f172a" strokeWidth="1.8" />

        {/* Bottom Base ABC */}
        <line x1="65" y1="155" x2="145" y2="175" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="145" y1="175" x2="210" y2="145" stroke="#0f172a" strokeWidth="1.8" />
        <line x1="65" y1="155" x2="210" y2="145" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />

        <text x="50" y="55" fontSize="13" fontWeight="bold" fill="#0f172a">{top}</text>
        <text x="145" y="90" fontSize="13" fontWeight="bold" fill="#0f172a">B'</text>
        <text x="220" y="45" fontSize="13" fontWeight="bold" fill="#0f172a">C'</text>

        <text x="50" y="162" fontSize="14" fontWeight="bold" fill="#0f172a">{bL}</text>
        <text x="145" y="195" fontSize="14" fontWeight="bold" fill="#0f172a">{ex1}</text>
        <text x="220" y="152" fontSize="14" fontWeight="bold" fill="#0f172a">{bR}</text>
      </svg>
    );
  }

  // 8. Khối nón tròn xoay (cone_cylinder)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="font-serif select-none" xmlns="http://www.w3.org/2000/svg">
      {/* Base ellipse */}
      <ellipse cx="140" cy="165" rx="75" ry="22" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.8" strokeDasharray="none" />
      {/* Hidden back arc of ellipse */}
      <path d="M 65 165 A 75 22 0 0 1 215 165" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Slanted edges (đường sinh) */}
      <line x1="140" y1="35" x2="65" y2="165" stroke="#0f172a" strokeWidth="1.8" />
      <line x1="140" y1="35" x2="215" y2="165" stroke="#0f172a" strokeWidth="1.8" />

      {/* Height SO */}
      {data.showAltitude && (
        <line x1="140" y1="35" x2="140" y2="165" stroke="#dc2626" strokeWidth="1.5" strokeDasharray={data.showDashedLines ? "4 3" : "none"} />
      )}
      {/* Radius OA */}
      <line x1="140" y1="165" x2="215" y2="165" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 3" />

      {data.showRightAngles && (
        <rect x="140" y="153" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="1.2" />
      )}

      <text x="140" y="25" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">{top}</text>
      <text x="135" y="182" fontSize="13" fontStyle="italic" fill="#dc2626" textAnchor="end">{ex1}</text>
      <text x="225" y="172" fontSize="14" fontWeight="bold" fill="#0f172a">{bR}</text>
    </svg>
  );
}
