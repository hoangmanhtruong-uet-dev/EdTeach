"use client";

import React, { useState } from "react";
import { Download, Edit3, Trash2 } from "lucide-react";

interface SvgWrapperProps {
  children: React.ReactNode;
  title: string;
  onDelete?: () => void;
}

export function SvgIllustrationWrapper({ children, title, onDelete }: SvgWrapperProps) {
  const [isSelected, setIsSelected] = useState(false);

  const handleDownload = () => {
    // Download SVG as file
    const svgEl = document.getElementById(`svg-${title}`);
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      onClick={() => setIsSelected(!isSelected)}
      className={`relative my-4 inline-block rounded-sm p-4 transition cursor-pointer select-none ${
        isSelected
          ? "border-2 border-blue-500 bg-blue-50/10 shadow-sm"
          : "border border-slate-200 hover:border-blue-300"
      }`}
    >
      {/* Floating Action Buttons (Screenshot 2: Download & Sửa hình) */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white/95 px-2 py-1 shadow-sm backdrop-blur-sm z-10 print:hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          title="Tải ảnh SVG về máy"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            alert("Chế độ chỉnh sửa hình ảnh SVG.");
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
        >
          <Edit3 className="h-3 w-3" />
          <span>Sửa hình</span>
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Xóa hình này"
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div id={`svg-${title}`} className="flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// 1. Tấm nhôm và hộp không nắp (Exact match with Screenshot 2)
export function SheetBoxSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="tam_nhom_va_hop" onDelete={onDelete}>
      <svg
        width="280"
        height="320"
        viewBox="0 0 280 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="font-serif"
      >
        <defs>
          {/* Shading for corner squares */}
          <pattern id="diagHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="1" />
          </pattern>
          {/* Arrow markers */}
          <marker id="arrStart" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 5 L 10 2 L 10 8 z" fill="#1e293b" />
          </marker>
          <marker id="arrEnd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 2 L 10 5 L 0 8 z" fill="#1e293b" />
          </marker>
        </defs>

        {/* --- Top Drawing: Metal Sheet with Cut Corners --- */}
        {/* Main sheet outline */}
        <rect x="50" y="35" width="160" height="110" stroke="#0f172a" strokeWidth="1.8" fill="#ffffff" />

        {/* 4 Corner cutout squares with hatched pattern */}
        {/* Top-Left */}
        <rect x="50" y="35" width="22" height="22" fill="url(#diagHatch)" stroke="#0f172a" strokeWidth="1.2" />
        {/* Top-Right */}
        <rect x="188" y="35" width="22" height="22" fill="url(#diagHatch)" stroke="#0f172a" strokeWidth="1.2" />
        {/* Bottom-Left */}
        <rect x="50" y="123" width="22" height="22" fill="url(#diagHatch)" stroke="#0f172a" strokeWidth="1.2" />
        {/* Bottom-Right */}
        <rect x="188" y="123" width="22" height="22" fill="url(#diagHatch)" stroke="#0f172a" strokeWidth="1.2" />

        {/* Dimension labels for corner a */}
        <text x="60" y="27" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="40" y="48" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="219" y="48" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="40" y="137" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="219" y="137" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="60" y="155" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="200" y="155" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>

        {/* Vertical dimension: 5 dm with arrow */}
        <line x1="32" y1="35" x2="32" y2="145" stroke="#0f172a" strokeWidth="1" markerStart="url(#arrStart)" markerEnd="url(#arrEnd)" />
        <text x="25" y="94" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">5 dm</text>

        {/* Horizontal dimension: 8 dm with arrow */}
        <line x1="50" y1="162" x2="210" y2="162" stroke="#0f172a" strokeWidth="1" markerStart="url(#arrStart)" markerEnd="url(#arrEnd)" />
        <text x="130" y="176" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">8 dm</text>

        {/* --- Bottom Drawing: 3D Folded Open Box --- */}
        <g transform="translate(65, 215)">
          {/* Front face */}
          <polygon points="0,35 95,35 95,65 0,65" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
          {/* Right face */}
          <polygon points="95,35 130,10 130,40 95,65" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
          {/* Back top edge */}
          <line x1="35" y1="10" x2="130" y2="10" stroke="#0f172a" strokeWidth="1.5" />
          {/* Left top edge */}
          <line x1="0" y1="35" x2="35" y2="10" stroke="#0f172a" strokeWidth="1.5" />
          {/* Hidden back-left vertical line (dashed) */}
          <line x1="35" y1="10" x2="35" y2="40" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
          {/* Hidden bottom edges (dashed) */}
          <line x1="0" y1="65" x2="35" y2="40" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="35" y1="40" x2="130" y2="40" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
        </g>
      </svg>
    </SvgIllustrationWrapper>
  );
}

// 2. Sơ đồ máy sưởi (Thermal Circuit)
export function HeaterCircuitSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="so_do_may_suoi" onDelete={onDelete}>
      <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="240" height="140" rx="6" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <text x="140" y="42" fontSize="12" fontWeight="bold" fill="#0f172a" textAnchor="middle">SƠ ĐỒ NGUYÊN LÝ MÁY SƯỞI</text>

        {/* Power AC source */}
        <circle cx="55" cy="100" r="16" stroke="#0f172a" strokeWidth="1.5" fill="#f1f5f9" />
        <path d="M 47 100 Q 51 93 55 100 Q 59 107 63 100" stroke="#0f172a" strokeWidth="1.5" fill="none" />
        <text x="55" y="130" fontSize="10" fill="#475569" textAnchor="middle">220V ~</text>

        {/* Circuit lines */}
        <line x1="55" y1="84" x2="55" y2="65" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="55" y1="65" x2="105" y2="65" stroke="#0f172a" strokeWidth="1.5" />

        {/* Switch K */}
        <circle cx="105" cy="65" r="2.5" fill="#0f172a" />
        <line x1="105" y1="65" x2="128" y2="52" stroke="#dc2626" strokeWidth="2" />
        <circle cx="132" cy="65" r="2.5" fill="#0f172a" />
        <text x="118" y="48" fontSize="11" fontWeight="bold" fill="#dc2626">K</text>

        <line x1="132" y1="65" x2="170" y2="65" stroke="#0f172a" strokeWidth="1.5" />

        {/* Heating Resistor R */}
        <rect x="170" y="55" width="55" height="20" stroke="#0f172a" strokeWidth="1.5" fill="#fef3c7" />
        <path d="M 175 65 L 180 58 L 190 72 L 200 58 L 210 72 L 215 65" stroke="#d97706" strokeWidth="1.5" fill="none" />
        <text x="197" y="50" fontSize="11" fontStyle="italic" fontWeight="bold" fill="#0f172a" textAnchor="middle">R (Mayso)</text>

        {/* Return lines */}
        <line x1="225" y1="65" x2="235" y2="65" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="235" y1="65" x2="235" y2="135" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="235" y1="135" x2="55" y2="135" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="55" y1="135" x2="55" y2="116" stroke="#0f172a" strokeWidth="1.5" />
      </svg>
    </SvgIllustrationWrapper>
  );
}

// 3. Biển cảnh báo phóng xạ (Radiation Hazard Warning Sign)
export function RadiationHazardSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="bien_canh_bao_phong_xa" onDelete={onDelete}>
      <svg width="200" height="190" viewBox="0 0 200 190" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Equilateral warning triangle */}
        <polygon points="100,15 188,168 12,168" fill="#facc15" stroke="#0f172a" strokeWidth="7" strokeLinejoin="round" />
        <polygon points="100,28 176,160 24,160" fill="#facc15" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />

        {/* Trefoil symbol in center */}
        <g transform="translate(100, 114)">
          {/* Center black circle */}
          <circle cx="0" cy="0" r="10" fill="#0f172a" />
          {/* 3 Blades */}
          <path d="M 0 -13 A 38 38 0 0 1 29 -25 L 17 -11 A 20 20 0 0 0 0 -13 Z" fill="#0f172a" />
          <path d="M 0 -13 A 38 38 0 0 0 -29 -25 L -17 -11 A 20 20 0 0 1 0 -13 Z" fill="#0f172a" />
          <path d="M 12 6 A 38 38 0 0 1 37 13 L 20 8 A 20 20 0 0 0 12 6 Z" fill="#0f172a" />
          <path d="M 12 6 A 38 38 0 0 1 -7 38 L -4 20 A 20 20 0 0 0 12 6 Z" fill="#0f172a" />
          <path d="M -12 6 A 38 38 0 0 0 -37 13 L -20 8 A 20 20 0 0 1 -12 6 Z" fill="#0f172a" />
          <path d="M -12 6 A 38 38 0 0 0 7 38 L 4 20 A 20 20 0 0 1 -12 6 Z" fill="#0f172a" />
        </g>
        <text x="100" y="184" fontSize="10" fontWeight="bold" fill="#0f172a" textAnchor="middle" letterSpacing="0.5">
          NGUY HIỂM PHÓNG XẠ
        </text>
      </svg>
    </SvgIllustrationWrapper>
  );
}
