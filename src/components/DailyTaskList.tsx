/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Check, Circle, Trash2, Edit3, Clock, AlertCircle, Sparkles, Smile, MessageSquareCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Routine, RoutineLog } from "../types";
import { getOccurrencesForDate, formatToTurkishDate, toLocalDateString, isWithinOneYear } from "../utils/dateUtils";

interface DailyTaskListProps {
  id?: string;
  dateStr: string;
  routines: Routine[];
  logs: RoutineLog[];
  onToggleComplete: (routineId: string, dateStr: string) => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  activeTheme?: string;
  designTemplate?: string;
}

const COMP_THEME: Record<string, {
  accentBg: string;
  accentText: string;
  gaugeCircle: string;
  progressFill: string;
}> = {
  orange: {
    accentBg: "bg-orange-500 text-white dark:bg-orange-550 dark:text-black",
    accentText: "text-orange-600 dark:text-orange-400 font-bold",
    gaugeCircle: "bg-orange-500 text-white dark:bg-orange-550 dark:text-black",
    progressFill: "bg-orange-500 dark:bg-orange-450"
  },
  lime: {
    accentBg: "bg-lime-500 text-black dark:bg-[#a3e635] dark:text-black",
    accentText: "text-lime-700 dark:text-[#a3e635]",
    gaugeCircle: "bg-lime-500 text-black dark:bg-[#a3e635] dark:text-black",
    progressFill: "bg-[#84cc16] dark:bg-[#a3e635]"
  },
  yellow: {
    accentBg: "bg-yellow-400 text-black dark:bg-yellow-400 dark:text-black",
    accentText: "text-amber-700 dark:text-yellow-400",
    gaugeCircle: "bg-yellow-400 text-black dark:bg-yellow-400 dark:text-black",
    progressFill: "bg-[#eab308] dark:bg-yellow-400"
  },
  blue: {
    accentBg: "bg-blue-600 text-white dark:bg-blue-500 dark:text-black",
    accentText: "text-blue-600 dark:text-blue-400",
    gaugeCircle: "bg-blue-600 text-white dark:bg-blue-500 dark:text-black",
    progressFill: "bg-blue-600 dark:bg-blue-500"
  },
  violet: {
    accentBg: "bg-violet-605 text-white dark:bg-violet-550 dark:text-black",
    accentText: "text-violet-605 dark:text-violet-400",
    gaugeCircle: "bg-violet-605 text-white dark:bg-violet-550 dark:text-black",
    progressFill: "bg-violet-650 dark:bg-violet-550"
  },
  rose: {
    accentBg: "bg-rose-600 text-white dark:bg-rose-500 dark:text-black",
    accentText: "text-rose-600 dark:text-rose-400",
    gaugeCircle: "bg-rose-600 text-white dark:bg-rose-500 dark:text-black",
    progressFill: "bg-rose-600 dark:bg-rose-500"
  }
};

const COLOR_MAP = {
  indigo: {
    border: "border-[#E5E5E5] dark:border-zinc-850",
    bg: "bg-[#F9F9F9] dark:bg-zinc-850/40",
    text: "text-[#1A1A1A] dark:text-zinc-150",
    badge: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-400 border border-[#E5E5E5] dark:border-zinc-700",
    accent: "bg-[#1A1A1A] dark:bg-zinc-400",
    checkbox: "border-[#CCCCCC] dark:border-zinc-700 text-[#1A1A1A] dark:text-zinc-100 focus:ring-[#1A1A1A]",
  },
  emerald: {
    border: "border-[#E5E5E5] dark:border-zinc-850",
    bg: "bg-[#F9F9F9] dark:bg-zinc-850/40",
    text: "text-[#1A1A1A] dark:text-zinc-150",
    badge: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-400 border border-[#E5E5E5] dark:border-zinc-700",
    accent: "bg-[#1A1A1A] dark:bg-zinc-450",
    checkbox: "border-[#CCCCCC] dark:border-zinc-700 text-[#1A1A1A] dark:text-zinc-100 focus:ring-[#1A1A1A]",
  },
  amber: {
    border: "border-[#E5E5E5] dark:border-zinc-850",
    bg: "bg-[#F9F9F9] dark:bg-zinc-850/40",
    text: "text-[#1A1A1A] dark:text-zinc-150",
    badge: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-400 border border-[#E5E5E5] dark:border-zinc-700",
    accent: "bg-[#1A1A1A] dark:bg-zinc-400",
    checkbox: "border-[#CCCCCC] dark:border-zinc-700 text-[#1A1A1A] dark:text-zinc-100 focus:ring-[#1A1A1A]",
  },
  rose: {
    border: "border-[#E5E5E5] dark:border-zinc-850",
    bg: "bg-[#F9F9F9] dark:bg-zinc-850/40",
    text: "text-[#1A1A1A] dark:text-zinc-150",
    badge: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-400 border border-[#E5E5E5] dark:border-zinc-700",
    accent: "bg-[#1A1A1A] dark:bg-zinc-400",
    checkbox: "border-[#CCCCCC] dark:border-zinc-700 text-[#1A1A1A] dark:text-zinc-100 focus:ring-[#1A1A1A]",
  },
  sky: {
    border: "border-[#E5E5E5] dark:border-zinc-850",
    bg: "bg-[#F9F9F9] dark:bg-zinc-850/40",
    text: "text-[#1A1A1A] dark:text-zinc-150",
    badge: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-400 border border-[#E5E5E5] dark:border-zinc-700",
    accent: "bg-[#1A1A1A] dark:bg-zinc-400",
    checkbox: "border-[#CCCCCC] dark:border-zinc-700 text-[#1A1A1A] dark:text-zinc-100 focus:ring-[#1A1A1A]",
  },
  violet: {
    border: "border-[#E5E5E5] dark:border-zinc-850",
    bg: "bg-[#F9F9F9] dark:bg-zinc-850/40",
    text: "text-[#1A1A1A] dark:text-zinc-150",
    badge: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-400 border border-[#E5E5E5] dark:border-zinc-700",
    accent: "bg-[#1A1A1A] dark:bg-zinc-400",
    checkbox: "border-[#CCCCCC] dark:border-zinc-700 text-[#1A1A1A] dark:text-zinc-100 focus:ring-[#1A1A1A]",
  },
};

export default function DailyTaskList({
  id = "daily-task-list",
  dateStr,
  routines,
  logs,
  onToggleComplete,
  onEditRoutine,
  onDeleteRoutine,
  activeTheme = "orange",
  designTemplate = "modern",
}: DailyTaskListProps) {
  const ct = COMP_THEME[activeTheme] || COMP_THEME.orange || COMP_THEME.yellow;

  const containerClass = useMemo(() => {
    switch (designTemplate) {
      case "brutalist":
        return "bg-white dark:bg-zinc-1050 rounded-none border-2 border-black dark:border-zinc-250 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] p-4 sm:p-5 flex flex-col h-full space-y-4 transition-colors duration-200";
      case "minimal":
        return "bg-slate-50/50 dark:bg-zinc-900/40 rounded-3xl border border-transparent shadow-none hover:bg-slate-50 dark:hover:bg-zinc-900/50 p-4 sm:p-5 flex flex-col h-full space-y-4 transition-colors duration-200";
      case "terminal":
        return "bg-[#09090b] text-zinc-300 rounded-none border border-dashed border-zinc-700 dark:border-zinc-500 shadow-none font-mono p-4 sm:p-5 flex flex-col h-full space-y-4 transition-colors duration-200";
      default:
        return "bg-white dark:bg-zinc-900 rounded-2xl border border-[#E5E5E5] dark:border-zinc-805 shadow-xs p-4 sm:p-5 flex flex-col h-full space-y-4 transition-colors duration-200";
    }
  }, [designTemplate]);

  const [currentHHMM, setCurrentHHMM] = React.useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentHHMM(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentOccurrences = useMemo(() => {
    return getOccurrencesForDate(routines, dateStr);
  }, [routines, dateStr]);

  const stats = useMemo(() => {
    const total = currentOccurrences.length;
    if (total === 0) return { total: 0, completed: 0, percentage: 0 };

    let completed = 0;
    currentOccurrences.forEach((routine) => {
      const logId = `${routine.id}_${dateStr}`;
      const isComp = logs.some((l) => l.id === logId && l.completed);
      if (isComp) completed++;
    });

    return {
      total,
      completed,
      percentage: Math.round((completed / total) * 100),
    };
  }, [currentOccurrences, logs, dateStr]);

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);
  const titleDateFormatted = useMemo(() => formatToTurkishDate(dateStr), [dateStr]);

  const isToday = todayStr === dateStr;
  const isPast = dateStr < todayStr;
  const isFuture = dateStr > todayStr;

  const validLimits = isWithinOneYear(dateStr);

  return (
    <div id={id} className={containerClass}>
      {/* List Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b ${
        designTemplate === "terminal" ? "border-dashed border-zinc-700 dark:border-zinc-500" : "border-[#E5E5E5] dark:border-zinc-800"
      }`}>
        <div>
          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${ct.accentBg}`}>
            {isToday ? "BUGÜNÜN RAPORU" : isPast ? "GEÇMİŞ RAPOR" : "GELECEK PLAN"}
          </span>
          <h3 id={`${id}-title`} className={`text-sm sm:text-base font-semibold mt-1 leading-tight ${
            designTemplate === "terminal" ? "text-green-400 dark:text-green-400 font-mono" : "text-[#1A1A1A] dark:text-zinc-100"
          }`}>
            {titleDateFormatted}
          </h3>
        </div>

        {/* Completion Gauge Badge */}
        {stats.total > 0 && (
          <div className={`flex items-center space-x-2 p-1.5 shrink-0 ${
            designTemplate === "terminal" 
              ? "bg-black border border-dashed border-zinc-755 font-mono text-zinc-300 rounded-none" 
              : "bg-[#F9F9F9] dark:bg-zinc-850 rounded-lg border border-[#E5E5E5] dark:border-zinc-800"
          }`}>
            <div className="text-right">
              <span className={`text-[9px] font-medium block ${
                designTemplate === "terminal" ? "text-zinc-500" : "text-[#777777] dark:text-zinc-450"
              }`}>Tamamlanma</span>
              <span id={`${id}-stats-text`} className={`text-[10px] font-bold font-mono ${
                designTemplate === "terminal" ? "text-green-400" : "text-[#1A1A1A] dark:text-zinc-300"
              }`}>
                {stats.completed}/{stats.total} Rutin
              </span>
            </div>
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full font-bold text-[10px] shrink-0 ${ct.gaugeCircle}`}>
              {stats.percentage}%
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar Animation */}
      {stats.total > 0 && (
        <div className="space-y-1">
          <div className={`flex items-center justify-between text-[11px] font-medium ${
            designTemplate === "terminal" ? "text-zinc-400 font-mono" : "text-[#777777] dark:text-zinc-400"
          }`}>
            <span>Rutin İlerleme</span>
            <span>{stats.percentage === 100 ? "Tüm hedefler tamamlandı 🎉" : `${stats.percentage}%`}</span>
          </div>
          <div className="w-full bg-[#F0F0F0] dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.percentage}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`h-full rounded-full ${ct.progressFill}`}
            />
          </div>
        </div>
      )}

      {/* Main Task List Content */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[500px] pr-1.5 scrollbar-thin">
        {!validLimits ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-[#777777] dark:text-zinc-550 space-y-2.5">
            <div className="p-2.5 bg-[#F9F9F9] dark:bg-zinc-850 rounded-full text-[#1A1A1A] dark:text-white border border-[#E5E5E5] dark:border-zinc-800">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#1A1A1A] dark:text-zinc-200">Takvim Sınırı Dışında</p>
            <p className="text-[11px] max-w-sm text-[#888888] dark:text-zinc-400">
              Yerel veritabanı performansını yüksek tutmak için rutinler sadece girilen bugünden itibaren en fazla 1 yıl ileriye kadar görüntülenebilir.
            </p>
          </div>
        ) : currentOccurrences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5">
            <div className="w-12 h-12 bg-[#F9F9F9] dark:bg-zinc-850 rounded-full flex items-center justify-center text-[#999999] dark:text-zinc-400 border border-[#E5E5E5] dark:border-zinc-800">
              <Smile className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-[#1A1A1A] dark:text-zinc-200">Bu gün için planlanmış rutin bulunmuyor</p>
            <p className="text-[11px] text-[#888888] dark:text-zinc-400 max-w-xs font-light font-sans">
              Soldaki panelden yeni ve tekrarlayan rutin işler ekleyebilir veya günleri gezebilirsiniz.
            </p>
          </div>
        ) : (
          <div id={`${id}-items-container`} className="space-y-1.5">
            <AnimatePresence initial={false}>
              {currentOccurrences.map((routine) => {
                const logId = `${routine.id}_${dateStr}`;
                const log = logs.find((l) => l.id === logId);
                const isCompleted = log?.completed || false;
                const isBeforeTime = isFuture || (isToday && routine.time > currentHHMM);
                
                const cStyle = COLOR_MAP[routine.color] || COLOR_MAP.emerald;

                let cardClass = "";
                let accentBarClass = "";
                let checkboxClass = "";

                switch (designTemplate) {
                  case "brutalist":
                    cardClass = `group relative flex items-center justify-between p-2 rounded-none border-2 border-black dark:border-zinc-200 ${
                      isCompleted ? "bg-zinc-100 dark:bg-zinc-805 opacity-70" : "bg-white dark:bg-zinc-900"
                    } shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] transition duration-200`;
                    accentBarClass = `absolute left-0 top-0 bottom-0 w-1.5 ${cStyle.accent}`;
                    checkboxClass = `w-4.5 h-4.5 rounded-none border-2 border-black dark:border-zinc-300 flex items-center justify-center cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 ${
                      isCompleted ? "bg-black dark:bg-white text-white dark:text-zinc-950" : "bg-white dark:bg-zinc-900"
                    }`;
                    break;
                  case "minimal":
                    cardClass = `group relative flex items-center justify-between p-2 rounded-xl border border-[#E5E5E5]/40 dark:border-zinc-800/20 ${
                      isCompleted ? "bg-slate-100/40 dark:bg-zinc-900/10 opacity-70" : "bg-slate-50/70 dark:bg-zinc-900/30"
                    } hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition duration-150`;
                    accentBarClass = `absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${cStyle.accent}`;
                    checkboxClass = `w-4.5 h-4.5 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-750 cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 ${
                      isCompleted ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent" : "bg-white dark:bg-zinc-900"
                    }`;
                    break;
                  case "terminal":
                    cardClass = `group relative flex items-center justify-between p-1.5 text-zinc-300 rounded-none border border-dashed border-zinc-700 dark:border-zinc-650 ${
                      isCompleted ? "bg-zinc-950 opacity-60 text-zinc-500" : "bg-black"
                    } font-mono transition duration-100`;
                    accentBarClass = `absolute left-0 top-0 bottom-0 w-1 bg-zinc-700`;
                    checkboxClass = `w-4 h-4 rounded-none border border-dashed border-zinc-500 flex items-center justify-center cursor-pointer shrink-0 transition-all ${
                      isCompleted ? "bg-zinc-800 text-black border-transparent" : "bg-black text-zinc-500 hover:border-zinc-400"
                    }`;
                    break;
                  default:
                    cardClass = `group relative flex items-center justify-between p-2 rounded-lg border ${cStyle.border} ${
                      isCompleted ? "bg-[#F9F9F9]/70 dark:bg-zinc-850/20 opacity-75" : "bg-white dark:bg-zinc-900"
                    } hover:border-[#CCCCCC] dark:hover:border-zinc-750 transition duration-200`;
                    accentBarClass = `absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${cStyle.accent}`;
                    checkboxClass = `w-4.5 h-4.5 rounded-full flex items-center justify-center border cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 ${
                      isCompleted
                        ? "bg-[#1A1A1A] dark:bg-white border-transparent text-white dark:text-[#1A1A1A]"
                        : "bg-white dark:bg-zinc-900 border-[#CCCCCC] dark:border-zinc-700 text-[#CCCCCC] hover:border-[#1A1A1A] dark:hover:border-zinc-400"
                    }`;
                    break;
                }

                return (
                  <motion.div
                    key={routine.id}
                    id={`${id}-item-${routine.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cardClass}
                  >
                    {/* Left Accent Bar */}
                    <div className={accentBarClass} />

                    {/* Left Interactive Section */}
                    <div className="flex items-center space-x-2.5 pl-1 flex-1">
                      {/* Checkbox Trigger button */}
                      <button
                        type="button"
                        id={`${id}-check-btn-${routine.id}`}
                        onClick={() => onToggleComplete(routine.id, dateStr)}
                        className={checkboxClass}
                      >
                        {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : <Circle className="w-3 h-3 opacity-30" />}
                      </button>

                      {/* Info and Titles */}
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4
                            className={`text-sm font-medium transition-all ${
                              designTemplate === "terminal" 
                                ? (isCompleted ? "line-through text-zinc-600 font-normal italic" : "text-zinc-100") 
                                : (isCompleted ? "line-through text-[#888888] dark:text-zinc-550 italic" : "text-[#1A1A1A] dark:text-zinc-200")
                            }`}
                          >
                            {routine.title}
                          </h4>
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${cStyle.badge}`}>
                            {routine.category}
                          </span>
                        </div>
                        {routine.description && (
                          <p className={`text-xs line-clamp-1 ${
                            designTemplate === "terminal"
                              ? (isCompleted ? "line-through text-zinc-650" : "text-zinc-400")
                              : (isCompleted ? "line-through text-[#999999] dark:text-zinc-650" : "text-[#777777] dark:text-zinc-400")
                          }`}>
                            {routine.description}
                          </p>
                        )}

                        {/* Clock / Time label */}
                        <div className={`flex items-center text-[11px] font-normal flex-wrap gap-1.5 mt-0.5 ${
                          designTemplate === "terminal" ? "text-zinc-500 font-mono" : "text-[#888888] dark:text-zinc-400"
                        }`}>
                          <div className="flex items-center">
                            <Clock className={`w-3.5 h-3.5 mr-1 ${
                              designTemplate === "terminal" ? "text-zinc-600" : "text-[#888888] dark:text-zinc-550"
                            }`} />
                            <span>Saat {routine.time}</span>
                          </div>
                          <span className="text-[#CCCCCC] dark:text-zinc-700">•</span>
                          <span>
                            {routine.frequency === "daily"
                              ? "Her Gün"
                              : routine.frequency === "weekly"
                              ? "Haftalık"
                              : "Aylık"}
                          </span>
                          
                          {isBeforeTime && !isCompleted && (
                            <>
                              <span className="text-[#CCCCCC] dark:text-zinc-700">•</span>
                              <button
                                type="button"
                                id={`${id}-early-btn-${routine.id}`}
                                onClick={() => onToggleComplete(routine.id, dateStr)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-amber-800 dark:text-amber-350 hover:text-emerald-800 dark:hover:text-emerald-400 border border-amber-200 dark:border-amber-900/60 hover:border-emerald-350 font-semibold text-[10px] uppercase tracking-wide cursor-pointer transition shadow-2xs"
                                title="Rutin görevini vaktinden önce tamamla"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                                <span className="text-[9px]">Vaktinden Önce Tamamla</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Administrative Buttons */}
                    <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition absolute right-3 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0">
                      <button
                        id={`${id}-edit-${routine.id}`}
                        onClick={() => onEditRoutine(routine)}
                        className="p-1.5 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 rounded-lg text-[#999999] dark:text-zinc-500 hover:text-[#1A1A1A] dark:hover:text-white transition cursor-pointer"
                        title="Rutini Düzenle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        id={`${id}-delete-${routine.id}`}
                        onClick={() => onDeleteRoutine(routine.id)}
                        className="p-1.5 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 rounded-lg text-[#999999] dark:text-zinc-500 hover:text-[#FF3333] dark:hover:text-red-400 transition cursor-pointer"
                        title="Rutini Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Tip of Context */}
      {stats.total > 0 && stats.percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#F9F9F9] dark:bg-zinc-850 border border-[#E5E5E5] dark:border-zinc-800 p-3.5 rounded-xl text-xs text-[#1A1A1A] dark:text-zinc-300 flex items-start gap-2.5"
        >
          <Sparkles className="w-4 h-4 mt-0.5 text-[#1A1A1A] dark:text-white" />
          <div>
            <strong className="font-semibold dark:text-white">Günün Tüm Rutinleri Tamamlandı!</strong>
            <p className="text-[#666666] dark:text-zinc-400 mt-0.5">Mükemmel gidiyorsunuz! Rutinlerinizi aksatmamak yeni alışkanlıklar edinmenize harika bir destek sağlar.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
