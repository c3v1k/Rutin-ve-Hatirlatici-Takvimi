/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Edit3, Check, RotateCcw, AlertTriangle, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Category, Routine } from "../types";

interface CategoryManagerModalProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  routines: Routine[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (oldName: string, updatedCategory: Category) => void;
  onDeleteCategory: (name: string) => void;
}

const COLORS = [
  { name: "emerald", label: "Yeşil", bg: "bg-emerald-500", text: "text-emerald-500" },
  { name: "indigo", label: "Çivit", bg: "bg-indigo-500", text: "text-indigo-500" },
  { name: "amber", label: "Sarı", bg: "bg-amber-500", text: "text-amber-500" },
  { name: "rose", label: "Kırmızı", bg: "bg-rose-500", text: "text-rose-500" },
  { name: "sky", label: "Mavi", bg: "bg-sky-500", text: "text-sky-500" },
  { name: "violet", label: "Mor", bg: "bg-violet-500", text: "text-violet-500" },
];

const POPULAR_EMOJIS = [
  "🌱", "💼", "🎯", "🏠", "🎨", "🧘", "💰", "💳", "💵", "💸", 
  "📝", "🛒", "🧠", "🚗", "🍎", "👟", "🛠️", "💊", 
  "⚡", "🔑", "📊", "📞", "💻", "📅", "🏋️", "✈️", "🎂", "🎉", "🎈", "🎁"
];

export default function CategoryManagerModal({
  id = "category-manager-modal",
  isOpen,
  onClose,
  categories,
  routines,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagerModalProps) {
  // Add Category form state
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("emerald");
  const [newCatIcon, setNewCatIcon] = useState("🌱");

  // Edit category inline state
  const [editingCatName, setEditingCatName] = useState<string | null>(null); // Old name of current category being edited
  const [editFormName, setEditFormName] = useState("");
  const [editFormColor, setEditFormColor] = useState("emerald");
  const [editFormIcon, setEditFormIcon] = useState("🌱");

  // Delete category confirmation state
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<string | null>(null);

  // Sort categories alphabetically (using Turkish locale)
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [categories]);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    // Check if category name already exists
    const trimmedName = newCatName.trim();
    if (categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("Bu isimde bir kategori zaten mevcut.");
      return;
    }

    onAddCategory({
      name: trimmedName,
      color: newCatColor,
      icon: newCatIcon,
    });

    // Reset Form
    setNewCatName("");
    setNewCatColor("emerald");
    setNewCatIcon("🌱");
  };

  const startEdit = (cat: Category) => {
    setEditingCatName(cat.name);
    setEditFormName(cat.name);
    setEditFormColor(cat.color);
    setEditFormIcon(cat.icon);
    setDeleteConfirmCat(null); // Cancel any delete checks
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatName || !editFormName.trim()) return;

    const trimmedName = editFormName.trim();
    if (
      trimmedName.toLowerCase() !== editingCatName.toLowerCase() &&
      categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      alert("Bu isimde başka bir kategori zaten mevcut.");
      return;
    }

    onUpdateCategory(editingCatName, {
      name: trimmedName,
      color: editFormColor,
      icon: editFormIcon,
    });

    setEditingCatName(null);
  };

  const handleDeleteClick = (catName: string) => {
    if (categories.length <= 1) {
      alert("En az bir kategorinin kalması gerekmektedir.");
      return;
    }
    setDeleteConfirmCat(catName);
    setEditingCatName(null); // Cancel edit checks
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmCat) return;
    onDeleteCategory(deleteConfirmCat);
    setDeleteConfirmCat(null);
  };

  return (
    <div
      id={`${id}-overlay`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        id={`${id}-container`}
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-3xl shadow-2xl p-6 overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5] dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#1A1A1A] dark:text-white">
              Kategorileri Yönet
            </h3>
            <p className="text-xs text-[#888888] dark:text-zinc-400">
              Yeni kategoriler oluşturun, mevcut olanları düzenleyin veya silin.
            </p>
          </div>
          <button
            id={`${id}-close-btn`}
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white bg-[#F5F5F5] dark:bg-zinc-800 hover:bg-[#EAEAEA] dark:hover:bg-zinc-700 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content wrapper */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Section 1: Add New Category Form */}
          <section className="bg-[#F9F9F9] p-4 rounded-2xl border border-[#E5E5E5] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
              ➕ Yeni Kategori Ekle
            </h4>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor={`${id}-new-name`} className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Kategori Adı
                  </label>
                  <input
                    id={`${id}-new-name`}
                    type="text"
                    required
                    placeholder="Finans, Ödemeler vb."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] text-xs bg-white text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] focus:border-[#1A1A1A] transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                    Renk Teması
                  </label>
                  <div className="flex items-center space-x-2.5 h-9">
                    {COLORS.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setNewCatColor(col.name)}
                        className={`w-6 h-6 rounded-full cursor-pointer transition ${col.bg} ${
                          newCatColor === col.name ? "ring-2 ring-offset-2 ring-black scale-110" : "opacity-80 hover:opacity-100"
                        }`}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Emoji Selector Grid */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1.5">
                  Simge Emojisi ({newCatIcon})
                </label>
                <div className="flex flex-wrap gap-2 p-2.5 bg-white border border-[#E5E5E5] rounded-xl max-h-24 overflow-y-auto">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCatIcon(emoji)}
                      className={`text-lg p-1 w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center transition-all ${
                        newCatIcon === emoji ? "bg-[#1A1A1A] scale-110" : "hover:bg-slate-50"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kategori Ekle</span>
                </button>
              </div>
            </form>
          </section>

          {/* Section 2: Manage Existing Categories List */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-zinc-200">
              📁 Mevcut Kategoriler ({categories.length})
            </h4>

            <div className="space-y-2.5">
               {sortedCategories.map((cat) => {
                const isEditing = editingCatName === cat.name;
                const isConfirmingDelete = deleteConfirmCat === cat.name;
                const associatedRoutines = (routines || []).filter((r) => r.category === cat.name);
                const hasRoutines = associatedRoutines.length > 0;

                const colorBorders: Record<string, string> = {
                  emerald: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                  indigo: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                  amber: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                  rose: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                  sky: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                  violet: "border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700",
                };

                const badges: Record<string, string> = {
                  emerald: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30",
                  indigo: "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/30",
                  amber: "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-900/30",
                  rose: "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-100 dark:border-rose-900/30",
                  sky: "bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 border-sky-100 dark:border-sky-900/30",
                  violet: "bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-300 border-violet-100 dark:border-violet-900/30",
                };

                return (
                  <div
                    key={cat.name}
                    className={`p-3.5 bg-white dark:bg-zinc-900/50 border rounded-xl flex flex-col transition duration-200 ${
                      colorBorders[cat.color] || "border-[#E5E5E5] dark:border-zinc-800"
                    }`}
                  >
                    {!isEditing && !isConfirmingDelete ? (
                      /* Standard Row View */
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg w-7 h-7 bg-[#F5F5F5] dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-[#E5E5E5] dark:border-zinc-750">
                            {cat.icon || "📁"}
                          </span>
                          <span className="font-semibold text-sm text-[#1A1A1A] dark:text-white flex items-center gap-1.5">
                            {cat.name}
                            {hasRoutines && (
                              <span className="text-xs text-amber-500 hover:scale-110 transition duration-150" title={`${associatedRoutines.length} aktif rutin var`}>
                                ⭐
                              </span>
                            )}
                          </span>
                          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${badges[cat.color] || "bg-[#F0F0F0] dark:bg-zinc-800"}`}>
                            {cat.color}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {hasRoutines && (
                            <span 
                              className="hidden sm:flex items-center gap-1 text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-850 dark:text-amber-400 px-2 py-1 rounded-xl border border-amber-200/50 dark:border-amber-900/20 animate-pulse"
                              title={`Bu kategoriyi kullanan ${associatedRoutines.length} adet aktif rutin var.`}
                            >
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span>{associatedRoutines.length} Aktif</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="p-1.5 hover:bg-[#F5F5F5] dark:hover:bg-zinc-850 rounded-lg text-slate-500 hover:text-[#1A1A1A] dark:hover:text-white transition cursor-pointer flex items-center gap-1"
                            title={hasRoutines ? `Düzenle (⭐ Kategori Kullanımda)` : "Düzenle"}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(cat.name)}
                            className="p-1.5 hover:bg-[#F5F5F5] dark:hover:bg-zinc-850 rounded-lg text-slate-500 hover:text-[#FF3333] dark:hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                            title={hasRoutines ? `Sil (${associatedRoutines.length} aktif rutin var)` : "Sil"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : isEditing ? (
                      /* Editing Container Form */
                      <form onSubmit={handleSaveEdit} className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                              Yeni İsim
                            </label>
                            <input
                              type="text"
                              required
                              value={editFormName}
                              onChange={(e) => setEditFormName(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-100 text-xs focus:ring-1 focus:ring-zinc-400 focus:border-zinc-500 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                              Yeni Renk
                            </label>
                            <div className="flex items-center space-x-2 h-8">
                              {COLORS.map((col) => (
                                <button
                                  key={col.name}
                                  type="button"
                                  onClick={() => setEditFormColor(col.name)}
                                  className={`w-5 h-5 rounded-full cursor-pointer transition ${col.bg} ${
                                    editFormColor === col.name ? "ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-zinc-900 scale-105" : "opacity-80"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Inline Emoji grid */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                            Simge Emojisi ({editFormIcon})
                          </label>
                          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-zinc-950 border border-[#E5E5E5] dark:border-zinc-800 rounded-xl max-h-20 overflow-y-auto">
                            {POPULAR_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => setEditFormIcon(emoji)}
                                className={`text-base p-0.5 w-7 h-7 rounded-md cursor-pointer flex items-center justify-center transition ${
                                  editFormIcon === emoji ? "bg-[#1A1A1A] dark:bg-zinc-700 text-white" : "hover:bg-[#EAEAEA] dark:hover:bg-zinc-850"
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Inline Submit triggers */}
                        <div className="flex justify-end space-x-2 pt-1 border-t border-slate-50 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setEditingCatName(null)}
                            className="px-3 py-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-lg cursor-pointer transition"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="submit"
                            disabled={!editFormName.trim()}
                            className="px-3.5 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Kaydet</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Deletion Confirmation Safety Pane */
                      <div className="space-y-3.5">
                        <div className="flex items-start gap-2.5 text-left p-3.5 bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/40 rounded-lg text-xs leading-relaxed text-slate-700 dark:text-zinc-300 animate-feed-in">
                          <AlertTriangle className="w-5 h-5 text-[#FF3333] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#1A1A1A] dark:text-white">"{cat.name}" Kategorisini Silmek İstiyor Musunuz?</span>
                            {hasRoutines ? (
                              <p className="mt-1 text-rose-700 dark:text-rose-400 font-medium text-[11px] bg-rose-100/30 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200/50 dark:border-rose-900/20">
                                ⚠️ <strong>Kritik Uyarı:</strong> Bu kategoriye bağlı <strong>{associatedRoutines.length} adet aktif rutin</strong> bulunmaktadır! Bu kategoriyi silerseniz, bu rutinlerin kategorisi otomatik olarak <strong className="text-emerald-800 dark:text-emerald-400 font-bold">"Genel"</strong> olarak güncellenecektir.
                              </p>
                            ) : (
                              <p className="mt-1 text-slate-500 dark:text-zinc-400 font-light text-[11px]">
                                Bu kategoriyi silerseniz, bu kategoriye bağlı olan tüm rutinlerin kategorisi otomatik olarak <strong className="text-emerald-700 dark:text-emerald-450">"Genel"</strong> olarak güncellenecektir. Bu işlem geri alınamaz!
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmCat(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 bg-[#F5F5F5] dark:bg-zinc-800 hover:text-[#1A1A1A] dark:hover:text-white border border-[#E5E5E5] dark:border-zinc-700 rounded-xl cursor-pointer transition"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="px-3.5 py-1.5 text-xs text-white bg-[#FF3333] hover:bg-[#EE2222] rounded-xl cursor-pointer font-semibold transition flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Kategoriyi Sil</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer close border */}
        <div className="pt-4 border-t border-[#E5E5E5] dark:border-zinc-800 shrink-0 text-right bg-transparent">
          <button
            id={`${id}-footer-close-btn`}
            onClick={onClose}
            className="px-4 py-2 bg-[#F5F5F5] dark:bg-zinc-800 hover:bg-[#EAEAEA] dark:hover:bg-zinc-700 text-[#1A1A1A] dark:text-zinc-200 border border-[#E5E5E5] dark:border-zinc-700 font-semibold text-xs rounded-xl cursor-pointer transition duration-150"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
}
