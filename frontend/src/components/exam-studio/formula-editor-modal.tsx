"use client";

import React, { useState, useEffect, useRef } from "react";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { Trash2, Check, X } from "lucide-react";

interface SymbolItem {
  id: string;
  labelLatex: string;
  insertSnippet: string;
  title?: string;
}

interface FormulaEditorModalProps {
  isOpen: boolean;
  initialMode?: "math" | "chem";
  initialFormula?: string;
  initialDisplayMode?: "inline" | "block";
  onClose: () => void;
  onSave: (formulaLatex: string, displayMode: "inline" | "block", mode: "math" | "chem") => void;
}

// 1. MATH SYMBOLS CATEGORIES (Matching soandethi.com screenshots)
const BASIC_SYMBOLS: SymbolItem[] = [
  { id: "frac", labelLatex: "$\\frac{a}{b}$", insertSnippet: "\\frac{a}{b}", title: "Phân số" },
  { id: "sqrt", labelLatex: "$\\sqrt{x}$", insertSnippet: "\\sqrt{x}", title: "Căn bậc hai" },
  { id: "nsqrt", labelLatex: "$\\sqrt[n]{x}$", insertSnippet: "\\sqrt[n]{x}", title: "Căn bậc n" },
  { id: "pow_n", labelLatex: "$x^n$", insertSnippet: "x^{n}", title: "Lũy thừa n" },
  { id: "sub_n", labelLatex: "$x_n$", insertSnippet: "x_{n}", title: "Chỉ số dưới n" },
  { id: "pow_2", labelLatex: "$x^2$", insertSnippet: "x^2", title: "Bình phương" },
  { id: "abs", labelLatex: "$|x|$", insertSnippet: "|x|", title: "Giá trị tuyệt đối" },
  { id: "paren", labelLatex: "$(x)$", insertSnippet: "(x)", title: "Dấu ngoặc đơn" },
  { id: "cdot", labelLatex: "$\\cdot$", insertSnippet: "\\cdot ", title: "Nhân (chấm)" },
  { id: "times", labelLatex: "$\\times$", insertSnippet: "\\times ", title: "Nhân (dấu nhân)" },
  { id: "div", labelLatex: "$\\div$", insertSnippet: "\\div ", title: "Chia" },
  { id: "pm", labelLatex: "$\\pm$", insertSnippet: "\\pm ", title: "Cộng trừ" },
  { id: "infty", labelLatex: "$\\infty$", insertSnippet: "\\infty", title: "Vô cùng" },
  { id: "percent", labelLatex: "$\\%$", insertSnippet: "\\%", title: "Phần trăm" },
];

const COMPARE_SYMBOLS: SymbolItem[] = [
  { id: "ne", labelLatex: "$\\ne$", insertSnippet: "\\ne ", title: "Khác" },
  { id: "le", labelLatex: "$\\le$", insertSnippet: "\\le ", title: "Nhỏ hơn hoặc bằng" },
  { id: "ge", labelLatex: "$\\ge$", insertSnippet: "\\ge ", title: "Lớn hơn hoặc bằng" },
  { id: "approx", labelLatex: "$\\approx$", insertSnippet: "\\approx ", title: "Xấp xỉ" },
  { id: "equiv", labelLatex: "$\\equiv$", insertSnippet: "\\equiv ", title: "Đồng nhất" },
  { id: "Rightarrow", labelLatex: "$\\Rightarrow$", insertSnippet: "\\Rightarrow ", title: "Suy ra" },
  { id: "Leftrightarrow", labelLatex: "$\\Leftrightarrow$", insertSnippet: "\\Leftrightarrow ", title: "Tương đương" },
  { id: "rightarrow", labelLatex: "$\\rightarrow$", insertSnippet: "\\rightarrow ", title: "Mũi tên sang phải" },
  { id: "in", labelLatex: "$\\in$", insertSnippet: "\\in ", title: "Thuộc" },
  { id: "notin", labelLatex: "$\\notin$", insertSnippet: "\\notin ", title: "Không thuộc" },
  { id: "subset", labelLatex: "$\\subset$", insertSnippet: "\\subset ", title: "Tập con" },
  { id: "cup", labelLatex: "$\\cup$", insertSnippet: "\\cup ", title: "Hợp" },
  { id: "cap", labelLatex: "$\\cap$", insertSnippet: "\\cap ", title: "Giao" },
  { id: "emptyset", labelLatex: "$\\emptyset$", insertSnippet: "\\emptyset", title: "Tập rỗng" },
  { id: "forall", labelLatex: "$\\forall$", insertSnippet: "\\forall ", title: "Với mọi" },
  { id: "exists", labelLatex: "$\\exists$", insertSnippet: "\\exists ", title: "Tồn tại" },
];

const ANALYSIS_SYMBOLS: SymbolItem[] = [
  { id: "sin", labelLatex: "$\\sin$", insertSnippet: "\\sin(x)", title: "Hàm sin" },
  { id: "cos", labelLatex: "$\\cos$", insertSnippet: "\\cos(x)", title: "Hàm cos" },
  { id: "tan", labelLatex: "$\\tan$", insertSnippet: "\\tan(x)", title: "Hàm tan" },
  { id: "loga", labelLatex: "$\\log_a$", insertSnippet: "\\log_{a}(x)", title: "Logarit cơ số a" },
  { id: "ln", labelLatex: "$\\ln$", insertSnippet: "\\ln(x)", title: "Logarit tự nhiên" },
  { id: "lim", labelLatex: "$\\lim$", insertSnippet: "\\lim_{x \\to x_0}", title: "Giới hạn" },
  { id: "sum", labelLatex: "$\\sum$", insertSnippet: "\\sum_{i=1}^{n}", title: "Tổng sigma" },
  { id: "prod", labelLatex: "$\\prod$", insertSnippet: "\\prod_{i=1}^{n}", title: "Tích pi" },
  { id: "int", labelLatex: "$\\int$", insertSnippet: "\\int_{a}^{b} f(x)dx", title: "Tích phân" },
  { id: "diff", labelLatex: "$\\frac{d}{dx}$", insertSnippet: "\\frac{d}{dx}", title: "Đạo hàm d/dx" },
  { id: "fprime", labelLatex: "$f'$", insertSnippet: "f'(x)", title: "Đạo hàm f'" },
  { id: "cnk", labelLatex: "$C_n^k$", insertSnippet: "C_n^k", title: "Tổ hợp" },
  { id: "ank", labelLatex: "$A_n^k$", insertSnippet: "A_n^k", title: "Chỉnh hợp" },
  { id: "nfac", labelLatex: "$n!$", insertSnippet: "n!", title: "Giai thừa" },
  { id: "binom", labelLatex: "$\\binom{n}{k}$", insertSnippet: "\\binom{n}{k}", title: "Hệ số nhị thức" },
];

const GREEK_SYMBOLS: SymbolItem[] = [
  { id: "alpha", labelLatex: "$\\alpha$", insertSnippet: "\\alpha ", title: "Alpha" },
  { id: "beta", labelLatex: "$\\beta$", insertSnippet: "\\beta ", title: "Beta" },
  { id: "gamma", labelLatex: "$\\gamma$", insertSnippet: "\\gamma ", title: "Gamma" },
  { id: "delta", labelLatex: "$\\delta$", insertSnippet: "\\delta ", title: "Delta nhỏ" },
  { id: "Delta", labelLatex: "$\\Delta$", insertSnippet: "\\Delta ", title: "Delta lớn" },
  { id: "epsilon", labelLatex: "$\\epsilon$", insertSnippet: "\\epsilon ", title: "Epsilon" },
  { id: "theta", labelLatex: "$\\theta$", insertSnippet: "\\theta ", title: "Theta" },
  { id: "lambda", labelLatex: "$\\lambda$", insertSnippet: "\\lambda ", title: "Lambda" },
  { id: "mu", labelLatex: "$\\mu$", insertSnippet: "\\mu ", title: "Mu" },
  { id: "pi", labelLatex: "$\\pi$", insertSnippet: "\\pi ", title: "Pi" },
  { id: "rho", labelLatex: "$\\rho$", insertSnippet: "\\rho ", title: "Rho" },
  { id: "sigma", labelLatex: "$\\sigma$", insertSnippet: "\\sigma ", title: "Sigma" },
  { id: "tau", labelLatex: "$\\tau$", insertSnippet: "\\tau ", title: "Tau" },
  { id: "phi", labelLatex: "$\\phi$", insertSnippet: "\\phi ", title: "Phi" },
  { id: "omega", labelLatex: "$\\omega$", insertSnippet: "\\omega ", title: "Omega nhỏ" },
  { id: "Omega", labelLatex: "$\\Omega$", insertSnippet: "\\Omega ", title: "Omega lớn" },
];

const GEOMETRY_SYMBOLS: SymbolItem[] = [
  { id: "angle", labelLatex: "$\\angle$", insertSnippet: "\\angle AOB", title: "Góc" },
  { id: "triangle", labelLatex: "$\\Delta$", insertSnippet: "\\Delta ABC", title: "Tam giác" },
  { id: "parallel", labelLatex: "$\\parallel$", insertSnippet: "\\parallel ", title: "Song song" },
  { id: "perp", labelLatex: "$\\perp$", insertSnippet: "\\perp ", title: "Vuông góc" },
  { id: "vec_u", labelLatex: "$\\vec{u}$", insertSnippet: "\\vec{u}", title: "Vectơ u" },
  { id: "vec_ab", labelLatex: "$\\vec{AB}$", insertSnippet: "\\vec{AB}", title: "Vectơ AB" },
  { id: "degree", labelLatex: "$^\\circ$", insertSnippet: "^{\\circ}", title: "Độ" },
  { id: "hat_abc", labelLatex: "$\\widehat{ABC}$", insertSnippet: "\\widehat{ABC}", title: "Ký hiệu góc nón" },
];

// 2. CHEMISTRY BUTTONS (Exact match with soandethi.com: -> = ↑ ↓ (s) (l) (g) (aq) n+ t°)
const CHEM_QUICK_BUTTONS = [
  { label: "->", snippet: " -> ", title: "Mũi tên phản ứng" },
  { label: "=", snippet: " = ", title: "Dấu bằng / Phản ứng" },
  { label: "↑", snippet: " ↑ ", title: "Khí bay lên" },
  { label: "↓", snippet: " ↓ ", title: "Kết tủa lắng xuống" },
  { label: "(s)", snippet: "(s)", title: "Trạng thái rắn" },
  { label: "(l)", snippet: "(l)", title: "Trạng thái lỏng" },
  { label: "(g)", snippet: "(g)", title: "Trạng thái khí" },
  { label: "(aq)", snippet: "(aq)", title: "Dung dịch nước" },
  { label: "n+", snippet: "^{2+}", title: "Chỉ số điện tích ion" },
  { label: "t°", snippet: " (t°)", title: "Nhiệt độ phản ứng" },
];

// Helper: Convert handwritten-style chemistry formula to LaTeX
export function formatChemistryLatex(rawInput: string): string {
  if (!rawInput.trim()) return "";

  // If already full LaTeX (starts with \text or contains \frac)
  if (rawInput.includes("\\text{") && !rawInput.includes("->")) {
    return rawInput;
  }

  let text = rawInput
    .replace(/->|→/g, " \\rightarrow ")
    .replace(/<=>|<->|⇌|⇄/g, " \\rightleftharpoons ")
    .replace(/↑/g, " \\uparrow ")
    .replace(/↓/g, " \\downarrow ")
    .replace(/\(t°\)|t°|t\^o/g, " \\xrightarrow{t^\\circ} ");

  const tokens = text.split(/(\s+|\+|\\rightarrow|\\rightleftharpoons|\\uparrow|\\downarrow|\\xrightarrow\{t\^\\circ\})/g);

  const formattedTokens = tokens.map((tok) => {
    if (!tok || !tok.trim()) return tok;
    if (["+", "\\rightarrow", "\\rightleftharpoons", "\\uparrow", "\\downarrow"].includes(tok.trim())) {
      return tok;
    }
    if (tok.startsWith("\\xrightarrow")) return tok;

    let s = tok.trim();

    // Check stoichiometric coefficient (e.g. 2Na -> 2 and Na)
    const coeffMatch = s.match(/^(\d+)([A-Za-z].*)/);
    let coeff = "";
    if (coeffMatch) {
      coeff = coeffMatch[1];
      s = coeffMatch[2];
    }

    // Check ion charge (e.g. ^2-, ^3+, ^+, ^-, 2-, 3+, +, -)
    let charge = "";
    const chargeMatch = s.match(/(\^?\d*[+-])$/);
    if (chargeMatch) {
      charge = chargeMatch[1].replace("^", "");
      s = s.slice(0, -chargeMatch[1].length);
    }

    // Convert digits in formula to subscripts, e.g. H2SO4 -> \text{H}_2\text{SO}_4
    const parts = s.split(/(\d+)/);
    let formulaKaTex = "";
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (/^\d+$/.test(p)) {
        formulaKaTex += `_{${p}}`;
      } else if (p.length > 0) {
        formulaKaTex += `\\text{${p}}`;
      }
    }

    let finalToken = coeff ? `${coeff}${formulaKaTex}` : formulaKaTex;
    if (charge) {
      finalToken += `^{${charge}}`;
    }

    // Preserve states like (s), (l), (g), (aq)
    finalToken = finalToken
      .replace(/\\text\{\(s\)\}/g, "(s)")
      .replace(/\\text\{\(l\)\}/g, "(l)")
      .replace(/\\text\{\(g\)\}/g, "(g)")
      .replace(/\\text\{\(aq\)\}/g, "(aq)");

    return finalToken;
  });

  return formattedTokens.join("");
}

export function FormulaEditorModal({
  isOpen,
  initialMode = "math",
  initialFormula = "",
  initialDisplayMode = "inline",
  onClose,
  onSave,
}: FormulaEditorModalProps) {
  const [subjectMode, setSubjectMode] = useState<"math" | "chem">(initialMode);
  const [displayMode, setDisplayMode] = useState<"inline" | "block">(initialDisplayMode);
  const [formulaText, setFormulaText] = useState<string>("");
  const [mathTab, setMathTab] = useState<"basic" | "compare" | "analysis" | "greek" | "geometry">("basic");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setSubjectMode(initialMode);
      let cleanFormula = initialFormula.trim();
      if (cleanFormula.startsWith("$$") && cleanFormula.endsWith("$$")) {
        cleanFormula = cleanFormula.slice(2, -2).trim();
        setDisplayMode("block");
      } else if (cleanFormula.startsWith("$") && cleanFormula.endsWith("$")) {
        cleanFormula = cleanFormula.slice(1, -1).trim();
        setDisplayMode("inline");
      } else {
        setDisplayMode(initialDisplayMode);
      }
      setFormulaText(cleanFormula || (initialMode === "math" ? "x^2" : "2Na + 2H2O -> 2NaOH + H2"));
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, initialMode, initialFormula, initialDisplayMode]);

  if (!isOpen) return null;

  // Insert snippet at caret position
  const handleInsertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setFormulaText((prev) => prev + snippet);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const curVal = formulaText;
    const updated = curVal.slice(0, start) + snippet + curVal.slice(end);
    setFormulaText(updated);

    setTimeout(() => {
      el.focus();
      const nextPos = start + snippet.length;
      el.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const handleClear = () => {
    setFormulaText("");
    if (textareaRef.current) textareaRef.current.focus();
  };

  const finalFormattedLatex =
    subjectMode === "chem" ? formatChemistryLatex(formulaText) : formulaText.trim();

  const handleConfirmSave = () => {
    onSave(finalFormattedLatex, displayMode, subjectMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[620px] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition-all">
        {/* Top Header Controls: [Toán | Hoá học] on left, [Trong dòng | Riêng dòng] on right */}
        <div className="flex items-center justify-between pb-3">
          {/* Subject segmented pills */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setSubjectMode("math");
                if (formulaText.includes("->")) setFormulaText("x^2");
              }}
              className={`rounded-md px-3.5 py-1 transition ${
                subjectMode === "math"
                  ? "bg-white font-semibold text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Toán
            </button>
            <button
              type="button"
              onClick={() => {
                setSubjectMode("chem");
                if (formulaText === "x^2") setFormulaText("2Na + 2H2O -> 2NaOH + H2");
              }}
              className={`rounded-md px-3.5 py-1 transition ${
                subjectMode === "chem"
                  ? "bg-white font-semibold text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hoá học
            </button>
          </div>

          {/* Inline vs Block segmented pills */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setDisplayMode("inline")}
              className={`rounded-md px-3 py-1 transition ${
                displayMode === "inline"
                  ? "bg-white font-semibold text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Trong dòng
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("block")}
              className={`rounded-md px-3 py-1 transition ${
                displayMode === "block"
                  ? "bg-white font-semibold text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Riêng dòng
            </button>
          </div>
        </div>

        {/* Input Textarea for formula */}
        <div className="relative mb-3">
          <textarea
            ref={textareaRef}
            rows={2}
            value={formulaText}
            onChange={(e) => setFormulaText(e.target.value)}
            placeholder={
              subjectMode === "math"
                ? "Nhập công thức toán học hoặc bấm các biểu tượng bên dưới..."
                : "2Na + 2H2O -> 2NaOH + H2"
            }
            className="w-full resize-none rounded-xl border border-slate-300 p-3 font-mono text-sm text-slate-900 shadow-inner outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 1. MATH MODE CATEGORIES & BUTTONS */}
        {subjectMode === "math" && (
          <>
            {/* Category Tabs */}
            <div className="border-b border-slate-200 pb-1.5 mb-2.5">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setMathTab("basic")}
                  className={`transition pb-1 ${
                    mathTab === "basic"
                      ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                      : "hover:text-slate-900"
                  }`}
                >
                  Cơ bản
                </button>
                <button
                  type="button"
                  onClick={() => setMathTab("compare")}
                  className={`transition pb-1 ${
                    mathTab === "compare"
                      ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                      : "hover:text-slate-900"
                  }`}
                >
                  So sánh
                </button>
                <button
                  type="button"
                  onClick={() => setMathTab("analysis")}
                  className={`transition pb-1 ${
                    mathTab === "analysis"
                      ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                      : "hover:text-slate-900"
                  }`}
                >
                  Hàm & giải tích
                </button>
                <button
                  type="button"
                  onClick={() => setMathTab("greek")}
                  className={`transition pb-1 ${
                    mathTab === "greek"
                      ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                      : "hover:text-slate-900"
                  }`}
                >
                  Chữ Hy Lạp
                </button>
                <button
                  type="button"
                  onClick={() => setMathTab("geometry")}
                  className={`transition pb-1 ${
                    mathTab === "geometry"
                      ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                      : "hover:text-slate-900"
                  }`}
                >
                  Hình học
                </button>
              </div>
            </div>

            {/* Symbol Palette Grid */}
            <div className="mb-4 min-h-[75px] max-h-[120px] overflow-y-auto p-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {mathTab === "basic" &&
                  BASIC_SYMBOLS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={s.title}
                      onClick={() => handleInsertSnippet(s.insertSnippet)}
                      className="flex h-9 min-w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-serif text-slate-800 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                    >
                      <LatexRenderer content={s.labelLatex} />
                    </button>
                  ))}

                {mathTab === "compare" &&
                  COMPARE_SYMBOLS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={s.title}
                      onClick={() => handleInsertSnippet(s.insertSnippet)}
                      className="flex h-9 min-w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-serif text-slate-800 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                    >
                      <LatexRenderer content={s.labelLatex} />
                    </button>
                  ))}

                {mathTab === "analysis" &&
                  ANALYSIS_SYMBOLS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={s.title}
                      onClick={() => handleInsertSnippet(s.insertSnippet)}
                      className="flex h-9 min-w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-serif text-slate-800 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                    >
                      <LatexRenderer content={s.labelLatex} />
                    </button>
                  ))}

                {mathTab === "greek" &&
                  GREEK_SYMBOLS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={s.title}
                      onClick={() => handleInsertSnippet(s.insertSnippet)}
                      className="flex h-9 min-w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-serif text-slate-800 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                    >
                      <LatexRenderer content={s.labelLatex} />
                    </button>
                  ))}

                {mathTab === "geometry" &&
                  GEOMETRY_SYMBOLS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      title={s.title}
                      onClick={() => handleInsertSnippet(s.insertSnippet)}
                      className="flex h-9 min-w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-serif text-slate-800 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                    >
                      <LatexRenderer content={s.labelLatex} />
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* 2. CHEMISTRY MODE: SINGLE CLEAN ROW OF BUTTONS + HANDWRITTEN HELPER (Matching Screenshot 1) */}
        {subjectMode === "chem" && (
          <div className="mb-3 space-y-2.5">
            {/* Quick button row: -> = ↑ ↓ (s) (l) (g) (aq) n+ t° */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CHEM_QUICK_BUTTONS.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  title={b.title}
                  onClick={() => handleInsertSnippet(b.snippet)}
                  className="flex h-8 min-w-[36px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                >
                  {b.label}
                </button>
              ))}
            </div>

            {/* Handwritten guide note */}
            <p className="text-[11px] text-slate-500 italic">
              Gõ như viết tay: H2SO4 tự thành chỉ số dưới, -&gt; ra mũi tên, SO4^2- ra ion.
            </p>
          </div>
        )}

        {/* Live KaTeX Render Preview Box */}
        <div className="mb-4 flex min-h-[85px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-4 overflow-x-auto">
          {finalFormattedLatex ? (
            <div className="text-base text-slate-900">
              <LatexRenderer
                content={
                  displayMode === "inline"
                    ? `$${finalFormattedLatex}$`
                    : `$$${finalFormattedLatex}$$`
                }
              />
            </div>
          ) : (
            <span className="text-xs italic text-slate-400">
              Xem trước công thức
            </span>
          )}
        </div>

        {/* Footer actions: [Xoá] on left, [Huỷ] and [Lưu] on right */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Xoá</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              <span>Huỷ</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Lưu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
