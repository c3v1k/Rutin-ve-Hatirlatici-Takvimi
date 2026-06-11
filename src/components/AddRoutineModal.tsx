/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { X, Calendar as CalendarIcon, Clock, Bell, Info, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Category, Routine } from "../types";
import { TURKISH_WEEKDAYS, toLocalDateString } from "../utils/dateUtils";

interface AddRoutineModalProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: Omit<Routine, "id" | "createdAt"> & { id?: string }) => void;
  editingRoutine?: Routine | null;
  categories: Category[];
  routines: Routine[];
}

const COLORS = [
  { name: "indigo", bg: "bg-indigo-500", border: "border-indigo-600" },
  { name: "emerald", bg: "bg-emerald-500", border: "border-emerald-600" },
  { name: "amber", bg: "bg-amber-500", border: "border-amber-600" },
  { name: "rose", bg: "bg-rose-500", border: "border-rose-600" },
  { name: "sky", bg: "bg-sky-500", border: "border-sky-600" },
  { name: "violet", bg: "bg-violet-500", border: "border-violet-600" },
];

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

export default function AddRoutineModal({
  id = "add-routine-modal",
  isOpen,
  onClose,
  onSave,
  editingRoutine,
  categories,
  routines,
}: AddRoutineModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]); // Pzt-Cum default
  const [monthDay, setMonthDay] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState(() => categories[0]?.name || "Genel");
  const [color, setColor] = useState<Routine["color"]>("emerald");
  const [isReminderActive, setIsReminderActive] = useState(true);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  const finalCategory = showCustomCategoryInput ? customCategoryName.trim() : category;
  const isFinanceCategory = finalCategory.toLowerCase() === "gelir" || finalCategory.toLowerCase() === "ödemeler";

  // Sort categories based on usage / active routine frequency (descending)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const countA = (routines || []).filter((r) => r.category === a.name).length;
      const countB = (routines || []).filter((r) => r.category === b.name).length;
      if (countB !== countA) {
        return countB - countA; // categories with more active routines come first
      }
      return a.name.localeCompare(b.name, "tr"); // alphabetical fallback
    });
  }, [categories, routines]);

  // Load editing routine values if we are editing
  useEffect(() => {
    if (editingRoutine) {
      setTitle(editingRoutine.title);
      setDescription(editingRoutine.description);
      setFrequency(editingRoutine.frequency);
      setWeekDays(editingRoutine.weekDays);
      setMonthDay(editingRoutine.monthDay);
      setStartDate(editingRoutine.startDate);
      setTime(editingRoutine.time);
      
      const isDefaultCat = categories.some((c) => c.name === editingRoutine.category);
      if (isDefaultCat) {
        setCategory(editingRoutine.category);
        setShowCustomCategoryInput(false);
        setCustomCategoryName("");
      } else {
        setCategory("NEW_CUSTOM");
        setShowCustomCategoryInput(true);
        setCustomCategoryName(editingRoutine.category);
      }
      
      const catNameLower = editingRoutine.category.toLowerCase();
      const isFinance = catNameLower === "gelir" || catNameLower === "ödemeler";
      if (isFinance) {
        const ext = extractAmount(editingRoutine.title, editingRoutine.description);
        setAmount(ext > 0 ? ext.toString() : "");
      } else {
        setAmount("");
      }
      
      setColor(editingRoutine.color);
      setIsReminderActive(editingRoutine.isReminderActive);
    } else {
      // Defaults for new routine
      setTitle("");
      setDescription("");
      setAmount("");
      setFrequency("daily");
      setWeekDays([1, 2, 3, 4, 5]);
      setMonthDay(1);
      setStartDate(toLocalDateString(new Date()));
      setTime("09:00");
      setCategory(categories[0]?.name || "Genel");
      setShowCustomCategoryInput(false);
      setCustomCategoryName("");
      setColor("emerald");
      setIsReminderActive(true);
    }
  }, [editingRoutine, isOpen, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalTitle = title.trim();
    if (isFinanceCategory) {
      const amtNum = parseFloat(amount.replace(/,/g, "."));
      if (!isNaN(amtNum) && amtNum > 0) {
        // Clear any old amount indicators from the end of the title or inside
        finalTitle = finalTitle
          .replace(/\s*\(\s*\d+(?:\s*[.,]\s*\d+)?\s*(?:tl|try|lira|\$|€)\s*\)/gi, "")
          .replace(/\s*\d+(?:\s*[.,]\s*\d+)?\s*(?:tl|try|lira|\$|€)/gi, "");
        
        finalTitle = `${finalTitle.trim()} (${amtNum} TL)`;
      }
    }

    onSave({
      id: editingRoutine?.id || undefined,
      title: finalTitle,
      description: description.trim(),
      frequency,
      weekDays: frequency === "weekly" ? weekDays : [],
      monthDay: frequency === "monthly" ? monthDay : 1,
      startDate,
      time,
      category: finalCategory || "Genel",
      color,
      isReminderActive,
    });
    onClose();
  };

  const toggleWeekDay = (day: number) => {
    if (weekDays.includes(day)) {
      setWeekDays(weekDays.filter((d) => d !== day));
    } else {
      setWeekDays([...weekDays, day].sort());
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === "NEW_CUSTOM") {
      setShowCustomCategoryInput(true);
      setCategory("NEW_CUSTOM");
    } else {
      setShowCustomCategoryInput(false);
      setCategory(selectedValue);
      // Auto color assign to match
      const match = categories.find((c) => c.name === selectedValue);
      if (match) {
        setColor(match.color as Routine["color"]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id={`${id}-overlay`}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 dark:bg-black/85 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            id={id}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-lg sm:max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-slate-100 dark:border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-[#F9F9F9] dark:bg-zinc-850 border-b border-[#E5E5E5] dark:border-zinc-800">
              <h2 id={`${id}-title`} className="text-sm sm:text-base font-semibold text-[#1A1A1A] dark:text-white">
                {editingRoutine && editingRoutine.id ? "Rutini Düzenle" : "Yeni Rutin Oluştur"}
              </h2>
              <button
                id={`${id}-close-btn`}
                onClick={onClose}
                className="p-1.5 hover:bg-slate-205 dark:hover:bg-zinc-800 cursor-pointer rounded-lg text-slate-400 dark:text-zinc-550 hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Form */}
            <form id={`${id}-form`} onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[82vh] overflow-y-auto border-t-0">
              {/* Title and Description */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor={`${id}-input-title`} className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1 sm:mb-1.5">
                    Rutin Adı *
                  </label>
                  <input
                    id={`${id}-input-title`}
                    type="text"
                    required
                    placeholder="Örn: Sabah Egzersizi, Kitap Okuma"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-zinc-400 focus:border-[#1A1A1A] dark:focus:border-[#1A1A1A] text-[#1A1A1A] dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 transition"
                  />
                </div>

                {isFinanceCategory && (
                  <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 animate-fade-in">
                    <label htmlFor={`${id}-input-amount`} className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      <span>İşlem Tutarı (TL) *</span>
                    </label>
                    <input
                      id={`${id}-input-amount`}
                      type="text"
                      pattern="[0-9]*[.,]?[0-9]*"
                      inputMode="decimal"
                      required
                      placeholder="Örn: 8500"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, "");
                        setAmount(val);
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-emerald-500/30 dark:border-emerald-500/50 bg-white dark:bg-zinc-950 text-[#1A1A1A] dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 transition font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-light leading-normal">
                      Miktar buraya girildiğinde başlığa otomatik olarak "(Tutar TL)" biçiminde eklenecek ve bütçe sayfalarında hesaplanacaktır.
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor={`${id}-input-desc`} className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1 sm:mb-1.5">
                    Açıklama (İsteğe Bağlı)
                  </label>
                  <textarea
                    id={`${id}-input-desc`}
                    placeholder="Rutinin detayları, hedefleriniz..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-zinc-400 focus:border-[#1A1A1A] dark:focus:border-[#1A1A1A] text-[#1A1A1A] dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 transition resize-none"
                  />
                </div>
              </div>

              {/* Category, Color Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor={`${id}-select-category`} className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1 sm:mb-1.5">
                    Kategori
                  </label>
                  {!showCustomCategoryInput ? (
                    <select
                      id={`${id}-select-category`}
                      value={category}
                      onChange={handleCategoryChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 text-[#1A1A1A] dark:text-zinc-100 transition cursor-pointer"
                    >
                      {sortedCategories.map((cat) => {
                        const count = (routines || []).filter((r) => r.category === cat.name).length;
                        return (
                          <option key={cat.name} value={cat.name}>
                            {cat.icon} {cat.name} {count > 0 ? `(${count} Aktif)` : ""}
                          </option>
                        );
                      })}
                      <option value="NEW_CUSTOM">➕ Yeni Kategori Ekle...</option>
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          id={`${id}-input-custom-category`}
                          type="text"
                          required
                          placeholder="Kategori Adı (Örn: Finans, Ödeme)"
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                          className="flex-1 px-3 py-1.5 sm:py-2 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] dark:focus:ring-zinc-400 focus:border-[#1A1A1A] dark:focus:border-[#1A1A1A] text-[#1A1A1A] dark:text-white placeholder-slate-400 dark:placeholder-zinc-650 transition text-xs sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCategoryInput(false);
                            setCategory(categories[0]?.name || "Genel");
                            setCustomCategoryName("");
                          }}
                          className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white bg-[#F5F5F5] dark:bg-zinc-800 hover:bg-[#EAEAEA] dark:hover:bg-zinc-700 border border-[#E5E5E5] dark:border-zinc-700 rounded-xl cursor-pointer transition shrink-0"
                        >
                          Vazgeç
                        </button>
                      </div>
                      <p className="text-[9px] text-[#888888] dark:text-zinc-500">
                        Girdiğiniz özel isim kategori olarak kaydedilecektir.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1 sm:mb-2">
                    Kart Rengi
                  </label>
                  <div className="flex items-center space-x-2 h-9 sm:h-10">
                    {COLORS.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        id={`${id}-color-${col.name}`}
                        onClick={() => setColor(col.name as Routine["color"])}
                        className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full cursor-pointer transition ${col.bg} ${
                          color === col.name
                            ? "ring-2 ring-offset-2 ring-[#1A1A1A] dark:ring-white dark:ring-offset-zinc-900 scale-110"
                            : "hover:scale-105"
                        }`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label htmlFor={`${id}-input-startdate`} className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#777777] dark:text-zinc-400 shrink-0" />
                    <span className="truncate">Başlangıç Tarihi</span>
                  </label>
                  <input
                    id={`${id}-input-startdate`}
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-450 text-[#1A1A1A] dark:text-white transition cursor-pointer"
                  />
                </div>

                <div>
                  <label htmlFor={`${id}-input-time`} className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#777777] dark:text-zinc-400 shrink-0" />
                    <span className="truncate">Cihaz Saati</span>
                  </label>
                  <input
                    id={`${id}-input-time`}
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-450 text-[#1A1A1A] dark:text-white transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Recurrence Frequency Selector */}
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1.5">
                  Tekrarlama Sıklığı
                </label>
                <div id={`${id}-freq-group`} className="grid grid-cols-3 gap-1 sm:gap-2 bg-[#F5F5F5] dark:bg-zinc-800 p-1 sm:p-1.5 rounded-xl">
                  {(["daily", "weekly", "monthly"] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      id={`${id}-freq-btn-${freq}`}
                      onClick={() => setFrequency(freq)}
                      className={`py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium rounded-lg capitalize transition cursor-pointer ${
                        frequency === freq
                          ? "bg-white dark:bg-zinc-900 text-[#1A1A1A] dark:text-white shadow-xs"
                          : "text-[#777777] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {freq === "daily" ? "Günlük" : freq === "weekly" ? "Haftalık" : "Aylık"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Recurrence Details Box */}
              <AnimatePresence mode="wait">
                {frequency === "weekly" && (
                  <motion.div
                    key="weekly-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1">
                      Hangi Günler Tekrarlansın?
                    </label>
                    <div id={`${id}-weekly-days`} className="grid grid-cols-4 sm:flex sm:flex-wrap gap-1 sm:gap-1.5">
                      {TURKISH_WEEKDAYS.map((day) => {
                        const isSelected = weekDays.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            id={`${id}-weedday-${day.value}`}
                            onClick={() => toggleWeekDay(day.value)}
                            className={`py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-lg text-center transition cursor-pointer border ${
                              isSelected
                                ? "bg-[#1A1A1A] dark:bg-zinc-100 border-transparent text-white dark:text-zinc-900"
                                : "bg-white dark:bg-zinc-950 border-[#E5E5E5] dark:border-zinc-800 text-[#555555] dark:text-zinc-350 hover:border-[#CCCCCC] dark:hover:border-zinc-700"
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                    {weekDays.length === 0 && (
                      <p className="text-xs text-rose-500 flex items-center gap-1">
                        <Info className="w-3 h-3" /> En az bir gün seçmelisiniz.
                      </p>
                    )}
                  </motion.div>
                )}

                {frequency === "monthly" && (
                  <motion.div
                    key="monthly-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label htmlFor={`${id}-input-monthday`} className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#777777] dark:text-zinc-400 mb-1">
                      Ayın Hangi Günü? (1 - 31)
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        id={`${id}-input-monthday`}
                        type="range"
                        min="1"
                        max="31"
                        value={monthDay}
                        onChange={(e) => setMonthDay(parseInt(e.target.value))}
                        className="flex-1 accent-[#1A1A1A] dark:accent-zinc-100 cursor-pointer"
                      />
                      <span className="text-xs sm:text-sm font-bold bg-[#F9F9F9] dark:bg-zinc-950 text-[#1A1A1A] dark:text-white px-2.5 py-1 rounded-lg border border-[#E5E5E5] dark:border-zinc-800 w-11 text-center">
                        {monthDay}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500">
                      Not: Ayın gün sayısı seçeceğiniz günden az ise (örn. 31 seçtiniz ama ay 30 gün), rutin o ayın son günü tetiklenir.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Turn reminder on / off toggle */}
              <div className="flex items-center justify-between p-3 sm:p-4 bg-[#F9F9F9] dark:bg-zinc-850/35 rounded-xl border border-[#E5E5E5] dark:border-zinc-800">
                <div className="flex gap-2 sm:gap-3 min-w-0">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A] dark:text-zinc-300 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-[#1A1A1A] dark:text-white leading-tight">Uygulama İçi & Masaüstü Bildirimi</h4>
                    <p className="text-[10px] sm:text-xs text-[#777777] dark:text-zinc-400 mt-0.5 leading-normal">Zamanı geldiğinde bildirim sesi ve alarm göster.</p>
                  </div>
                </div>
                <button
                  type="button"
                  id={`${id}-reminder-switch`}
                  onClick={() => setIsReminderActive(!isReminderActive)}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isReminderActive ? "bg-[#1A1A1A] dark:bg-zinc-100" : "bg-slate-300 dark:bg-zinc-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white dark:bg-zinc-900 shadow ring-0 transition duration-200 ease-in-out ${
                      isReminderActive ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Performance / Horizon Info Footer */}
              <div className="p-3 bg-[#F9F9F9] dark:bg-zinc-850/35 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 flex items-start gap-2 text-[10px] sm:text-xs text-[#777777] dark:text-zinc-400 leading-normal">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#1A1A1A] dark:text-zinc-300" />
                <p>
                  <strong>Otomatik Sınırlandırma Etkin:</strong> Gelecek takvim planları, hafızada şişme yapmaması için girilen günden itibaren en fazla <strong>1 yıl</strong> olarak hesaplanır.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 sm:space-x-3 pt-3 border-t border-[#E5E5E5] dark:border-zinc-800">
                <button
                  type="button"
                  id={`${id}-cancel-btn`}
                  onClick={onClose}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  id={`${id}-save-btn`}
                  disabled={
                    (frequency === "weekly" && weekDays.length === 0) ||
                    (showCustomCategoryInput && !customCategoryName.trim())
                  }
                  className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium text-white dark:text-zinc-900 bg-[#1A1A1A] dark:bg-zinc-100 hover:bg-[#2A2A2A] dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer shadow-sm transition"
                >
                  {editingRoutine ? "Kaydet" : "Rutini Ekle"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
