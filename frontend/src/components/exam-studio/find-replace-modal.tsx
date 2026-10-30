"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Replace, ChevronUp, ChevronDown, X } from "lucide-react";

interface FindReplaceModalProps {
  isOpen: boolean;
  initialMode?: "find" | "replace";
  onClose: () => void;
  onFind: (query: string, direction: "next" | "prev") => void;
  onReplace: (query: string, replacement: string) => void;
  onReplaceAll: (query: string, replacement: string) => void;
  matchIndex: number;
  totalMatches: number;
}

export function FindReplaceModal({
  isOpen,
  initialMode = "find",
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
  matchIndex,
  totalMatches,
}: FindReplaceModalProps) {
  const [mode, setMode] = useState<"find" | "replace">(initialMode);
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (query.trim()) {
      onFind(query, "next");
    }
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-28 right-8 z-50 w-80 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl select-none animate-in fade-in slide-in-from-top-2 overscroll-contain">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          {mode === "find" ? (
            <>
              <Search className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Tìm kiếm</span>
            </>
          ) : (
            <>
              <Replace className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Tìm và Thay thế</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode(mode === "find" ? "replace" : "find")}
            className="rounded px-1.5 py-0.5 text-[11px] text-blue-600 hover:bg-blue-50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
          >
            {mode === "find" ? "Hiện thay thế" : "Chỉ tìm"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng tìm kiếm"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Find input */}
      <div className="mt-2.5">
        <div className="relative flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            aria-label="Nội dung tìm kiếm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onFind(query, e.shiftKey ? "prev" : "next");
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Tìm trong đề thi…"
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-3 pr-20 text-xs text-slate-900 focus-visible:outline-hidden focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
          />
          <div className="absolute right-2 flex items-center gap-1 text-[11px] text-slate-400">
            {query.trim() && (
              <span className="tabular-nums">
                {totalMatches > 0 ? `${matchIndex + 1}/${totalMatches}` : "0"}
              </span>
            )}
            <button
              type="button"
              onClick={() => onFind(query, "prev")}
              disabled={totalMatches === 0}
              aria-label="Khớp trước"
              className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"
              title="Khớp trước"
            >
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onFind(query, "next")}
              disabled={totalMatches === 0}
              aria-label="Khớp sau"
              className="rounded p-0.5 hover:bg-slate-100 disabled:opacity-30"
              title="Khớp sau"
            >
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Replace input (if in replace mode) */}
      {mode === "replace" && (
        <div className="mt-2 space-y-2">
          <input
            type="text"
            aria-label="Nội dung thay thế"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Thay thế bằng…"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus-visible:outline-hidden focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
          />
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onReplace(query, replacement)}
              disabled={totalMatches === 0 || !query.trim()}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Thay thế
            </button>
            <button
              type="button"
              onClick={() => onReplaceAll(query, replacement)}
              disabled={totalMatches === 0 || !query.trim()}
              className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40"
            >
              Thay thế tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
