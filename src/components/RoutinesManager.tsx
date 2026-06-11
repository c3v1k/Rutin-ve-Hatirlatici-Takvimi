/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Search, Filter, Plus, Bell, BellOff, Trash2, Edit3, Volume2, Info, LayoutGrid, List, Tag, Check, Circle, Sparkles, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Category, Routine, RoutineLog } from "../types";
import { TURKISH_WEEKDAYS, getOccurrencesForDate, formatToTurkishDate } from "../utils/dateUtils";
import { playNotificationSound, sendBrowserNotification } from "../utils/notificationService";

interface RoutinesManagerProps {
  id?: string;
  routines: Routine[];
  onAddRoutineClick: () => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onToggleReminder: (routineId: string) => void;
  categories: Category[];
  onManageCategoriesClick?: () => void;
  logs: RoutineLog[];
  onToggleComplete: (routineId: string, dateStr: string) => void;
  activeTheme?: string;
  designTemplate?: string;
}

const COMP_THEME_MGR: Record<string, {
  activeBarBg: string;
  activeText: string;
  primaryBtn: string;
  ring: string;
}> = {
  orange: {
    activeBarBg: "bg-orange-500 dark:bg-orange-450",
    activeText: "text-orange-650 dark:text-orange-400 font-bold",
    primaryBtn: "bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-400 text-white font-bold",
    ring: "focus:ring-orange-400"
  },
  lime: {
    activeBarBg: "bg-lime-500 dark:bg-[#a3e635]",
    activeText: "text-lime-700 dark:text-[#a3e635] font-bold",
    primaryBtn: "bg-lime-500 hover:bg-lime-600 dark:bg-[#a3e635] dark:hover:bg-lime-450 text-black font-bold",
    ring: "focus:ring-lime-400"
  },
  yellow: {
    activeBarBg: "bg-yellow-400 dark:bg-yellow-450",
    activeText: "text-amber-700 dark:text-yellow-400 font-bold",
    primaryBtn: "bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-black font-bold",
    ring: "focus:ring-yellow-400"
  },
  blue: {
    activeBarBg: "bg-blue-600 dark:bg-blue-500",
    activeText: "text-blue-600 dark:text-blue-400 font-bold",
    primaryBtn: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white font-bold",
    ring: "focus:ring-blue-550"
  },
  violet: {
    activeBarBg: "bg-violet-605 dark:bg-violet-550",
    activeText: "text-violet-650 dark:text-violet-400 font-bold",
    primaryBtn: "bg-violet-605 hover:bg-violet-700 dark:bg-violet-550 dark:hover:bg-violet-450 text-white font-bold",
    ring: "focus:ring-violet-500"
  },
  rose: {
    activeBarBg: "bg-rose-600 dark:bg-rose-550",
    activeText: "text-rose-600 dark:text-rose-400 font-bold",
    primaryBtn: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-550 dark:hover:bg-rose-450 text-white font-bold",
    ring: "focus:ring-rose-555"
  }
};

export default function RoutinesManager({
  id = "routines-manager",
  routines,
  onAddRoutineClick,
  onEditRoutine,
  onDeleteRoutine,
  onToggleReminder,
  categories,
  onManageCategoriesClick,
  logs,
  onToggleComplete,
  activeTheme = "orange",
  designTemplate = "modern",
}: RoutinesManagerProps) {
  const cmt = COMP_THEME_MGR[activeTheme] || COMP_THEME_MGR.orange || COMP_THEME_MGR.yellow;

  const containerClass = useMemo(() => {
    switch (designTemplate) {
      case "brutalist":
        return "bg-white dark:bg-zinc-950 rounded-none border-2 border-black dark:border-zinc-250 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] p-4 sm:p-6 space-y-4 sm:space-y-6 transition-colors duration-200";
      case "minimal":
        return "bg-slate-50/50 dark:bg-zinc-900/40 rounded-3xl border border-transparent shadow-none hover:bg-slate-50 dark:hover:bg-zinc-900/50 p-4 sm:p-6 space-y-4 sm:space-y-6 transition-colors duration-200";
      case "terminal":
        return "bg-[#09090b] text-zinc-300 rounded-none border border-dashed border-zinc-700 dark:border-zinc-500 shadow-none font-mono p-4 sm:p-6 space-y-4 sm:space-y-6 transition-colors duration-200";
      default:
        return "bg-white dark:bg-zinc-900 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-xs p-4 sm:p-6 space-y-4 sm:space-y-6 transition-colors duration-200";
    }
  }, [designTemplate]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const managerTab = "templates" as string;
  const groupedTasks: Record<string, any[]> = {};

  // Keep all categories: build standard set from list + dynamic ones in state
  const filterCategories = useMemo(() => {
    const list = new Set<string>();
    categories.forEach((cat) => list.add(cat.name));
    routines.forEach((r) => list.add(r.category));
    const sorted = Array.from(list).sort((a, b) => a.localeCompare(b, "tr"));
    return ["All", ...sorted];
  }, [routines, categories]);

  const filteredRoutines = useMemo(() => {
    return routines.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === "All" || r.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [routines, searchTerm, selectedCategory]);

  const getWeekDaysSummary = (days: number[]) => {
    if (days.length === 7) return "Her gün";
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Hafta içi";
    if (days.length === 2 && days.includes(0) && days.includes(6)) return "Hafta sonu";
    
    return days
      .map((d) => TURKISH_WEEKDAYS.find((wd) => wd.value === d)?.short || "")
      .filter(Boolean)
      .join(", ");
  };

  const handleTestChime = () => {
    playNotificationSound();
    sendBrowserNotification(
      "Rutin Hatırlatıcısı Yayında!",
      "Test uyarısı başarıyla tetiklendi. Belirlenen saatlerde bu şekilde hatırlatmalar alacaksınız!"
    );
  };

  return (
    <div id={id} className={containerClass}>
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-medium text-[#1A1A1A] dark:text-zinc-100">
            Tüm Rutinlerim
          </h3>
          <p className="text-[11px] sm:text-xs text-[#888888] dark:text-zinc-400">
            Oluşturduğunuz tüm tekrarlı işleri buradan listeleyebilir ve düzenleyebilirsiniz.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            id={`${id}-test-alarm-btn`}
            onClick={handleTestChime}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-[#F5F5F5] dark:bg-zinc-800 hover:bg-[#EAEAEA] dark:hover:bg-zinc-700/80 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold text-[#1A1A1A] dark:text-zinc-200 cursor-pointer flex items-center gap-1 sm:gap-1.5 border border-[#E5E5E5] dark:border-zinc-750 transition"
            title="Sesi ve bildirimleri test et"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#1A1A1A] dark:text-zinc-250" />
            <span>Alarm Testi</span>
          </button>

          <button
            id={`${id}-add-routine-shortcut`}
            onClick={onAddRoutineClick}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 ${cmt.primaryBtn} text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl cursor-pointer shadow-xs flex items-center gap-1 sm:gap-1.5 transition`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Rutin</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id={`${id}-search-input`}
            type="text"
            placeholder="Rutin ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8.5 pr-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-[#E5E5E5] dark:border-zinc-800 text-xs sm:text-sm bg-white dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-200 focus:outline-none focus:ring-1 ${cmt.ring} dark:focus:ring-zinc-400 focus:border-[#1A1A1A] dark:focus:border-[#1A1A1A] placeholder-slate-450 dark:placeholder-zinc-600 transition`}
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#777777] dark:text-zinc-400" />
            <select
              id={`${id}-category-filter`}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-2 pr-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-[#E5E5E5] dark:border-zinc-800 text-xs sm:text-sm bg-white dark:bg-zinc-900 text-[#1A1A1A] dark:text-zinc-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-450"
            >
              {filterCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "Tüm Kategoriler" : cat}
                </option>
              ))}
            </select>
          </div>

          {managerTab === "templates" && (
            <div className="flex items-center bg-[#F5F5F5] dark:bg-zinc-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl shrink-0">
              <button
                type="button"
                id={`${id}-view-mode-list-btn`}
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md cursor-pointer transition ${
                  viewMode === "list" ? "bg-white dark:bg-zinc-900 text-[#1A1A1A] dark:text-white shadow-xs" : "text-[#777777] dark:text-zinc-450 hover:text-[#1A1A1A] dark:hover:text-white"
                }`}
                title="Liste Görünümü"
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                id={`${id}-view-mode-grid-btn`}
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md cursor-pointer transition ${
                  viewMode === "grid" ? "bg-white dark:bg-zinc-900 text-[#1A1A1A] dark:text-white shadow-xs" : "text-[#777777] dark:text-zinc-450 hover:text-[#1A1A1A] dark:hover:text-white"
                }`}
                title="Izgara Görünümü"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Tab Panel */}
      <AnimatePresence mode="wait">
        {managerTab === "history" ? (
          <motion.div
            key="history-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-[#FAF9F5] dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
              <div>
                <strong className="font-semibold text-xs text-[#1A1A1A] dark:text-white block mb-0.5">🗓️ Bu Ayın Tarihsel Göreve Genel Bakışı</strong>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed text-[11px] font-normal">
                  Rutinlerinizin bu ayki tüm tekrarlanan görev örnekleri aşağıda listelenmektedir. Tamamlanan görevler <span className="italic text-slate-500 dark:text-zinc-400 font-semibold bg-[#F0F0F0] dark:bg-zinc-800 px-1.5 py-0.5 rounded">italik ve hafif bir renk tonuyla</span> gösterilir. Tamamlama durumunu değiştirmek için sollarındaki dairelere tıklayabilirsiniz.
                </p>
              </div>
            </div>

            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#E5E5E5] dark:border-zinc-800 rounded-2xl bg-[#FBFBFB] dark:bg-zinc-900/60">
                <p className="text-sm text-[#777777] dark:text-zinc-400 font-medium">Bu kriterlere uygun görev bulunamadı.</p>
                <p className="text-xs text-[#999999] dark:text-zinc-500 mt-1">Lütfen kategori veya arama metnini değiştirmeyi deneyin ya da yeni bir rutin oluşturun!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(groupedTasks).sort().map((dateStr) => {
                  const tasksForDay = groupedTasks[dateStr];
                  return (
                    <div key={dateStr} className="space-y-2.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-[#1A1A1A] dark:text-zinc-200 bg-[#F5F5F5] dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-zinc-750 w-fit">
                        <span>🗓️</span>
                        <span>{formatToTurkishDate(dateStr)}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pl-1">
                        {tasksForDay.map((item) => {
                          const { id: taskKey, routine, isCompleted } = item;
                          
                          return (
                            <div
                              key={taskKey}
                              id={`${id}-month-task-${taskKey}`}
                              className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                                isCompleted
                                  ? "bg-[#F9F9F9]/50 dark:bg-zinc-950/20 border-slate-200/50 dark:border-zinc-850/60 opacity-60 text-slate-450 dark:text-zinc-500 italic"
                                  : "bg-white dark:bg-zinc-900 border-[#E5E5E5] dark:border-zinc-800 text-[#1A1A1A] dark:text-zinc-150 hover:border-[#CCCCCC] dark:hover:border-zinc-700"
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  id={`${id}-month-check-${taskKey}`}
                                  onClick={() => onToggleComplete(routine.id, dateStr)}
                                  className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 ${
                                    isCompleted
                                      ? "bg-[#1A1A1A] dark:bg-white border-transparent text-white dark:text-[#1A1A1A]"
                                      : "bg-white dark:bg-zinc-900 border-[#CCCCCC] dark:border-zinc-700 text-[#CCCCCC] dark:text-zinc-500 hover:border-[#1A1A1A] dark:hover:border-white"
                                  }`}
                                >
                                  {isCompleted ? (
                                    <Check className="w-3 h-3 stroke-[3] text-white dark:text-[#1A1A1A]" />
                                  ) : (
                                    <Circle className="w-3 h-3 opacity-30" />
                                  )}
                                </button>
                                
                                <div className="min-w-0 flex-1">
                                  <h5 className={`text-xs sm:text-sm font-semibold truncate ${isCompleted ? "line-through text-slate-400 dark:text-zinc-500 font-normal italic" : "text-zinc-900 dark:text-zinc-100"}`}>
                                    {routine.title}
                                  </h5>
                                  <div className="flex items-center text-[10px] text-slate-500 dark:text-zinc-400 font-medium flex-wrap gap-1.5 mt-0.5">
                                    <span className="flex items-center">🕒 Saat {routine.time}</span>
                                    <span>•</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-400 border border-[#E5E5E5] dark:border-zinc-700`}>
                                      {routine.category}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="templates-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* List / Grid of Routines */}
            {filteredRoutines.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#E5E5E5] dark:border-zinc-800 rounded-2xl bg-[#FBFBFB] dark:bg-zinc-900/40">
                <p className="text-sm text-[#777777] dark:text-zinc-400 font-medium">Aramayla eşleşen rutin bulunamadı.</p>
                <p className="text-xs text-[#999999] dark:text-zinc-500 mt-1">Lütfen yeni bir rutin ekleyin veya kriterleri sıfırlayın.</p>
              </div>
            ) : viewMode === "list" ? (
              <div id={`${id}-list-container`} className="space-y-2">
                <AnimatePresence>
                  {filteredRoutines.map((routine) => {
                    const borderColors: Record<Routine["color"], string> = {
                      emerald: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      indigo: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      amber: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      rose: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      sky: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      violet: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                    };

                    const badgeColors: Record<Routine["color"], string> = {
                      emerald: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      indigo: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      amber: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      rose: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      sky: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      violet: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                    };

                    let cardStyle = "";
                    switch (designTemplate) {
                      case "brutalist":
                        cardStyle = `p-1.5 sm:p-2.5 bg-white dark:bg-zinc-950 rounded-none border-2 border-black dark:border-zinc-300 flex flex-col md:flex-row md:items-center justify-between gap-1.5 md:gap-4 shadow-[1.1px_1.1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.1px_1.1px_0px_0px_rgba(255,255,255,1)] transition duration-200`;
                        break;
                      case "minimal":
                        cardStyle = `p-1.5 sm:p-2.5 bg-slate-50/50 dark:bg-zinc-850/25 rounded-2xl border border-[#E5E5E5]/20 dark:border-zinc-800/10 flex flex-col md:flex-row md:items-center justify-between gap-1.5 md:gap-4 transition duration-150`;
                        break;
                      case "terminal":
                        cardStyle = `p-1 sm:p-1.5 bg-black text-zinc-300 rounded-none border border-dashed border-zinc-700 dark:border-zinc-550 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-3.5 font-mono transition duration-105`;
                        break;
                      default:
                        cardStyle = `p-1.5 sm:p-2.5 bg-white dark:bg-zinc-900 rounded-xl border ${borderColors[routine.color]} flex flex-col md:flex-row md:items-center justify-between gap-1.5 md:gap-4 hover:shadow-3xs transition duration-200`;
                        break;
                    }

                    return (
                      <motion.div
                        key={routine.id}
                        id={`${id}-routine-item-${routine.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className={cardStyle}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md shrink-0 self-start sm:self-center text-center leading-none ${badgeColors[routine.color]}`}>
                            {routine.category}
                          </span>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-semibold text-[#1A1A1A] dark:text-zinc-100 truncate">{routine.title}</h4>
                            {routine.description ? (
                              <p className="text-[11px] sm:text-xs text-[#777777] dark:text-zinc-400 line-clamp-1 leading-normal">
                                {routine.description}
                              </p>
                            ) : (
                              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 italic leading-none">Açıklama girilmedi...</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-row items-center gap-2 md:gap-5 shrink-0 md:justify-end text-[10px] sm:text-[11px] text-[#777777] dark:text-zinc-400 font-medium border-t md:border-t-0 border-[#E5E5E5]/60 dark:border-zinc-850 pt-1.5 md:pt-0 justify-between md:justify-start w-full md:w-auto">
                          <div className="flex items-center gap-1 md:block">
                            <span className="block text-slate-400 dark:text-zinc-500 text-[9px] md:text-[10px] leading-none">Tekrarlama:</span>
                            <span className="text-[#1A1A1A] dark:text-zinc-200 capitalize font-semibold md:font-medium text-[10px] sm:text-xs">
                              {routine.frequency === "daily" && "Her gün"}
                              {routine.frequency === "weekly" && getWeekDaysSummary(routine.weekDays)}
                              {routine.frequency === "monthly" && `Ayın ${routine.monthDay}.`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 md:block">
                            <span className="block text-slate-400 dark:text-zinc-500 text-[9px] md:text-[10px] leading-none">Saat:</span>
                            <span className="text-[#1A1A1A] dark:text-zinc-200 font-semibold md:font-medium font-mono text-[10px] sm:text-xs">{routine.time}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 md:pl-2.5 md:border-l border-[#E5E5E5]/50 dark:border-zinc-800">
                            <button
                              id={`${id}-toggle-rem-${routine.id}`}
                              onClick={() => onToggleReminder(routine.id)}
                              className={`p-1 rounded-md hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 transition cursor-pointer ${
                                routine.isReminderActive ? "text-[#1A1A1A] dark:text-white" : "text-slate-300 dark:text-zinc-650"
                              }`}
                              title={routine.isReminderActive ? "Bildirimler Etkin" : "Bildirimler Sessizde"}
                            >
                              {routine.isReminderActive ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                            </button>
                            
                            <button
                              id={`${id}-edit-${routine.id}`}
                              onClick={() => onEditRoutine(routine)}
                              className="p-1 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 rounded-md text-[#666666] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white transition cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`${id}-delete-${routine.id}`}
                              onClick={() => onDeleteRoutine(routine.id)}
                              className="p-1 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 rounded-md text-[#666666] dark:text-zinc-400 hover:text-[#FF3333] dark:hover:text-red-400 transition cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div id={`${id}-grid-container`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence>
                  {filteredRoutines.map((routine) => {
                    const borderColors: Record<Routine["color"], string> = {
                      emerald: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      indigo: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      amber: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      rose: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      sky: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                      violet: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                    };

                    const badgeColors: Record<Routine["color"], string> = {
                      emerald: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      indigo: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      amber: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      rose: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      sky: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                      violet: "bg-[#F0F0F0] dark:bg-zinc-800 text-[#555555] dark:text-zinc-350 border border-[#E5E5E5] dark:border-zinc-700",
                    };

                    let cardStyle = "";
                    switch (designTemplate) {
                      case "brutalist":
                        cardStyle = `p-3 bg-white dark:bg-zinc-950 rounded-none border-2 border-black dark:border-zinc-300 flex flex-col justify-between space-y-3 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)] transition duration-200`;
                        break;
                      case "minimal":
                        cardStyle = `p-3 bg-slate-50/50 dark:bg-zinc-850/25 rounded-2xl border border-[#E5E5E5]/20 dark:border-zinc-800/10 flex flex-col justify-between space-y-3 transition duration-150`;
                        break;
                      case "terminal":
                        cardStyle = `p-2.5 bg-black text-zinc-350 rounded-none border border-dashed border-zinc-700 dark:border-zinc-550 flex flex-col justify-between space-y-2.5 font-mono transition duration-105`;
                        break;
                      default:
                        cardStyle = `p-3 bg-white dark:bg-zinc-900 rounded-xl border ${borderColors[routine.color]} flex flex-col justify-between space-y-3 hover:shadow-3xs transition duration-250`;
                        break;
                    }

                    return (
                      <motion.div
                        key={routine.id}
                        id={`${id}-routine-item-${routine.id}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cardStyle}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md leading-none ${badgeColors[routine.color]}`}>
                              {routine.category}
                            </span>

                            <div className="flex items-center space-x-1.5">
                              <button
                                id={`${id}-toggle-rem-${routine.id}`}
                                onClick={() => onToggleReminder(routine.id)}
                                className={`p-1 rounded-md hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 transition cursor-pointer ${
                                  routine.isReminderActive ? "text-[#1A1A1A] dark:text-white" : "text-slate-300 dark:text-zinc-650"
                                }`}
                                title={routine.isReminderActive ? "Bildirimler Etkin" : "Bildirimler Sessizde"}
                              >
                                {routine.isReminderActive ? (
                                  <Bell className="w-3.5 h-3.5" />
                                ) : (
                                  <BellOff className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <h4 className="text-xs sm:text-sm font-semibold text-[#1A1A1A] dark:text-zinc-155 line-clamp-1">{routine.title}</h4>
                          {routine.description ? (
                            <p className="text-[11px] sm:text-xs text-[#777777] dark:text-zinc-400 line-clamp-2 leading-relaxed">
                              {routine.description}
                            </p>
                          ) : (
                            <p className="text-[10px] sm:text-xs text-slate-355 dark:text-zinc-550 italic leading-none">Açıklama girilmedi...</p>
                          )}
                        </div>

                        {/* Summary Footer bar */}
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-850 flex items-center justify-between text-[10px] sm:text-[11px] text-[#777777] dark:text-zinc-400 font-medium">
                          <div className="space-y-0.5">
                            <span className="block text-slate-400 dark:text-zinc-500 text-[9px] sm:text-[10px]">Tekrarlama</span>
                            <span className="text-[#1A1A1A] dark:text-zinc-200 capitalize font-medium">
                              {routine.frequency === "daily" && "Her gün"}
                              {routine.frequency === "weekly" && getWeekDaysSummary(routine.weekDays)}
                              {routine.frequency === "monthly" && `Ayın ${routine.monthDay}.`}
                            </span>
                          </div>

                          <div className="space-y-0.5 text-right">
                            <span className="block text-slate-400 dark:text-zinc-500 text-[9px] sm:text-[10px]">Saat</span>
                            <span className="text-[#1A1A1A] dark:text-zinc-200 font-medium font-mono">{routine.time}</span>
                          </div>
                        </div>

                        {/* Edit/Delete Buttons */}
                        <div className="flex items-center justify-end space-x-1 pt-1.5 border-t border-dashed border-[#E5E5E5]/40 dark:border-zinc-850">
                          <button
                            id={`${id}-edit-${routine.id}`}
                            onClick={() => onEditRoutine(routine)}
                            className="px-2 py-0.5 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 rounded text-[11px] font-semibold text-[#666666] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white cursor-pointer flex items-center gap-1 transition"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Düzenle</span>
                          </button>
                          <button
                            id={`${id}-delete-${routine.id}`}
                            onClick={() => onDeleteRoutine(routine.id)}
                            className="px-2 py-0.5 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 rounded text-[11px] font-semibold text-[#666666] dark:text-zinc-400 hover:text-[#FF3333] dark:hover:text-red-400 cursor-pointer flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
