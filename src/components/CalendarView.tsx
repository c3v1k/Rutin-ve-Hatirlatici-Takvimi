/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { Routine, RoutineLog } from "../types";
import { getCalendarGrid, getOccurrencesForDate, toLocalDateString, isWithinOneYear } from "../utils/dateUtils";

interface CalendarViewProps {
  id?: string;
  routines: Routine[];
  logs: RoutineLog[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeTheme?: string;
  calendarWeeks?: number;
  designTemplate?: string;
}

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const WEEKDAYS_SHORT_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const CAL_THEME: Record<string, {
  selectedBg: string;
  legendBg: string;
}> = {
  orange: {
    selectedBg: "bg-orange-500 hover:bg-orange-600 text-white font-bold",
    legendBg: "bg-orange-500 dark:bg-orange-500"
  },
  lime: {
    selectedBg: "bg-[#a3e635] hover:bg-[#84cc16] text-zinc-950 font-bold",
    legendBg: "bg-[#a3e635] dark:bg-[#a3e635]"
  },
  yellow: {
    selectedBg: "bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold",
    legendBg: "bg-yellow-400 dark:bg-yellow-400"
  },
  blue: {
    selectedBg: "bg-blue-600 dark:bg-blue-550 hover:bg-blue-700 text-white font-bold",
    legendBg: "bg-blue-600 dark:bg-blue-550"
  },
  violet: {
    selectedBg: "bg-violet-605 dark:bg-violet-550 hover:bg-violet-700 text-white font-bold",
    legendBg: "bg-violet-605 dark:bg-violet-550"
  },
  rose: {
    selectedBg: "bg-rose-600 dark:bg-rose-550 hover:bg-rose-700 text-white font-bold",
    legendBg: "bg-rose-600 dark:bg-rose-550"
  }
};

export default function CalendarView({
  id = "calendar-view",
  routines,
  logs,
  selectedDate,
  onSelectDate,
  activeTheme = "orange",
  calendarWeeks = 35,
  designTemplate = "modern",
}: CalendarViewProps) {
  const curCalTheme = CAL_THEME[activeTheme] || CAL_THEME.orange || CAL_THEME.yellow;

  const containerClass = useMemo(() => {
    switch (designTemplate) {
      case "brutalist":
        return "bg-white dark:bg-zinc-950 rounded-none border-2 border-black dark:border-zinc-250 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex flex-col h-full overflow-hidden transition-colors duration-200";
      case "minimal":
        return "bg-slate-50/50 dark:bg-zinc-900/30 rounded-3xl border border-transparent shadow-none hover:bg-slate-50 dark:hover:bg-zinc-900/50 flex flex-col h-full overflow-hidden transition-colors duration-200";
      case "terminal":
        return "bg-[#09090b] text-zinc-300 rounded-none border border-dashed border-zinc-700 dark:border-zinc-500 shadow-none font-mono flex flex-col h-full overflow-hidden transition-colors duration-200";
      default:
        return "bg-white dark:bg-zinc-900 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col h-full transition-colors duration-200";
    }
  }, [designTemplate]);

  const headerClass = useMemo(() => {
    switch (designTemplate) {
      case "brutalist":
        return "flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b-2 border-black dark:border-zinc-200";
      case "minimal":
        return "flex items-center justify-between px-4 py-3 bg-transparent border-b border-zinc-150/10";
      case "terminal":
        return "flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-dashed border-zinc-700 dark:border-zinc-500";
      default:
        return "flex items-center justify-between px-4 py-2.5 border-b border-[#E5E5E5] dark:border-zinc-800 bg-[#F9F9F9] dark:bg-zinc-800/50";
    }
  }, [designTemplate]);

  const gridClass = useMemo(() => {
    switch (designTemplate) {
      case "brutalist":
        return "grid grid-cols-7 flex-1 bg-white dark:bg-zinc-950 divide-x-2 divide-y-2 divide-black dark:divide-zinc-200 border-r border-b border-black dark:border-zinc-250";
      case "minimal":
        return "grid grid-cols-7 flex-1 bg-transparent divide-x divide-y divide-zinc-100/10 dark:divide-zinc-900/10 border-0";
      case "terminal":
        return "grid grid-cols-7 flex-1 bg-black divide-x divide-y divide-dashed divide-zinc-700 dark:divide-zinc-550 border-r border-b border-dashed border-zinc-700 dark:border-zinc-550";
      default:
        return "grid grid-cols-7 flex-1 bg-white dark:bg-zinc-900 divide-x divide-y divide-[#E5E5E5] dark:divide-zinc-800 border-r border-b border-[#E5E5E5] dark:border-zinc-800";
    }
  }, [designTemplate]);

  const [currentDate, setCurrentDate] = useState(() => {
    const sel = new Date(selectedDate + "T00:00:00");
    return isNaN(sel.getTime()) ? new Date() : sel;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    // Restrict calendar navigation if next month is completely beyond the 1-year window
    const today = new Date();
    const limitDate = new Date();
    limitDate.setFullYear(today.getFullYear() + 1);
    limitDate.setMonth(limitDate.getMonth() + 1); // allow buffer

    const targetDate = new Date(year, month + 1, 1);
    if (targetDate.getTime() <= limitDate.getTime()) {
      setCurrentDate(targetDate);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onSelectDate(toLocalDateString(today));
  };

  const gridDays = useMemo(() => {
    const fullGrid = getCalendarGrid(year, month);
    return fullGrid.slice(0, calendarWeeks);
  }, [year, month, calendarWeeks]);

  // Compute stats for each day visible in the grid
  const dayStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; routines: Routine[] }> = {};

    gridDays.forEach(({ dateStr }) => {
      // Get all routines that occur on this date
      const scheduledRoutines = getOccurrencesForDate(routines, dateStr);

      if (scheduledRoutines.length > 0) {
        // Find how many of these occurrences are completed
        let completedCount = 0;
        scheduledRoutines.forEach((rut) => {
          const logKey = `${rut.id}_${dateStr}`;
          const isCompleted = logs.some((l) => l.id === logKey && l.completed);
          if (isCompleted) {
            completedCount++;
          }
        });

        stats[dateStr] = {
          total: scheduledRoutines.length,
          completed: completedCount,
          routines: scheduledRoutines,
        };
      }
    });

    return stats;
  }, [gridDays, routines, logs]);

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);

  return (
    <div id={id} className={containerClass}>
      {/* Calendar Header Control */}
      <div className={headerClass}>
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 ${
            designTemplate === "brutalist" ? "rounded-none border border-black" : 
            designTemplate === "terminal" ? "rounded-none border border-dashed border-zinc-700 bg-zinc-950 text-green-400" : "rounded-lg"
          } ${
            designTemplate === "terminal" ? "" : "bg-[#F0F0F0] dark:bg-zinc-800 text-[#1A1A1A] dark:text-white"
          } shrink-0`}>
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm sm:text-base font-semibold leading-tight ${
              designTemplate === "terminal" ? "text-green-400 dark:text-green-400 font-mono" : "text-[#1A1A1A] dark:text-white"
            }`}>
              {MONTHS_TR[month]} {year}
            </h2>
            <p className={`text-[10px] hidden sm:block ${
              designTemplate === "terminal" ? "text-zinc-500 dark:text-zinc-500 font-mono" : "text-[#888888] dark:text-zinc-400"
            }`}>Aylık rutininize genel bakış</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            id={`${id}-prev-month-btn`}
            onClick={handlePrevMonth}
            className={`p-1 transition cursor-pointer ${
              designTemplate === "brutalist" ? "rounded-none border-2 border-black hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#777777] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white" :
              designTemplate === "terminal" ? "rounded-none border border-dashed border-zinc-700 bg-black hover:bg-zinc-900 text-green-400 border-zinc-650" :
              "rounded-md border border-[#E5E5E5] dark:border-zinc-800 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#777777] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white"
            }`}
            title="Önceki Ay"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <button
            id={`${id}-today-btn`}
            onClick={handleGoToToday}
            className={`px-2 py-1 transition cursor-pointer text-[10px] font-medium ${
              designTemplate === "brutalist" ? "rounded-none border-2 border-black hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#1A1A1A] dark:text-zinc-350" :
              designTemplate === "terminal" ? "rounded-none border border-dashed border-zinc-700 bg-black hover:bg-zinc-900 text-green-400" :
              "rounded-md border border-[#E5E5E5] dark:border-zinc-800 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#1A1A1A] dark:text-zinc-350"
            }`}
          >
            Bugün
          </button>

          <button
            id={`${id}-next-month-btn`}
            onClick={handleNextMonth}
            className={`p-1 transition cursor-pointer ${
              designTemplate === "brutalist" ? "rounded-none border-2 border-black hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#777777] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white" :
              designTemplate === "terminal" ? "rounded-none border border-dashed border-zinc-700 bg-black hover:bg-zinc-900 text-green-400 border-zinc-650" :
              "rounded-md border border-[#E5E5E5] dark:border-zinc-800 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 text-[#777777] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white"
            }`}
            title="Sonraki Ay"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekdays Labels Header */}
      <div className={`grid grid-cols-7 text-center py-1 sm:py-1.5 border-b animate-fade-in ${
        designTemplate === "brutalist" ? "bg-white dark:bg-zinc-900 border-black dark:border-zinc-200 border-b-2" :
        designTemplate === "minimal" ? "bg-transparent border-zinc-150/10" :
        designTemplate === "terminal" ? "bg-zinc-950 border-dashed border-zinc-700 dark:border-zinc-550" :
        "bg-[#F9F9F9] dark:bg-zinc-850/50 border-[#E5E5E5] dark:border-zinc-800"
      }`}>
        {WEEKDAYS_SHORT_TR.map((dayLabel, index) => (
          <span
            key={dayLabel}
            className={`text-[10px] sm:text-xs font-semibold tracking-wider ${
              designTemplate === "terminal" ? (index >= 5 ? "text-zinc-500" : "text-green-500") :
              (index >= 5 ? "text-[#888888] dark:text-zinc-500" : "text-[#777777] dark:text-zinc-400")
            }`}
          >
            {dayLabel}
          </span>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div id={`${id}-grid`} className={gridClass}>
        {gridDays.map(({ dateStr, day, isCurrentMonth }) => {
          const stats = dayStats[dateStr];
          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;
          const isPast = dateStr < todayStr;
          
          // Limits check
          const withinLimits = isWithinOneYear(dateStr);
          const curCalTheme = CAL_THEME[activeTheme] || CAL_THEME.basic;
          // Calculate styling class names
          let dayTextClass = isCurrentMonth 
            ? (designTemplate === "terminal" ? "text-zinc-300 dark:text-zinc-100" : "text-[#1A1A1A] dark:text-zinc-100")
            : (designTemplate === "terminal" ? "text-zinc-650 dark:text-zinc-650" : "text-[#CCCCCC] dark:text-zinc-600");
          
          if (!withinLimits) {
            dayTextClass = "text-[#CCCCCC] dark:text-zinc-700 opacity-40 cursor-not-allowed";
          } else if (isSelected) {
            dayTextClass = (activeTheme === "lime" || activeTheme === "yellow") ? "text-zinc-950 font-bold" : "text-white font-semibold";
          } else if (isToday) {
            dayTextClass = designTemplate === "terminal" ? "text-green-400 font-bold" : "text-[#1A1A1A] dark:text-white font-bold";
          }

          let cellBg = designTemplate === "terminal" 
            ? "bg-black hover:bg-zinc-900/60" 
            : "bg-white dark:bg-zinc-900 hover:bg-[#F9F9F9] dark:hover:bg-zinc-850/60";
          if (!withinLimits) {
            cellBg = designTemplate === "terminal" ? "bg-zinc-950/40 opacity-30" : "bg-[#F9F9F9]/50 dark:bg-zinc-950/20";
          } else if (isSelected) {
            cellBg = curCalTheme.selectedBg;
          } else if (stats && stats.total > 0) {
            // All finished
            if (stats.completed === stats.total) {
              cellBg = designTemplate === "terminal" ? "bg-zinc-900/40 hover:bg-zinc-950/20" : "bg-[#F5F5F5] dark:bg-zinc-850/50 hover:bg-[#EAEAEA] dark:hover:bg-[#202022]";
            } else if (stats.completed > 0) {
              cellBg = designTemplate === "terminal" ? "bg-zinc-950 hover:bg-zinc-900/30" : "bg-[#FAFAFA] dark:bg-zinc-900/60 hover:bg-[#F2F2F2] dark:hover:bg-zinc-850/40";
            }
          }

          return (
            <div
              key={dateStr}
              id={`${id}-cell-${dateStr}`}
              onClick={() => withinLimits && onSelectDate(dateStr)}
              className={`relative min-h-[70px] sm:min-h-[85px] p-2 flex flex-col justify-between transition cursor-pointer select-none group ${cellBg}`}
            >
              {/* Day Number and status dots */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs sm:text-sm font-medium flex items-center justify-center w-6 h-6 ${
                    designTemplate === "brutalist" ? "rounded-none border-2 border-black dark:border-zinc-300" :
                    designTemplate === "terminal" ? "rounded-none border border-zinc-750 dark:border-zinc-650 font-mono" :
                    designTemplate === "minimal" ? "rounded-full" : "rounded-lg"
                  } ${
                    isSelected
                      ? (activeTheme === "orange" ? "bg-orange-500 text-white shadow-xs" : `${curCalTheme.selectedBg} shadow-xs`)
                      : isToday && !isSelected
                      ? (designTemplate === "terminal" ? "bg-zinc-900 border border-green-500/30 text-green-400" : "bg-[#F0F0F0] dark:bg-zinc-800 border border-[#CCCCCC] dark:border-zinc-700")
                      : ""
                  } ${dayTextClass}`}
                >
                  {day}
                </span>

                {isToday && !isSelected && (
                  <span className={`text-[9px] font-semibold uppercase tracking-tight scale-90 sm:scale-100 ${
                    designTemplate === "terminal" ? "text-green-500" : "text-zinc-700 dark:text-zinc-300"
                  }`}>
                    Bugün
                  </span>
                )}
              </div>

              {/* Routines count / progress bar / indicators */}
              {withinLimits && stats && stats.total > 0 ? (
                <div className="space-y-1 mt-auto">
                  {/* Visual dots */}
                  <div className="flex flex-wrap gap-0.5 max-h-3 overflow-hidden">
                    {stats.routines.slice(0, 4).map((r) => {
                      const logId = `${r.id}_${dateStr}`;
                      const isComp = logs.some((l) => l.id === logId && l.completed);
                      
                      const colorMap = {
                        indigo: "bg-indigo-500",
                        emerald: "bg-emerald-500",
                        amber: "bg-amber-500",
                        rose: "bg-rose-500",
                        sky: "bg-sky-500",
                        violet: "bg-violet-500",
                      };

                      return (
                        <span
                          key={r.id}
                          className={`w-1.5 h-1.5 rounded-full ${colorMap[r.color]} ${
                            isComp ? "ring-1 ring-slate-400 opacity-100 scale-110" : "opacity-40"
                          }`}
                          title={`${r.title} (${isComp ? "Tamamlandı" : "Yapılmadı"})`}
                        />
                      );
                    })}
                    {stats.routines.length > 4 && (
                      <span className={`text-[8px] font-bold text-slate-400 leading-none`}>
                        +{stats.routines.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Micro label showing completion count */}
                  <div className="text-[10px] sm:text-[10.5px] font-semibold flex items-center justify-between text-[#777777] dark:text-zinc-400 group-hover:text-[#1A1A1A] dark:group-hover:text-white">
                    <span className={isSelected ? (activeTheme === "lime" || activeTheme === "yellow" ? "text-zinc-950 font-bold" : "text-white") : ""}>
                      {stats.completed}/{stats.total}
                    </span>
                    <span className={`${isSelected ? (activeTheme === "lime" || activeTheme === "yellow" ? "text-zinc-800" : "text-[#CCCCCC] dark:text-zinc-400") : "text-[#999999] dark:text-zinc-500 text-[9px]"} font-normal hidden sm:inline`}>
                      {Math.round((stats.completed / stats.total) * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                // Empty state spacing
                <div className="h-4 sm:h-5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar Legend Info panel */}
      <div className="py-2.5 px-4 bg-[#F9F9F9] dark:bg-zinc-900/40 border-t border-[#E5E5E5] dark:border-zinc-800 text-[10.5px] sm:text-xs text-[#777777] dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 transition-colors duration-200">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${curCalTheme.legendBg}`} />
            <span>Tamamlandı</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E5E5E5] dark:bg-zinc-800 border dark:border-zinc-700" />
            <span>Bekliyor</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1.5 bg-[#F5F5F5] dark:bg-zinc-800/60 border border-[#CCCCCC] dark:border-zinc-700 rounded" />
            <span>Günün Hepsi Bitti</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[#888888] dark:text-zinc-500 font-medium">
          <Info className="w-3 h-3 shrink-0" />
          <span>±1 Yıldan sonrası otomatik temizlenir ve kısıtlanır.</span>
        </div>
      </div>
    </div>
  );
}
