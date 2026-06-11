import React, { useMemo, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  Check,
  Circle,
  Trash2,
  Edit,
  TrendingUp,
  Info,
  DollarSign
} from "lucide-react";
import { Routine } from "../types";
import { formatToTurkishDate } from "../utils/dateUtils";

interface WalletViewProps {
  routines: Routine[];
  monthlyTasks: {
    id: string;
    dateStr: string;
    routine: Routine;
    isCompleted: boolean;
  }[];
  onToggleComplete: (routineId: string, dateStr: string) => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onAddRoutineClick: (defaultCategory?: string) => void;
  activeTheme?: string;
  activeClasses: any;
  designTemplate?: string;
}

// Robust amount parser from title & description
function extractAmount(title: string, desc?: string): number {
  const text = `${title} ${desc || ""}`.toLowerCase();
  
  // Specific pattern for: [number] TL / TRY / $ / € etc
  const complexRegex = /(?:[\$💵💰€]\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:tl|lira|try|usd|dollar|€|\$|💵|💰))/gi;
  let match = complexRegex.exec(text);
  if (match) {
    const rawNum = match[1] || match[2];
    const sanitizedVal = rawNum.replace(/\./g, "").replace(/,/g, ".");
    const parsed = parseFloat(sanitizedVal);
    if (!isNaN(parsed)) return parsed;
  }

  // Fallback to the first number found in string
  const fallbackRegex = /(\d+(?:[.,]\d+)?)/;
  const fallbackMatch = text.match(fallbackRegex);
  if (fallbackMatch) {
    const rawNum = fallbackMatch[1];
    const sanitizedVal = rawNum.replace(/\./g, "").replace(/,/g, ".");
    const parsed = parseFloat(sanitizedVal);
    if (!isNaN(parsed)) return parsed;
  }

  return 0;
}

export default function WalletView({
  routines,
  monthlyTasks,
  onToggleComplete,
  onEditRoutine,
  onDeleteRoutine,
  onAddRoutineClick,
  activeTheme,
  activeClasses,
  designTemplate = "modern",
}: WalletViewProps) {
  const [filterMode, setFilterMode] = useState<"all" | "completed" | "pending">("all");

  const { headerCardClass, statsCardClass, listCardClass, outerDivClass } = useMemo(() => {
    switch (designTemplate) {
      case "brutalist":
        return {
          outerDivClass: "space-y-4 font-sans",
          headerCardClass: "bg-white dark:bg-zinc-950 p-4 rounded-none border-2 border-black dark:border-zinc-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]",
          statsCardClass: "bg-white dark:bg-zinc-950 p-3.5 rounded-none border-2 border-black dark:border-zinc-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] space-y-2 relative overflow-hidden transition-colors duration-200",
          listCardClass: "p-3 rounded-none border-2 border-black dark:border-zinc-350 bg-white dark:bg-zinc-950 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]"
        };
      case "minimal":
        return {
          outerDivClass: "space-y-4 font-sans",
          headerCardClass: "bg-slate-50/50 dark:bg-zinc-900/40 p-3.5 sm:p-4 rounded-3xl border border-transparent shadow-none hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors duration-200",
          statsCardClass: "bg-slate-100/30 dark:bg-zinc-900/20 p-3.5 rounded-2xl border border-zinc-150/10 shadow-none space-y-2 relative overflow-hidden transition-colors duration-200",
          listCardClass: "p-3 rounded-xl border border-[#E5E5E5]/20 dark:border-zinc-805/10 bg-slate-50/50 dark:bg-zinc-850/20"
        };
      case "terminal":
        return {
          outerDivClass: "space-y-4 font-mono text-zinc-300",
          headerCardClass: "bg-[#09090b] p-3.5 sm:p-4 rounded-none border border-dashed border-zinc-700 dark:border-zinc-500 shadow-none",
          statsCardClass: "bg-black p-3.5 rounded-none border border-dashed border-zinc-700 dark:border-zinc-550 space-y-2 relative overflow-hidden font-mono",
          listCardClass: "p-2.5 rounded-none border border-dashed border-zinc-700 dark:border-zinc-600 bg-[#09090b]"
        };
      default:
        return {
          outerDivClass: "space-y-4 font-sans",
          headerCardClass: "bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 shadow-3xs",
          statsCardClass: "bg-white dark:bg-zinc-900 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 shadow-3xs p-3.5 space-y-2 relative overflow-hidden transition duration-200 hover:shadow-xs",
          listCardClass: "p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[#E5E5E5] dark:border-zinc-850 hover:shadow-3xs transition duration-200"
        };
    }
  }, [designTemplate]);

  // Filter routines in related finance categories
  const financeRoutines = useMemo(() => {
    return routines.filter(
      (r) =>
        r.category.toLowerCase() === "gelir" ||
        r.category.toLowerCase() === "ödemeler"
    );
  }, [routines]);

  // Compute stats for current calendar month using monthlyTasks occurrences
  const financeStats = useMemo(() => {
    let totalExpectedInc = 0;
    let totalCompletedInc = 0;
    let totalExpectedPay = 0;
    let totalCompletedPay = 0;

    monthlyTasks.forEach((task) => {
      const isInc = task.routine.category.toLowerCase() === "gelir";
      const isPay = task.routine.category.toLowerCase() === "ödemeler";
      if (!isInc && !isPay) return;

      const amt = extractAmount(task.routine.title, task.routine.description);

      if (isInc) {
        totalExpectedInc += amt;
        if (task.isCompleted) {
          totalCompletedInc += amt;
        }
      } else if (isPay) {
        totalExpectedPay += amt;
        if (task.isCompleted) {
          totalCompletedPay += amt;
        }
      }
    });

    const expectedBalance = totalExpectedInc - totalExpectedPay;
    const completedBalance = totalCompletedInc - totalCompletedPay;

    return {
      totalExpectedInc,
      totalCompletedInc,
      totalExpectedPay,
      totalCompletedPay,
      expectedBalance,
      completedBalance,
    };
  }, [monthlyTasks]);

  // Group task occurrences specifically for financial lists
  const financialOccurrences = useMemo(() => {
    const list = monthlyTasks
      .filter(
        (t) =>
          t.routine.category.toLowerCase() === "gelir" ||
          t.routine.category.toLowerCase() === "ödemeler"
      )
      .map((t) => {
        const amount = extractAmount(t.routine.title, t.routine.description);
        return {
          ...t,
          amount,
        };
      });

    if (filterMode === "completed") {
      return list.filter((t) => t.isCompleted);
    }
    if (filterMode === "pending") {
      return list.filter((t) => !t.isCompleted);
    }
    return list;
  }, [monthlyTasks, filterMode]);

  return (
    <div className={outerDivClass}>
      {/* Header Info */}
      <div className={headerCardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 ${activeClasses.accentBg} rounded-lg`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-xs sm:text-sm font-semibold leading-tight ${
                designTemplate === "terminal" ? "text-green-400 dark:text-green-400 font-mono" : "text-zinc-900 dark:text-zinc-100"
              }`}>
                Likit & Finansal Rutin Takibi (Cüzdan)
              </h2>
              <p className={`text-[10px] sm:text-[11px] font-light mt-0.5 leading-tight ${
                designTemplate === "terminal" ? "text-zinc-400 font-mono" : "text-slate-500 dark:text-zinc-400"
              }`}>
                Kategori olarak <strong>"Gelir"</strong> ve <strong>"Ödemeler"</strong> olarak belirlenen rutinlerinizi inceleyebilir, mali durumunuzu aylık takip edebilirsiniz.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <button
              onClick={() => onAddRoutineClick("Gelir")}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/35 border border-emerald-200/40 dark:border-emerald-900/40 text-emerald-750 dark:text-emerald-400 text-[10px] sm:text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Gelir Ekle</span>
            </button>
            <button
              onClick={() => onAddRoutineClick("Ödemeler")}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/35 border border-rose-200/50 dark:border-rose-900/40 text-rose-750 dark:text-rose-450 text-[10px] sm:text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Ödeme Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Financial Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Total Income Card */}
        <div className={statsCardClass}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              designTemplate === "terminal" ? "text-green-500" : "text-slate-400 dark:text-zinc-500"
            }`}>
              Toplam Gelir
            </span>
            <div className={`p-1 rounded-lg ${
              designTemplate === "terminal" ? "bg-zinc-900 text-emerald-400" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
            }`}>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {financeStats.totalExpectedInc.toLocaleString("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{" "}
              TL
            </div>
            <div className={`text-[10px] font-light flex items-center gap-1 leading-none ${
              designTemplate === "terminal" ? "text-zinc-500" : "text-slate-400 dark:text-zinc-400"
            }`}>
              <span>Kazanılan:</span>
              <strong className="text-emerald-500 dark:text-emerald-400 font-mono font-medium">
                {financeStats.totalCompletedInc.toLocaleString("tr-TR")} TL
              </strong>
            </div>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${
            designTemplate === "terminal" ? "bg-zinc-900" : "bg-slate-100 dark:bg-zinc-800"
          }`}>
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${
                  financeStats.totalExpectedInc > 0
                    ? Math.min(
                        100,
                        (financeStats.totalCompletedInc /
                          financeStats.totalExpectedInc) *
                          100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Total Payments Card */}
        <div className={statsCardClass}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              designTemplate === "terminal" ? "text-green-500" : "text-slate-400 dark:text-zinc-500"
            }`}>
              Toplam Ödeme
            </span>
            <div className={`p-1 rounded-lg ${
              designTemplate === "terminal" ? "bg-zinc-900 text-rose-455" : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-455"
            }`}>
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">
              {financeStats.totalExpectedPay.toLocaleString("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{" "}
              TL
            </div>
            <div className={`text-[10px] font-light flex items-center gap-1 leading-none ${
              designTemplate === "terminal" ? "text-zinc-500" : "text-slate-400 dark:text-zinc-400"
            }`}>
              <span>Ödenen:</span>
              <strong className="text-rose-500 dark:text-rose-400 font-mono font-medium">
                {financeStats.totalCompletedPay.toLocaleString("tr-TR")} TL
              </strong>
            </div>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${
            designTemplate === "terminal" ? "bg-zinc-900" : "bg-slate-100 dark:bg-zinc-800"
          }`}>
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{
                width: `${
                  financeStats.totalExpectedPay > 0
                    ? Math.min(
                        100,
                        (financeStats.totalCompletedPay /
                          financeStats.totalExpectedPay) *
                          100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Expected Balance Card */}
        <div className={`${statsCardClass} col-span-2 md:col-span-1`}>
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              designTemplate === "terminal" ? "text-green-500" : "text-slate-400 dark:text-zinc-500"
            }`}>
              Tahmini Bakiye
            </span>
            <div
              className={`p-1 rounded-lg ${
                designTemplate === "terminal" 
                  ? "bg-zinc-900 text-zinc-305" 
                  : (financeStats.expectedBalance >= 0
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400")
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div
              className={`text-base sm:text-lg font-bold font-mono ${
                financeStats.expectedBalance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-450"
              }`}
            >
              {financeStats.expectedBalance >= 0 ? "+" : ""}
              {financeStats.expectedBalance.toLocaleString("tr-TR")}{" "}
              TL
            </div>
            <div className={`text-[10px] font-light flex items-center gap-1 leading-none ${
              designTemplate === "terminal" ? "text-zinc-500" : "text-slate-400 dark:text-zinc-400"
            }`}>
              <span>Net Durum:</span>
              <strong
                className={`font-mono font-medium ${
                  financeStats.completedBalance >= 0
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {financeStats.completedBalance >= 0 ? "+" : ""}
                {financeStats.completedBalance.toLocaleString("tr-TR")} TL
              </strong>
            </div>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${
            designTemplate === "terminal" ? "bg-zinc-900" : "bg-slate-100 dark:bg-zinc-800"
          }`}>
            <div
              className={`h-full transition-all duration-500 ${
                financeStats.expectedBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"
              }`}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Auto-Extract Tip banner */}
      <div className={`p-2.5 flex items-start gap-2 text-[11px] leading-relaxed ${
        designTemplate === "terminal"
          ? "bg-black border border-dashed border-zinc-750 text-zinc-400 font-mono"
          : "bg-slate-50 dark:bg-zinc-850/40 rounded-xl border border-[#E5E5E5] dark:border-zinc-800/80 text-[#777777] dark:text-zinc-400 shadow-3xs"
      }`}>
        <Info className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
          designTemplate === "terminal" ? "text-green-500" : "text-slate-500 dark:text-zinc-300"
        }`} />
        <p>
          <strong>💡 Finansal Bilgilendirme:</strong> Dilediğinizde işlem tutarını doğrudan oluşturma ekranında girebilirsiniz. Otomatik yapay zeka miktar tarayıcısı başlık ve açıklamadaki sayısal değerleri bütçenize otomatik olarak dahil etmeye devam eder. (Örn: "Faturalar 450")
        </p>
      </div>

      {/* Section body: Dynamic Calendar occurrences + Active Routines configuration lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Specific Monthly occurrences checking sheet */}
        <div className={`lg:col-span-12 xl:col-span-7 ${listCardClass} space-y-3`}>
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1.5 border-b ${
            designTemplate === "terminal" ? "border-dashed border-zinc-700 dark:border-zinc-550" : "border-slate-100 dark:border-zinc-800"
          }`}>
            <div>
              <h3 className={`text-xs font-semibold flex items-center gap-1.5 leading-tight ${
                designTemplate === "terminal" ? "text-green-400 dark:text-green-400 font-mono" : "text-zinc-900 dark:text-zinc-100"
              }`}>
                📅 <span>Bu Ayın Ödeme & Gelir Takvimi</span>
              </h3>
              <p className={`text-[10px] font-light leading-snug mt-0.5 ${
                designTemplate === "terminal" ? "text-zinc-400 font-mono" : "text-slate-500 dark:text-zinc-400"
              }`}>
                Rutinlerinize planlanmış gerçekleşme günleridir. Tıklayarak işaretleyin.
              </p>
            </div>

            {/* Simple filtering controls */}
            <div className="flex bg-[#F5F5F5] dark:bg-zinc-800/60 p-0.5 rounded-lg w-fit text-[10px] font-semibold">
              {(["all", "pending", "completed"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                    filterMode === mode
                      ? `${activeClasses.accentBg} font-bold shadow-3xs`
                      : "text-slate-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {mode === "all" ? "Tümü" : mode === "pending" ? "Kalan" : "Yapılan"}
                </button>
              ))}
            </div>
          </div>

          {financialOccurrences.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E5E5E5] dark:border-zinc-800 rounded-xl bg-[#FBFBFB] dark:bg-zinc-900/40">
              <span className="text-base">💰</span>
              <p className="text-[11px] text-[#777777] dark:text-zinc-400 font-medium mt-0.5">
                Filtreye uygun finansal işlem kaydı bulunamadı.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {financialOccurrences.map((item) => {
                const isInc = item.routine.category.toLowerCase() === "gelir";

                let finalCardClass = `p-2 sm:p-2.5 rounded-lg border transition flex items-center justify-between gap-2.5 ${
                  item.isCompleted
                    ? "bg-[#F9F9F9]/60 dark:bg-zinc-950/20 border-slate-200/40 dark:border-zinc-900/40 opacity-60 text-slate-450 italic"
                    : "bg-white dark:bg-zinc-900 border-[#E5E5E5] dark:border-zinc-805 hover:border-[#CCCCCC] dark:hover:border-zinc-700"
                }`;
                let checkboxClass = `w-4.5 h-4.5 rounded-full flex items-center justify-center border cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 ${
                  item.isCompleted
                    ? "bg-[#1A1A1A] dark:bg-white border-transparent text-white dark:text-[#1A1A1A]"
                    : "bg-white dark:bg-zinc-950 border-[#CCCCCC] dark:border-zinc-700 text-[#CCCCCC] dark:text-zinc-500 hover:border-[#1A1A1A] dark:hover:border-white"
                }`;

                switch (designTemplate) {
                  case "brutalist":
                    finalCardClass = `p-2 sm:p-2.5 rounded-none border-2 border-black dark:border-zinc-300 transition flex items-center justify-between gap-2.5 ${
                      item.isCompleted
                        ? "bg-zinc-100 dark:bg-zinc-850 opacity-60 text-slate-450 italic"
                        : "bg-white dark:bg-zinc-900 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]"
                    }`;
                    checkboxClass = `w-4.5 h-4.5 rounded-none border-2 border-black dark:border-zinc-300 flex items-center justify-center cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 ${
                      item.isCompleted ? "bg-black dark:bg-white text-white dark:text-zinc-950" : "bg-white dark:bg-zinc-900"
                    }`;
                    break;
                  case "minimal":
                    finalCardClass = `p-2 sm:p-2.5 rounded-xl border border-[#E5E5E5]/40 dark:border-zinc-800/20 transition flex items-center justify-between gap-2.5 ${
                      item.isCompleted
                        ? "bg-slate-100/40 dark:bg-zinc-900/10 opacity-60 text-slate-400 italic"
                        : "bg-slate-50/70 dark:bg-zinc-900/30"
                    }`;
                    checkboxClass = `w-4.5 h-4.5 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-750 cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 ${
                      item.isCompleted ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent" : "bg-white dark:bg-zinc-900"
                    }`;
                    break;
                  case "terminal":
                    finalCardClass = `p-1.5 rounded-none border border-dashed border-zinc-750 dark:border-zinc-650 transition flex items-center justify-between gap-2 font-mono ${
                      item.isCompleted
                        ? "bg-zinc-950 opacity-50 text-zinc-500 italic"
                        : "bg-black text-zinc-350"
                    }`;
                    checkboxClass = `w-4 h-4 rounded-none border border-dashed border-zinc-500 flex items-center justify-center cursor-pointer shrink-0 transition-all ${
                      item.isCompleted ? "bg-zinc-800 text-black border-transparent" : "bg-black text-zinc-500 hover:border-zinc-450"
                    }`;
                    break;
                }

                return (
                  <div
                    key={item.id}
                    className={finalCardClass}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Checkbox trigger */}
                      <button
                        type="button"
                        onClick={() => onToggleComplete(item.routine.id, item.dateStr)}
                        className={checkboxClass}
                      >
                        {item.isCompleted ? (
                           <Check className="w-2 h-2 stroke-[3] text-white dark:text-[#1A1A1A]" />
                        ) : (
                          <Circle className="w-2 h-2 opacity-30" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1 py-0.5 rounded text-[7px] font-extrabold uppercase tracking-wide leading-none ${
                              isInc
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
                                : "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/40"
                            }`}
                          >
                            {isInc ? "Gelir" : "Ödeme"}
                          </span>
                          <span className={`text-[9px] font-mono ${
                            designTemplate === "terminal" ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-450"
                          }`}>
                            {formatToTurkishDate(item.dateStr)}
                          </span>
                        </div>
                        <h4
                          className={`text-xs font-semibold truncate mt-0.5 ${
                            designTemplate === "terminal" 
                              ? (item.isCompleted ? "line-through text-zinc-600 font-normal italic" : "text-zinc-100") 
                              : (item.isCompleted ? "line-through text-slate-400 font-normal italic" : "text-zinc-900 dark:text-zinc-100")
                          }`}
                        >
                          {item.routine.title}
                        </h4>
                        {item.routine.description && (
                          <p className={`text-[9px] truncate mt-0.5 font-light ${
                            designTemplate === "terminal" ? "text-zinc-400" : "text-slate-450 dark:text-zinc-500"
                          }`}>
                            {item.routine.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount design */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold font-mono block leading-none ${
                          isInc
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-455"
                        }`}
                      >
                        {isInc ? "+" : "-"}
                        {item.amount.toLocaleString("tr-TR")} TL
                      </span>
                      <span className={`text-[8.5px] block mt-0.5 ${
                        designTemplate === "terminal" ? "text-zinc-550 font-mono" : "text-[#777777] dark:text-zinc-550 font-medium"
                      }`}>
                        🕒 {item.routine.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Configured Financial Routines List */}
        <div className={`lg:col-span-12 xl:col-span-5 ${listCardClass} space-y-3`}>
          <div className={`pb-1.5 border-b ${
            designTemplate === "terminal" ? "border-dashed border-zinc-700 dark:border-zinc-550" : "border-slate-100 dark:border-zinc-800"
          }`}>
            <h3 className={`text-xs font-semibold flex items-center gap-1.5 leading-tight ${
              designTemplate === "terminal" ? "text-green-400 dark:text-green-400 font-mono" : "text-zinc-900 dark:text-zinc-100"
            }`}>
              ⚙️ <span>Finansal Şablonlar ({financeRoutines.length})</span>
            </h3>
            <p className={`text-[10px] font-light mt-0.5 leading-snug ${
              designTemplate === "terminal" ? "text-zinc-400 font-mono" : "text-slate-500 dark:text-zinc-400"
            }`}>
              Sistemde kayıtlı mali rutin şablonlarınız.
            </p>
          </div>

          {financeRoutines.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E5E5E5] dark:border-zinc-800 rounded-xl bg-[#FBFBFB] dark:bg-zinc-900/40">
              <p className="text-[11px] text-[#777777] dark:text-zinc-400 font-medium">Finansal rutin şablonu bulunmadı.</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {financeRoutines.map((routine) => {
                const isInc = routine.category.toLowerCase() === "gelir";
                const baseAmount = extractAmount(routine.title, routine.description);
                return (
                  <div
                    key={routine.id}
                    className={`p-2 transition ${
                      designTemplate === "terminal" 
                        ? "bg-black border border-dashed border-zinc-700 rounded-none font-mono" 
                        : "bg-[#FCFCFC] dark:bg-zinc-950/30 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isInc ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <span className={`text-[9px] font-bold tracking-tight leading-none ${
                            designTemplate === "terminal" ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-450"
                          }`}>
                            {routine.category}
                          </span>
                          <span className="text-slate-300 dark:text-zinc-800 leading-none">•</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded leading-none ${
                            designTemplate === "terminal" 
                              ? "bg-zinc-900 text-zinc-400" 
                              : "bg-slate-100 dark:bg-zinc-800 text-slate-450 text-[8px]"
                          }`}>
                            {routine.frequency === "daily"
                              ? "Her Gün"
                              : routine.frequency === "weekly"
                              ? "Haftalık"
                              : "Aylık"}
                          </span>
                        </div>

                        <h4 className={`text-[11px] font-bold truncate mt-1 ${
                          designTemplate === "terminal" ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-150"
                        }`}>
                          {routine.title}
                        </h4>
                        
                        {routine.description && (
                          <p className={`text-[9px] line-clamp-1 mt-0.5 font-light leading-none ${
                            designTemplate === "terminal" ? "text-zinc-400" : "text-[#777777] dark:text-zinc-505"
                          }`}>
                            {routine.description}
                          </p>
                        )}
                        
                        <div className={`text-[8px] font-medium mt-1 flex items-center gap-1 ${
                          designTemplate === "terminal" ? "text-zinc-550 font-mono" : "text-slate-400 dark:text-zinc-550"
                        }`}>
                          <span>💡 Zaman:</span>
                          <strong className={
                            designTemplate === "terminal" ? "text-green-500" : "text-zinc-650 dark:text-zinc-350"
                          }>{routine.time}</strong>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <span className={`text-xs font-bold font-mono leading-none ${
                          designTemplate === "terminal" ? "text-zinc-100" : "text-zinc-800 dark:text-zinc-200"
                        }`}>
                          {baseAmount.toLocaleString("tr-TR")} TL
                        </span>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onEditRoutine(routine)}
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 rounded"
                            title="Şablonu Düzenle"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRoutine(routine.id)}
                            className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-450 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 rounded"
                            title="Şablonu Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
