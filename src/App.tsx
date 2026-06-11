/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar as CalendarIcon,
  BookOpen,
  Clock,
  Sparkles,
  Award,
  Bell,
  CheckCircle,
  HelpCircle,
  Info,
  Layers,
  ArrowRight,
  User,
  Check,
  Power,
  Trash2,
  X,
  Volume2,
  ListTodo,
  Plus,
  Timer,
  Sun,
  Moon,
  Settings,
  Circle,
  Tag,
  Wallet,
  Lock,
  Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Category, Routine, RoutineLog, NotificationItem, SnoozedAlarm } from "./types";
import {
  getOccurrencesForDate,
  toLocalDateString,
  pruneOldLogs,
  calculateStreak,
  formatToTurkishDate
} from "./utils/dateUtils";
import {
  playNotificationSound,
  playSuccessChime,
  sendBrowserNotification,
  requestBrowserNotificationPermission
} from "./utils/notificationService";

// Sub Components
import CalendarView from "./components/CalendarView";
import DailyTaskList from "./components/DailyTaskList";
import RoutinesManager from "./components/RoutinesManager";
import AddRoutineModal from "./components/AddRoutineModal";
import CategoryManagerModal from "./components/CategoryManagerModal";
import WalletView from "./components/WalletView";
import WalletPasswordLockScreen from "./components/WalletPasswordLockScreen";
import { TEMPLATE_STYLES, getTemplateClass } from "./lib/layoutStyles";

// Interactive Turkish default templates to populate empty apps instantly
const DEFAULT_ROUTINES: Routine[] = [
  {
    id: "default-1",
    title: "Sabah Meditasyonu ve Esneme",
    description: "Zihni sakinleştirmek ve güne zinde başlamak için 10 dakika derin nefes egzersizi yap.",
    frequency: "daily",
    weekDays: [],
    monthDay: 1,
    startDate: "2026-05-31",
    time: "07:30",
    category: "Zihinsel Sağlık",
    color: "violet",
    isReminderActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-2",
    title: "Günlük Su Tüketimi (2.5 Litre)",
    description: "Su şişesini masada tut, gün boyu düzenli yudumlarla hidrasyonu sağla.",
    frequency: "daily",
    weekDays: [],
    monthDay: 1,
    startDate: "2026-05-31",
    time: "11:00",
    category: "Sağlık & Fiziksel",
    color: "sky",
    isReminderActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-3",
    title: "Haftalık Durum & Finans Kontrolü",
    description: "Gelir-gider tablosunu güncelle, haftalık hedefleri ve bütçeyi gözden geçir.",
    frequency: "weekly",
    weekDays: [1], // Monday
    monthDay: 1,
    startDate: "2026-05-31",
    time: "09:00",
    category: "İş & Kariyer",
    color: "indigo",
    isReminderActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-4",
    title: "Yarım Saat Kitap Okuma",
    description: "Yararlı makaleler veya kurgu dışı bir kitap oku, kişisel gelişimine yatırım yap.",
    frequency: "daily",
    weekDays: [],
    monthDay: 1,
    startDate: "2026-05-31",
    time: "21:30",
    category: "Kişisel Gelişim",
    color: "amber",
    isReminderActive: true,
    createdAt: new Date().toISOString(),
  }
];

// Default Categories
const DEFAULT_CATEGORIES: Category[] = [
  { name: "Genel", color: "sky", icon: "📁" },
  { name: "Sağlık & Fiziksel", color: "emerald", icon: "🌱" },
  { name: "İş & Kariyer", color: "indigo", icon: "💼" },
  { name: "Kişisel Gelişim", color: "amber", icon: "🎯" },
  { name: "Ev & Günlük", color: "rose", icon: "🏠" },
  { name: "Hobi & Eğlence", color: "sky", icon: "🎨" },
  { name: "Zihinsel Sağlık", color: "violet", icon: "🧘" },
  { name: "Doğum Günü", color: "rose", icon: "🎂" },
  { name: "Gelir", color: "emerald", icon: "💰" },
  { name: "Ödemeler", color: "rose", icon: "💵" },
];

const THEME_OPTIONS = [
  { id: "orange", name: "Turuncu", dotBg: "bg-[#f97316] border border-orange-500" },
  { id: "lime", name: "Fosforlu Yeşil", dotBg: "bg-[#a3e635] border border-lime-550" },
  { id: "yellow", name: "Sarı", dotBg: "bg-[#eab308] border border-yellow-500" },
  { id: "blue", name: "Elektrik Havai", dotBg: "bg-[#2563eb] border border-blue-600" },
  { id: "violet", name: "Canlı Mor", dotBg: "bg-[#8b5cf6] border border-violet-650" },
  { id: "rose", name: "Işıltılı Gül", dotBg: "bg-[#f43f5e] border border-rose-600" }
];

const THEME_MAP: Record<string, {
  accentText: string;
  accentBg: string;
  accentHoverBg: string;
  accentBorder: string;
  accentRing: string;
  badgeBg: string;
  selection: string;
  iconBg: string;
  iconText: string;
  textMuted: string;
  primaryBgBtn: string;
}> = {
  orange: {
    accentText: "text-orange-650 dark:text-orange-400",
    accentBg: "bg-orange-500 text-white dark:bg-orange-500 dark:text-black",
    accentHoverBg: "hover:bg-orange-600 dark:hover:bg-orange-400",
    accentBorder: "border-orange-500 dark:border-orange-400",
    accentRing: "focus:ring-orange-550 dark:focus:ring-orange-400",
    badgeBg: "bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 border border-orange-100 dark:border-orange-900/20",
    selection: "selection:bg-orange-500 selection:text-white",
    iconBg: "bg-orange-50 dark:bg-orange-950/30",
    iconText: "text-orange-600 dark:text-orange-400",
    textMuted: "text-orange-600/80 dark:text-orange-400/80",
    primaryBgBtn: "bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-500 dark:hover:bg-orange-450 dark:text-black"
  },
  lime: {
    accentText: "text-[#4d7c0f] dark:text-[#a3e635]",
    accentBg: "bg-[#a3e635] text-black dark:bg-[#a3e635] dark:text-black",
    accentHoverBg: "hover:bg-[#84cc16] dark:hover:bg-[#bef264]",
    accentBorder: "border-[#84cc16] dark:border-[#a3e635]",
    accentRing: "focus:ring-[#84cc16] dark:focus:ring-[#a3e635]",
    badgeBg: "bg-lime-50 dark:bg-lime-950/20 text-lime-800 dark:text-lime-300 border border-lime-100 dark:border-lime-900/20",
    selection: "selection:bg-[#a3e635] selection:text-black",
    iconBg: "bg-lime-50 dark:bg-lime-950/30",
    iconText: "text-[#4d7c0f] dark:text-[#bef264]",
    textMuted: "text-lime-750/90 dark:text-lime-350/90",
    primaryBgBtn: "bg-[#a3e635] hover:bg-[#84cc16] text-[#1A1A1A] dark:bg-[#a3e635] dark:hover:bg-[#bef264] dark:text-black"
  },
  yellow: {
    accentText: "text-amber-700 dark:text-yellow-400",
    accentBg: "bg-yellow-400 text-black dark:bg-yellow-400 dark:text-black",
    accentHoverBg: "hover:bg-yellow-500 dark:hover:bg-yellow-300",
    accentBorder: "border-yellow-400 dark:border-yellow-400",
    accentRing: "focus:ring-yellow-500 dark:focus:ring-yellow-400",
    badgeBg: "bg-yellow-50 dark:bg-yellow-950/20 text-amber-800 dark:text-yellow-300 border border-yellow-105 dark:border-yellow-905/20",
    selection: "selection:bg-yellow-400 selection:text-black",
    iconBg: "bg-yellow-50 dark:bg-yellow-950/30",
    iconText: "text-amber-750 dark:text-yellow-350",
    textMuted: "text-amber-700 dark:text-yellow-450",
    primaryBgBtn: "bg-yellow-400 hover:bg-yellow-500 text-black dark:bg-yellow-400 dark:hover:bg-yellow-300 dark:text-black"
  },
  blue: {
    accentText: "text-blue-600 dark:text-blue-400",
    accentBg: "bg-blue-600 text-white dark:bg-blue-500 dark:text-black",
    accentHoverBg: "hover:bg-blue-700 dark:hover:bg-blue-400",
    accentBorder: "border-blue-600 dark:border-blue-400",
    accentRing: "focus:ring-blue-500 dark:focus:ring-blue-400",
    badgeBg: "bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/20",
    selection: "selection:bg-[#1d4ed8] selection:text-white",
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    iconText: "text-blue-600 dark:text-blue-400",
    textMuted: "text-blue-600/80 dark:text-blue-400/80",
    primaryBgBtn: "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-450 dark:text-black"
  },
  violet: {
    accentText: "text-violet-600 dark:text-violet-400",
    accentBg: "bg-violet-600 text-white dark:bg-violet-500 dark:text-black",
    accentHoverBg: "hover:bg-violet-700 dark:hover:bg-violet-400",
    accentBorder: "border-violet-600 dark:border-violet-400",
    accentRing: "focus:ring-violet-500 dark:focus:ring-violet-400",
    badgeBg: "bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-300 border border-violet-100 dark:border-violet-900/20",
    selection: "selection:bg-violet-500 selection:text-white",
    iconBg: "bg-violet-50 dark:bg-violet-950/30",
    iconText: "text-violet-600 dark:text-violet-400",
    textMuted: "text-violet-600/80 dark:text-violet-400/80",
    primaryBgBtn: "bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-500 dark:hover:bg-violet-450 dark:text-black"
  },
  rose: {
    accentText: "text-rose-600 dark:text-rose-400",
    accentBg: "bg-rose-600 text-white dark:bg-rose-500 dark:text-black",
    accentHoverBg: "hover:bg-rose-700 dark:hover:bg-rose-400",
    accentBorder: "border-rose-600 dark:border-rose-400",
    accentRing: "focus:ring-rose-500 dark:focus:ring-rose-400",
    badgeBg: "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900/20",
    selection: "selection:bg-rose-500 selection:text-white",
    iconBg: "bg-rose-50 dark:bg-rose-950/30",
    iconText: "text-rose-600 dark:text-rose-400",
    textMuted: "text-rose-600/80 dark:text-rose-400/80",
    primaryBgBtn: "bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-500 dark:hover:bg-rose-450 dark:text-black"
  }
};

export default function App() {
  // 1. Core States
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()));
  const [currentTab, setCurrentTab] = useState<"calendar" | "routines" | "wallet" | "settings">("calendar");
  const [calendarWeeks, setCalendarWeeks] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("calendar_weeks");
      return saved ? parseInt(saved, 10) : 35; // Default is 35 (5 weeks)
    } catch {
      return 35;
    }
  });

  // 1.0.3 Wallet Security & Password Locking States
  const [walletPassword, setWalletPassword] = useState<string>(() => {
    try {
      return localStorage.getItem("wallet_password") || "";
    } catch {
      return "";
    }
  });

  const [isWalletLockEnabled, setIsWalletLockEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("is_wallet_lock_enabled") === "true";
    } catch {
      return false;
    }
  });

  const [isWalletUnlocked, setIsWalletUnlocked] = useState<boolean>(false);

  // Settings inputs for modifying the wallet password
  const [currentWalletPasswordInput, setCurrentWalletPasswordInput] = useState("");
  const [newWalletPasswordInput, setNewWalletPasswordInput] = useState("");
  const [newWalletPasswordConfirmInput, setNewWalletPasswordConfirmInput] = useState("");
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [walletPasswordStatus, setWalletPasswordStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Sync wallet security settings with localStorage
  useEffect(() => {
    try {
      localStorage.setItem("is_wallet_lock_enabled", isWalletLockEnabled ? "true" : "false");
    } catch (e) {
      console.error("is_wallet_lock_enabled sync error:", e);
    }
  }, [isWalletLockEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("wallet_password", walletPassword);
    } catch (e) {
      console.error("wallet_password sync error:", e);
    }
  }, [walletPassword]);

  // Secure auto-locking feature: Relock description whenever user leaves the wallet tab
  useEffect(() => {
    if (currentTab !== "wallet") {
      setIsWalletUnlocked(false);
    }
  }, [currentTab]);

  // Zero-out reset handler for forgotten wallet passwords
  const handleResetWalletSecurityAndAmounts = () => {
    try {
      const updatedRoutines = routines.map((r) => {
        const isInc = r.category.toLowerCase() === "gelir";
        const isPay = r.category.toLowerCase() === "ödemeler";
        if (isInc || isPay) {
          let newTitle = r.title;
          
          // Replace amount in parentheses with (0 TL) safely
          newTitle = newTitle.replace(/\(\s*\d+(?:\s*[.,]\s*\d+)?\s*(?:tl|try|lira|\$|€)?\s*\)/gi, "(0 TL)");
          // If no currency parenthesis exists, strip digit currency suffixes and append (0 TL)
          if (!newTitle.includes("(0 TL)")) {
            newTitle = `${newTitle.replace(/\s*\d+(?:\s*[.,]\s*\d+)?\s*(?:tl|try|lira|\$|€)/gi, "").trim()} (0 TL)`;
          }

          let newDesc = r.description;
          newDesc = newDesc.replace(/\d+(?:\s*[.,]\s*\d+)?\s*(?:tl|try|lira|\$|€)/gi, "0 TL");

          return {
            ...r,
            title: newTitle,
            description: newDesc,
          };
        }
        return r;
      });

      // Update state and persistent storage
      setRoutines(updatedRoutines);
      localStorage.setItem("user_routines", JSON.stringify(updatedRoutines));

      // Reset security configuration
      setWalletPassword("");
      localStorage.removeItem("wallet_password");
      setIsWalletLockEnabled(false);
      localStorage.setItem("is_wallet_lock_enabled", "false");
      setIsWalletUnlocked(false);

      // Clean inputs
      setCurrentWalletPasswordInput("");
      setNewWalletPasswordInput("");
      setNewWalletPasswordConfirmInput("");
      setShowResetConfirmation(false);

      setWalletPasswordStatus({
        type: "success",
        message: "Cüzdan kilit şifresi başarıyla sıfırlandı ve tüm gelir/gider miktarları güvenlik gereği 0 TL olarak güncellendi!",
      });

      // Notify user via logs
      const newNotif: NotificationItem = {
        id: `wallet-reset-${Date.now()}`,
        title: "Cüzdan Sıfırlandı",
        message: "Cüzdan erişim şifresi sıfırlandı. Finansal verilerinizin gizliliğini korumak amacıyla tüm tutarlar 0 TL yapıldı.",
        time: new Date().toISOString(),
        date: toLocalDateString(new Date()),
        read: false,
        type: "system",
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
    } catch (e) {
      console.error("Resetting wallet levels and credentials error:", e);
    }
  };

  // 1.0.1 Multi-Color Primary Theme Mode
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("app_theme");
      if (saved === "basic") return "orange";
      return saved || "orange";
    } catch {
      return "orange";
    }
  });

  const activeClasses = useMemo(() => {
    return THEME_MAP[activeTheme] || THEME_MAP.orange || THEME_MAP.yellow;
  }, [activeTheme]);

  // 1.0.2 Visual Layout Design Template Mode
  const [designTemplate, setDesignTemplate] = useState<string>(() => {
    try {
      return localStorage.getItem("app_design_template") || "modern";
    } catch {
      return "modern";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("app_design_template", designTemplate);
    } catch (e) {
      console.error("Local storage design template sync error:", e);
    }
  }, [designTemplate]);

  // Theme template lookups for dynamic layout overrides
  const templateCardClass = useMemo(() => getTemplateClass(designTemplate, "card"), [designTemplate]);
  const templateBtnClass = useMemo(() => getTemplateClass(designTemplate, "button"), [designTemplate]);
  const templateBorderClass = useMemo(() => getTemplateClass(designTemplate, "borderClass"), [designTemplate]);
  const templateDividerClass = useMemo(() => getTemplateClass(designTemplate, "divider"), [designTemplate]);
  const templateBadgeClass = useMemo(() => getTemplateClass(designTemplate, "badge"), [designTemplate]);
  const templateInputClass = useMemo(() => getTemplateClass(designTemplate, "input"), [designTemplate]);
  const templateModalClass = useMemo(() => getTemplateClass(designTemplate, "modal"), [designTemplate]);

  // 1.1 Theme State & Styling
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        return saved === "dark";
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("theme", darkMode ? "dark" : "light");
      document.documentElement.classList.toggle("dark", darkMode);
    } catch (e) {
      console.error("Local storage theme sync error:", e);
    }
  }, [darkMode]);

  // 1.5 Category States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem("user_categories");
      if (saved) {
        const parsed = JSON.parse(saved) as Category[];
        let updated = [...parsed];
        let hasChanges = false;
        if (!updated.some((c) => c.name.toLowerCase() === "gelir")) {
          updated.push({ name: "Gelir", color: "emerald", icon: "💰" });
          hasChanges = true;
        }
        if (!updated.some((c) => c.name.toLowerCase() === "ödemeler")) {
          updated.push({ name: "Ödemeler", color: "rose", icon: "💵" });
          hasChanges = true;
        }
        if (!updated.some((c) => {
          const nameLower = c.name.toLowerCase();
          return nameLower === "doğum günü" || nameLower === "dogum gunu" || c.name.includes("Doğum Günü");
        })) {
          updated.push({ name: "Doğum Günü", color: "rose", icon: "🎂" });
          hasChanges = true;
        }
        if (hasChanges) {
          localStorage.setItem("user_categories", JSON.stringify(updated));
        }
        return updated;
      }
    } catch (e) {
      console.error("Local storage sync error parsing categories:", e);
    }
    return DEFAULT_CATEGORIES;
  });

  // 1.5.1 Snooze States
  const [snoozedAlarms, setSnoozedAlarms] = useState<SnoozedAlarm[]>(() => {
    try {
      const saved = localStorage.getItem("user_snoozed_alarms");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Local storage sync error parsing snoozed alarms:", e);
    }
    return [];
  });

  // 2. Auxiliary UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [deleteRoutineId, setDeleteRoutineId] = useState<string | null>(null);
  const [isNotificationInboxOpen, setIsNotificationInboxOpen] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  // 3. active Stateful Trigger (The Alarm Overlay state)
  const [activeTriggeredAlarm, setActiveTriggeredAlarm] = useState<Routine | null>(null);
  const [alarmTriggerDate, setAlarmTriggerDate] = useState("");
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [customSnoozeMinutes, setCustomSnoozeMinutes] = useState(10);

  // Backend state indicators
  const [backupStatus, setBackupStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto clean notifications after certain seconds
  useEffect(() => {
    if (backupStatus) {
      const timer = setTimeout(() => {
        setBackupStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [backupStatus]);

  // Reset the snooze panel status whenever a triggered alarm changes
  useEffect(() => {
    if (!activeTriggeredAlarm) {
      setShowSnoozeOptions(false);
      setCustomSnoozeMinutes(10);
    }
  }, [activeTriggeredAlarm]);

  // Refs to prevent duplicate fire on the same minute
  const firedRemindersRef = useRef<Record<string, boolean>>({});

  // 4. Initial Mount: Load configurations and run automatic DB prune
  useEffect(() => {
    // Determine notification permission status on load
    if ("Notification" in window) {
      setHasNotificationPermission(Notification.permission === "granted");
    }

    try {
      const savedRoutines = localStorage.getItem("user_routines");
      if (savedRoutines) {
        setRoutines(JSON.parse(savedRoutines));
      } else {
        // First utilization default routines
        setRoutines(DEFAULT_ROUTINES);
        localStorage.setItem("user_routines", JSON.stringify(DEFAULT_ROUTINES));
      }

      const savedLogs = localStorage.getItem("user_routine_logs");
      let loadedLogs: RoutineLog[] = savedLogs ? JSON.parse(savedLogs) : [];

      // Constraint Checklist: Prune logs older than 6 months automatically to keep performance high
      const pruned = pruneOldLogs(loadedLogs);
      setLogs(pruned);
      localStorage.setItem("user_routine_logs", JSON.stringify(pruned));

      const savedNotifications = localStorage.getItem("user_notifications");
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, []);

  // 5. Save configurations of routines & logs on update
  useEffect(() => {
    if (routines.length > 0) {
      localStorage.setItem("user_routines", JSON.stringify(routines));
    }
  }, [routines]);

  useEffect(() => {
    localStorage.setItem("user_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("user_routine_logs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("user_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("user_snoozed_alarms", JSON.stringify(snoozedAlarms));
  }, [snoozedAlarms]);

  // Clean old/expired snoozed alarms from previous days
  useEffect(() => {
    const today = toLocalDateString(new Date());
    setSnoozedAlarms((prev) => prev.filter((sa) => sa.date >= today));
  }, []);

  // 6. Background Engine: Listens to the client-side clock to fire timely reminders!
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = now.toTimeString().slice(0, 5); // "HH:MM"
      const currentDateStr = toLocalDateString(now);

      // Get occurrence routines scheduled FOR TODAY
      const todaysRoutines = getOccurrencesForDate(routines, currentDateStr);

      todaysRoutines.forEach((routine) => {
        if (!routine.isReminderActive) return;

        // Check if current time matches scheduled time OR if there's a matching active snooze
        const isOriginalTime = routine.time === currentHHMM;
        const matchingSnooze = snoozedAlarms.find(
          (sa) => sa.routineId === routine.id && sa.snoozeUntilTime === currentHHMM && sa.date === currentDateStr
        );

        if (isOriginalTime || matchingSnooze) {
          // Unique key to prevent double firing in the same minute
          const reminderKey = isOriginalTime
            ? `${routine.id}_${currentDateStr}_${currentHHMM}`
            : `${routine.id}_${currentDateStr}_snooze_${matchingSnooze?.id}_${currentHHMM}`;

          if (!firedRemindersRef.current[reminderKey]) {
            firedRemindersRef.current[reminderKey] = true;

            // Verify if completed already for today to avoid annoying the user
            const logKey = `${routine.id}_${currentDateStr}`;
            const isCompletedToday = logs.some((l) => l.id === logKey && l.completed);

            if (!isCompletedToday) {
              // Trigger active in-app alarm and sound
              setActiveTriggeredAlarm(routine);
              setAlarmTriggerDate(currentDateStr);
              playNotificationSound();

              // Send native push integration if allowed
              sendBrowserNotification(
                isOriginalTime 
                  ? `Rutin Zamanı: ${routine.title}`
                  : `Rutin Zamanı (Ertelenmiş): ${routine.title}`,
                isOriginalTime
                  ? `${routine.category} • Hedeflediğiniz vakit geldi. Rutini tamamlamak ister misiniz?`
                  : `${routine.category} • Ertelediğiniz hatırlatma vakti geldi.`
              );

              // Add to notification inbox lists
              const newNotif: NotificationItem = {
                id: `notif_${Date.now()}`,
                routineId: routine.id,
                title: isOriginalTime ? routine.title : `${routine.title} (Ertelendi)`,
                message: isOriginalTime
                  ? `Rutininizin hatırlatıcı saati geldi (${routine.time}).`
                  : `Ertelediğiniz rutinin vakti geldi (Orijinal saat: ${routine.time}, Yeni saat: ${currentHHMM}).`,
                time: now.toISOString(),
                date: currentDateStr,
                read: false,
                type: "reminder",
              };

              setNotifications((prev) => [newNotif, ...prev].slice(0, 50)); // limit inbox details to max 50 items
            }
          }
        }
      });
    };

    // Run checker immediately on boot and then once every 15 seconds for precision
    checkReminders();
    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [routines, logs, snoozedAlarms]);

  // 7. Request Native Permissions Shortcut
  const handleRequestPermission = async () => {
    const isGranted = await requestBrowserNotificationPermission();
    setHasNotificationPermission(isGranted);
    if (isGranted) {
      playSuccessChime();
    }
  };

  // 7.5. Backup and Restore Operations
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "1.0.0",
        backupDate: new Date().toISOString(),
        routines,
        logs,
        categories
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      const formattedDate = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("download", `rutin_takip_yedek_${formattedDate}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Add to notification list
      const newNotif: NotificationItem = {
        id: `backup-${Date.now()}`,
        title: "Yedek Dosyası İndirildi",
        message: "Tüm şablonlarınız ve tamamlanma kayıtlarınız yerel cihazınıza başarıyla indirildi.",
        time: new Date().toISOString(),
        date: toLocalDateString(new Date()),
        read: false,
        type: "system"
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 50));
      setBackupStatus({
        type: "success",
        message: "Verileriniz başarıyla yedeklendi ve .JSON dosyası olarak indirildi!"
      });
      playSuccessChime();
    } catch (e) {
      console.error("Yedekleme hatası:", e);
      setBackupStatus({
        type: "error",
        message: "Veriler yedeklenirken teknik bir sorun oluştu."
      });
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        
        // Basic check to see if we have valid collections
        if (parsed && (Array.isArray(parsed.routines) || Array.isArray(parsed.logs))) {
          const importedRoutines = Array.isArray(parsed.routines) ? parsed.routines : [];
          const importedLogs = Array.isArray(parsed.logs) ? parsed.logs : [];
          const importedCategories = Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_CATEGORIES;

          // Replace App States
          setRoutines(importedRoutines);
          setLogs(importedLogs);
          setCategories(importedCategories);

          // Commit straight to localStorage to avoid temporary lag
          localStorage.setItem("user_routines", JSON.stringify(importedRoutines));
          localStorage.setItem("user_routine_logs", JSON.stringify(importedLogs));
          localStorage.setItem("user_categories", JSON.stringify(importedCategories));

          // Log in notification section
          const alertNotif: NotificationItem = {
            id: `restore-${Date.now()}`,
            title: "Yedek Başarıyla Yüklendi",
            message: `${importedRoutines.length} rutin ve ${importedLogs.length} tamamlanma geçmişi başarıyla içe aktarıldı.`,
            time: new Date().toISOString(),
            date: toLocalDateString(new Date()),
            read: false,
            type: "system"
          };
          setNotifications(prev => [alertNotif, ...prev].slice(0, 50));
          setBackupStatus({
            type: "success",
            message: `Yedek yüklendi! ${importedRoutines.length} rutin ve ${importedLogs.length} geçmiş başarıyla güncellendi.`
          });
          playSuccessChime();
        } else {
          setBackupStatus({
            type: "error",
            message: "Uyumsuz dosya formatı. Lütfen sistemimizden indirilmiş olan geçerli bir JSON yedek belgesi seçin."
          });
        }
      } catch (err) {
        console.error("Yedek yükleme hatası:", err);
        setBackupStatus({
          type: "error",
          message: "Dosya okunurken veya ayrıştırılırken hata oluştu."
        });
      }
    };
    fileReader.readAsText(file);
    event.target.value = ""; // Clear input target
  };

  // 8. Core Operations: Toggle Routine Completion
  const handleToggleComplete = (routineId: string, dateStr: string) => {
    const logId = `${routineId}_${dateStr}`;
    const existingLogIndex = logs.findIndex((l) => l.id === logId);

    if (existingLogIndex > -1) {
      // Toggle value
      const updatedLogs = [...logs];
      const previousValue = updatedLogs[existingLogIndex].completed;
      updatedLogs[existingLogIndex] = {
        ...updatedLogs[existingLogIndex],
        completed: !previousValue,
        completedAt: new Date().toISOString(),
      };
      setLogs(updatedLogs);

      if (!previousValue) {
        playSuccessChime(); // satisfy with a completion chime!
      }
    } else {
      // Create new record
      const newLog: RoutineLog = {
        id: logId,
        routineId,
        date: dateStr,
        completed: true,
        completedAt: new Date().toISOString(),
      };
      setLogs((prev) => [newLog, ...prev]);
      playSuccessChime();
    }
  };

  // 9. Core Operations: Save Routine (Write / Update)
  const handleSaveRoutine = (
    routineData: Omit<Routine, "id" | "createdAt"> & { id?: string }
  ) => {
    if (routineData.id) {
      // Editing
      setRoutines((prev) =>
        prev.map((r) =>
          r.id === routineData.id
            ? { ...r, ...routineData, createdAt: r.createdAt } // preserve original creation
            : r
        )
      );
    } else {
      // Creating new
      const newRoutine: Routine = {
        ...routineData,
        id: `routine_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setRoutines((prev) => [newRoutine, ...prev]);
    }
    setEditingRoutine(null);
  };

  // 10. Core Operations: Delete Routine
  const handleDeleteRoutine = (routineId: string) => {
    setDeleteRoutineId(routineId);
  };

  const handleConfirmDeleteRoutine = () => {
    if (!deleteRoutineId) return;
    setRoutines((prev) => prev.filter((r) => r.id !== deleteRoutineId));
    // Delete corresponding logs to prevent performance memory leaks
    setLogs((prev) => prev.filter((l) => l.routineId !== deleteRoutineId));
    
    // Cleanup notification logs
    setNotifications((prev) => prev.filter((n) => n.routineId !== deleteRoutineId));
    setDeleteRoutineId(null);
  };

  // 10.5 Core Operations: Category Management
  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const handleUpdateCategory = (oldName: string, updatedCat: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.name === oldName ? updatedCat : c))
    );
    // Renaming routines category
    setRoutines((prev) =>
      prev.map((r) => (r.category === oldName ? { ...r, category: updatedCat.name } : r))
    );
  };

  const handleDeleteCategory = (catName: string) => {
    setCategories((prev) => prev.filter((c) => c.name !== catName));
    // Set fallback on deleted category routines
    setRoutines((prev) =>
      prev.map((r) => (r.category === catName ? { ...r, category: "Genel" } : r))
    );
  };

  // 11. Core Operations: Toggle individual reminders
  const handleToggleReminder = (routineId: string) => {
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === routineId ? { ...r, isReminderActive: !r.isReminderActive } : r
      )
    );
  };

  // 12. Computed statistics for the top banner summary
  const streak = useMemo(() => calculateStreak(logs), [logs]);

  const activeRoutinesCount = routines.length;

  const totalLogsCount = logs.filter((l) => l.completed).length;

  const monthlyTasks = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const list: {
      id: string;
      dateStr: string;
      routine: Routine;
      isCompleted: boolean;
    }[] = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const occurrences = getOccurrencesForDate(routines, dateStr);
      
      occurrences.forEach((routine) => {
        const logId = `${routine.id}_${dateStr}`;
        const isCompleted = logs.some((l) => l.id === logId && l.completed);
        list.push({
          id: `${routine.id}_${dateStr}`,
          dateStr,
          routine,
          isCompleted,
        });
      });
    }
    
    return list.sort((a, b) => {
      if (a.dateStr !== b.dateStr) {
        return a.dateStr.localeCompare(b.dateStr);
      }
      return a.routine.time.localeCompare(b.routine.time);
    });
  }, [routines, logs]);

  const groupedTasks = useMemo(() => {
    const groups: { [dateStr: string]: typeof monthlyTasks } = {};
    monthlyTasks.forEach((t) => {
      if (!groups[t.dateStr]) {
        groups[t.dateStr] = [];
      }
      groups[t.dateStr].push(t);
    });
    return groups;
  }, [monthlyTasks]);

  const handleDismissAlarm = () => {
    setActiveTriggeredAlarm(null);
  };

  const handleCompleteAlarm = () => {
    if (activeTriggeredAlarm) {
      handleToggleComplete(activeTriggeredAlarm.id, alarmTriggerDate);
      setActiveTriggeredAlarm(null);
    }
  };

  const handleSnoozeAlarm = (minutes: number) => {
    if (!activeTriggeredAlarm) return;
    
    const now = new Date();
    const target = new Date(now.getTime() + minutes * 60000);
    const snoozeUntilTime = `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`;
    const currentDateStr = alarmTriggerDate || toLocalDateString(now);

    const newSnooze: SnoozedAlarm = {
      id: `snooze_${Date.now()}`,
      routineId: activeTriggeredAlarm.id,
      snoozeUntilTime,
      date: currentDateStr,
      originalTime: activeTriggeredAlarm.time,
    };

    setSnoozedAlarms((prev) => [...prev, newSnooze]);
    
    // Add system notification for this snooze
    const snoozeNotif: NotificationItem = {
      id: `notif_snooze_${Date.now()}`,
      routineId: activeTriggeredAlarm.id,
      title: `Ertelendi: ${activeTriggeredAlarm.title}`,
      message: `Rutininiz ${minutes} dakika sonraya (${snoozeUntilTime}) ertelendi.`,
      time: now.toISOString(),
      date: currentDateStr,
      read: true,
      type: "system",
    };
    
    setNotifications((prev) => [snoozeNotif, ...prev].slice(0, 50));
    setActiveTriggeredAlarm(null);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setIsNotificationInboxOpen(false);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <div id="app-root" className={`min-h-screen bg-[#FBFBFB] dark:bg-[#121212] text-[#1A1A1A] dark:text-[#E2E8F0] flex flex-col ${getTemplateClass(designTemplate, "font")} ${activeClasses.selection} transition-colors duration-200`}>
      
              {/* 🛎️ Active Alarm Overlay Pop-up Modal */}
      <AnimatePresence>
        {activeTriggeredAlarm && (
          <div
            id="alarm-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div
              id="alarm-popup-card"
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: -30 }}
              transition={{ type: "spring", bounce: 0.25 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-3xl shadow-xl p-6 overflow-hidden relative text-center space-y-5"
            >
              <div className="mx-auto w-16 h-16 bg-[#F9F9F9] dark:bg-zinc-800 rounded-full border border-[#E5E5E5] dark:border-zinc-700 flex items-center justify-center animate-bounce text-[#1A1A1A] dark:text-white relative">
                <Bell className="w-8 h-8" />
                <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1A1A1A] dark:bg-zinc-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1A1A1A] dark:bg-zinc-400"></span>
                </span>
              </div>

              {!showSnoozeOptions ? (
                <>
                  <div className="space-y-1.55">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A] dark:text-zinc-300 bg-[#F0F0F0] dark:bg-zinc-800 px-3 py-1 rounded-full border border-[#E5E5E5] dark:border-zinc-700/85">
                      RUTİN HATIRLATICI VAKTİ!
                    </span>
                    <h3 id="alarm-routine-title" className="text-lg font-medium text-[#1A1A1A] dark:text-white pt-2">
                      {activeTriggeredAlarm.title}
                    </h3>
                    <p id="alarm-routine-time" className="text-xs text-[#777777] dark:text-zinc-400 font-normal flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#777777] dark:text-zinc-400" />
                      <span>Saat {activeTriggeredAlarm.time} • {activeTriggeredAlarm.category}</span>
                    </p>
                    {activeTriggeredAlarm.description && (
                      <p id="alarm-routine-desc" className="text-xs text-[#666666] dark:text-zinc-300 bg-[#F9F9F9] dark:bg-zinc-850 p-3 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 max-h-24 overflow-y-auto font-light leading-relaxed">
                        "{activeTriggeredAlarm.description}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5 pt-2">
                    <button
                      type="button"
                      id="alarm-complete-btn"
                      onClick={handleCompleteAlarm}
                      className="w-full py-3.5 text-xs font-semibold text-white dark:text-zinc-950 bg-[#1A1A1A] dark:bg-zinc-100 hover:bg-black dark:hover:bg-white cursor-pointer rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Şimdi Tamamla</span>
                    </button>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        id="alarm-snooze-btn"
                        onClick={() => setShowSnoozeOptions(true)}
                        className="flex-1 py-3 text-xs font-semibold text-amber-700 dark:text-amber-500 hover:text-white dark:hover:text-black bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-600 dark:hover:bg-amber-500 border border-amber-200 dark:border-amber-900/40 hover:border-amber-600 dark:hover:border-amber-500 cursor-pointer rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>Ertele...</span>
                      </button>
                      <button
                        type="button"
                        id="alarm-dismiss-btn"
                        onClick={handleDismissAlarm}
                        className="flex-1 py-3 text-xs font-semibold text-[#777777] dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white bg-[#F5F5F5] dark:bg-zinc-800 hover:bg-[#EAEAEA] dark:hover:bg-zinc-700 cursor-pointer rounded-xl transition border border-[#E5E5E5] dark:border-zinc-700"
                      >
                        Sessize Al / Kapat
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 border-b border-[#E5E5E5] dark:border-zinc-805 pb-2">
                    <Timer className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-[#1A1A1A] dark:text-zinc-100 uppercase tracking-wider">Erteleme Süresi Seçin</span>
                  </div>

                  <p className="text-xs text-[#666666] dark:text-zinc-300">
                    <strong>{activeTriggeredAlarm.title}</strong> hatırlatıcısını ne kadar süreyle ertelemek istersiniz?
                  </p>
                  
                  {/* Presets Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleSnoozeAlarm(mins)}
                        className="py-2.5 px-3 bg-slate-50 dark:bg-zinc-800 hover:bg-[#1A1A1A] dark:hover:bg-zinc-200 text-slate-700 dark:text-zinc-300 hover:text-white dark:hover:text-zinc-950 font-semibold text-xs border border-slate-200 dark:border-zinc-700 hover:border-black rounded-lg cursor-pointer transition text-center"
                      >
                        {mins < 60 ? `${mins} dk` : "1 saat"}
                      </button>
                    ))}
                  </div>

                  {/* Custom Minute Form */}
                  <div className="bg-[#F9F9F9] dark:bg-zinc-850 p-3 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 space-y-2">
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                      Özel Dakika Belirleyin
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={customSnoozeMinutes === 0 ? "" : customSnoozeMinutes}
                        onChange={(e) => setCustomSnoozeMinutes(Math.max(1, Number(e.target.value)))}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSnoozeAlarm(customSnoozeMinutes)}
                        className="px-3.5 py-1.5 text-xs text-white bg-amber-500 hover:bg-amber-600 font-semibold rounded-lg cursor-pointer transition shadow-xs flex items-center gap-1 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ertele</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSnoozeOptions(false)}
                    className="w-full py-2.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-[#1A1A1A] dark:hover:text-white bg-white dark:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl cursor-pointer transition text-center"
                  >
                    Geri Dön
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Page Top Navigation Header */}
      <header id="main-header" className="sticky top-0 z-40 bg-white dark:bg-[#1E1E1E] border-b border-[#E5E5E5] dark:border-[#2C2C2C] shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-200">
        
        {/* Brand Logo & Name */}
        <div id="brand-logo" className="flex items-center space-x-3 select-none">
          <div className={`w-10 h-10 ${activeClasses.accentBg} rounded-xl flex items-center justify-center font-bold border dark:border-zinc-800 transition duration-300`}>
            <ListTodo className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-medium text-[#1A1A1A] dark:text-white tracking-tight leading-none">
              Rutin ve Hatırlatıcı Takvimi
            </h1>
            <p className="text-[10px] font-semibold text-[#777777] dark:text-zinc-400 uppercase tracking-wider mt-1">
              100% Yerel & Yüksek Performans
            </p>
          </div>
        </div>

        {/* Center navigation tabs (Icon-Only single screen toggle for optimal spacing) */}
        <nav id="header-nav" className={`hidden md:flex items-center space-x-1.5 p-1 ${
          designTemplate === "brutalist" ? "border-2 border-black dark:border-zinc-200 bg-white dark:bg-zinc-950 rounded-none" :
          designTemplate === "minimal" ? "bg-zinc-100/45 dark:bg-zinc-900/40 rounded-full" :
          designTemplate === "terminal" ? "border border-dashed border-zinc-700 bg-zinc-950 rounded-none" :
          "border dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-900/60 rounded-xl"
        }`}>
          <button
            id="nav-tab-calendar"
            onClick={() => setCurrentTab("calendar")}
            title="Takvim & Günlük Takip"
            className={`p-2.5 flex items-center justify-center cursor-pointer transition duration-150 ${
              designTemplate === "brutalist" ? "rounded-none" :
              designTemplate === "minimal" ? "rounded-full" :
              designTemplate === "terminal" ? "rounded-none" : "rounded-xl"
            } ${
              currentTab === "calendar"
                ? (designTemplate === "brutalist" ? "bg-black text-white dark:bg-white dark:text-black font-black border border-black dark:border-white scale-[1.02]" :
                   designTemplate === "minimal" ? "bg-zinc-900 text-white dark:bg-zinc-105 dark:text-zinc-950 font-semibold" :
                   designTemplate === "terminal" ? "bg-zinc-900 border border-dashed border-zinc-500 text-green-400" :
                   `bg-white dark:bg-zinc-800 ${activeClasses.accentText} shadow-xs font-bold scale-[1.02]`)
                : (designTemplate === "terminal" ? "text-zinc-500 hover:text-green-300" : "text-[#777777] dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-[#EAEAEA] dark:hover:bg-zinc-800/40")
            }`}
          >
            <CalendarIcon className="w-4.5 h-4.5" />
          </button>
          <button
            id="nav-tab-routines"
            onClick={() => setCurrentTab("routines")}
            title={`Tüm Rutinlerim (${activeRoutinesCount})`}
            className={`p-2.5 flex items-center justify-center cursor-pointer transition duration-150 relative ${
              designTemplate === "brutalist" ? "rounded-none" :
              designTemplate === "minimal" ? "rounded-full" :
              designTemplate === "terminal" ? "rounded-none" : "rounded-xl"
            } ${
              currentTab === "routines"
                ? (designTemplate === "brutalist" ? "bg-black text-white dark:bg-white dark:text-black font-black border border-black dark:border-white scale-[1.02]" :
                   designTemplate === "minimal" ? "bg-zinc-900 text-white dark:bg-zinc-105 dark:text-zinc-950 font-semibold" :
                   designTemplate === "terminal" ? "bg-zinc-900 border border-dashed border-zinc-500 text-green-400" :
                   `bg-white dark:bg-zinc-800 ${activeClasses.accentText} shadow-xs font-bold scale-[1.02]`)
                : (designTemplate === "terminal" ? "text-zinc-500 hover:text-green-300" : "text-[#777777] dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-[#EAEAEA] dark:hover:bg-zinc-800/40")
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            {activeRoutinesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>
          <button
            id="nav-tab-wallet"
            onClick={() => setCurrentTab("wallet")}
            title="Cüzdan & Finansal Rutin Takibi"
            className={`p-2.5 flex items-center justify-center cursor-pointer transition duration-150 relative ${
              designTemplate === "brutalist" ? "rounded-none" :
              designTemplate === "minimal" ? "rounded-full" :
              designTemplate === "terminal" ? "rounded-none" : "rounded-xl"
            } ${
              currentTab === "wallet"
                ? (designTemplate === "brutalist" ? "bg-black text-white dark:bg-white dark:text-black font-black border border-black dark:border-white scale-[1.02]" :
                   designTemplate === "minimal" ? "bg-zinc-900 text-white dark:bg-zinc-105 dark:text-zinc-950 font-semibold" :
                   designTemplate === "terminal" ? "bg-zinc-900 border border-dashed border-zinc-500 text-green-400" :
                   `bg-white dark:bg-zinc-800 ${activeClasses.accentText} shadow-xs font-bold scale-[1.02]`)
                : (designTemplate === "terminal" ? "text-zinc-500 hover:text-green-300" : "text-[#777777] dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-[#EAEAEA] dark:hover:bg-zinc-800/40")
            }`}
          >
            <div className="relative">
              <Wallet className="w-4.5 h-4.5" />
              {isWalletLockEnabled && walletPassword && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white dark:text-zinc-950 rounded-full p-0.5 scale-75 border border-white dark:border-zinc-900 shadow-sm flex items-center justify-center">
                  <Lock className="w-2 h-2" />
                </span>
              )}
            </div>
          </button>
          <button
            id="nav-tab-settings"
            onClick={() => setCurrentTab("settings")}
            title="Ayarlar & Veri"
            className={`p-2.5 flex items-center justify-center cursor-pointer transition duration-150 ${
              designTemplate === "brutalist" ? "rounded-none" :
              designTemplate === "minimal" ? "rounded-full" :
              designTemplate === "terminal" ? "rounded-none" : "rounded-xl"
            } ${
              currentTab === "settings"
                ? (designTemplate === "brutalist" ? "bg-black text-white dark:bg-white dark:text-black font-black border border-black dark:border-white scale-[1.02]" :
                   designTemplate === "minimal" ? "bg-zinc-900 text-white dark:bg-zinc-105 dark:text-zinc-950 font-semibold" :
                   designTemplate === "terminal" ? "bg-zinc-900 border border-dashed border-zinc-500 text-green-400" :
                   `bg-white dark:bg-zinc-800 ${activeClasses.accentText} shadow-xs font-bold scale-[1.02]`)
                : (designTemplate === "terminal" ? "text-zinc-500 hover:text-green-300" : "text-[#777777] dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-[#EAEAEA] dark:hover:bg-zinc-800/40")
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </nav>

        {/* Right Actions, Notifications bell inbox and create button */}
        <div id="header-actions" className="flex items-center space-x-2 sm:space-x-3">

          {/* Notifications Dropdown Container */}
          <div className="relative">
            <button
              id="notifications-inbox-trigger"
              onClick={() => setIsNotificationInboxOpen(!isNotificationInboxOpen)}
              className="p-2.5 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] border border-[#E5E5E5] dark:border-[#2C2C2C] cursor-pointer text-[#777777] dark:text-[#A0A0A0] hover:text-[#1A1A1A] dark:hover:text-white transition relative"
              title="Hatırlatma Alarmları Günlüğü"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-5 h-5 px-1.5 ${activeClasses.accentBg} font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 transition duration-300`}>
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification Inbox List Dropdown panel */}
            <AnimatePresence>
              {isNotificationInboxOpen && (
                <div id="notification-dropdown-overlay" className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-[#E5E5E5] dark:border-[#2C2C2C] overflow-hidden z-50">
                  <div className="p-4 bg-[#F9F9F9] dark:bg-zinc-850 border-b border-[#E5E5E5] dark:border-[#2C2C2C] flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#1A1A1A] dark:text-white uppercase tracking-wider flex items-center gap-1">
                      <Bell className="w-4 h-4 text-[#1A1A1A] dark:text-white" />
                      <span>Alarmlar Raporu</span>
                    </h3>
                    <div className="flex items-center space-x-2">
                       <button
                        onClick={handleMarkAllNotificationsAsRead}
                        className="text-[10px] font-semibold text-[#1A1A1A] dark:text-zinc-300 hover:underline cursor-pointer"
                      >
                         Okundu Yap
                       </button>
                      <button
                        onClick={handleClearNotifications}
                        className="text-[10px] font-semibold text-[#FF3333] hover:underline cursor-pointer"
                      >
                        Temizle
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto divide-y divide-[#E5E5E5] dark:divide-[#2C2C2C]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-zinc-500 space-y-2">
                        <CheckCircle className="w-8 h-8 text-slate-200 dark:text-zinc-800 mx-auto" />
                        <p className="text-xs font-medium">Herhangi bir alarm kaydı bulunmuyor.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3.5 hover:bg-[#F9F9F9] dark:hover:bg-zinc-800/80 transition ${
                            notif.read ? "opacity-65" : "bg-[#FBFBFB] dark:bg-zinc-800/40"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#1A1A1A] dark:bg-zinc-400 mt-1.5 shrink-0" />
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-semibold text-[#1A1A1A] dark:text-zinc-200">{notif.title}</h4>
                              <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed font-light">{notif.message}</p>
                              <span className="text-[9px] font-medium text-slate-400 dark:text-zinc-500 block mt-1">
                                {new Date(notif.time).toLocaleTimeString("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {" - "}
                                {formatToTurkishDate(notif.date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Create Button */}
          <button
            id="header-create-routine-btn"
            onClick={() => {
              setEditingRoutine(null);
              setIsAddModalOpen(true);
            }}
            className={`px-4 py-2 ${activeClasses.primaryBgBtn} font-semibold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition duration-200`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Rutin Ekle</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation bar helper */}
      <div id="mobile-nav" className="md:hidden flex bg-white dark:bg-zinc-900 border-b border-[#E5E5E5] dark:border-zinc-800 p-1.5 justify-around">
        <button
          id="mobile-tab-calendar"
          onClick={() => setCurrentTab("calendar")}
          title="Takvim"
          className={`flex-1 py-2 text-center rounded-xl flex items-center justify-center transition ${
            currentTab === "calendar" 
              ? `${activeClasses.accentBg} font-bold scale-102 shadow-xs` 
              : "text-slate-650 dark:text-zinc-400 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800/50"
          }`}
        >
          <CalendarIcon className="w-4.5 h-4.5" />
        </button>
        <button
          id="mobile-tab-routines"
          onClick={() => setCurrentTab("routines")}
          title="Rutinler"
          className={`flex-1 py-2 text-center rounded-xl flex items-center justify-center transition relative ${
            currentTab === "routines" 
              ? `${activeClasses.accentBg} font-bold scale-102 shadow-xs` 
              : "text-slate-650 dark:text-zinc-400 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800/50"
          }`}
        >
          <Layers className="w-4.5 h-4.5" />
          {activeRoutinesCount > 0 && (
            <span className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button>
        <button
          id="mobile-tab-wallet"
          onClick={() => setCurrentTab("wallet")}
          title="Cüzdan"
          className={`flex-1 py-1.5 sm:py-2 text-center rounded-xl flex items-center justify-center transition relative ${
            currentTab === "wallet" 
              ? `${activeClasses.accentBg} font-bold scale-102 shadow-xs` 
              : "text-slate-650 dark:text-zinc-400 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800/50"
          }`}
        >
          <div className="relative">
            <Wallet className="w-4.5 h-4.5" />
            {isWalletLockEnabled && walletPassword && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white dark:text-zinc-950 rounded-full p-0.5 scale-[0.68] border border-white dark:border-zinc-900 shadow-sm flex items-center justify-center">
                <Lock className="w-2 h-2" />
              </span>
            )}
          </div>
        </button>
        <button
          id="mobile-tab-settings"
          onClick={() => setCurrentTab("settings")}
          title="Ayarlar"
          className={`flex-1 py-2 text-center rounded-xl flex items-center justify-center transition ${
            currentTab === "settings" 
              ? `${activeClasses.accentBg} font-bold scale-102 shadow-xs` 
              : "text-slate-650 dark:text-zinc-400 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800/50"
          }`}
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Main Dashboard Layout wrapper */}
      <main id="dashboard-wrapper" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Statistics Bento Grid Block (Compact and space-saving) */}
        <section id="statistics-panel" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Stat 1: Habit Streak Chain */}
          <div id="stat-card-streak" className={`${templateCardClass} p-2.5 sm:p-3 flex items-center space-x-2.5 group`}>
            <div className={`p-1.5 sm:p-2 ${designTemplate === "brutalist" ? "rounded-none border border-black" : "rounded-lg"} ${activeClasses.iconBg} ${activeClasses.accentText} group-hover:scale-105 transition duration-200 shrink-0`}>
              <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
                Zincir
              </span>
              <span id="stat-value-streak" className="text-xs sm:text-sm font-semibold text-[#1A1A1A] dark:text-zinc-100 block mt-1 font-mono">
                {streak} Gün Seri
              </span>
            </div>
          </div>

          {/* Stat 2: Active Routines Count */}
          <div id="stat-card-routines" className={`${templateCardClass} p-2.5 sm:p-3 flex items-center space-x-2.5 group`}>
            <div className={`p-1.5 sm:p-2 ${designTemplate === "brutalist" ? "rounded-none border border-black" : "rounded-lg"} ${activeClasses.iconBg} ${activeClasses.accentText} group-hover:scale-105 transition duration-200 shrink-0`}>
              <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
                Rutinler
              </span>
              <span id="stat-value-routines" className="text-xs sm:text-sm font-semibold text-[#1A1A1A] dark:text-zinc-100 block mt-1 font-mono">
                {activeRoutinesCount} Aktif
              </span>
            </div>
          </div>

          {/* Stat 3: Total Completions */}
          <div id="stat-card-completions" className={`${templateCardClass} p-2.5 sm:p-3 flex items-center space-x-2.5 group`}>
            <div className={`p-1.5 sm:p-2 ${designTemplate === "brutalist" ? "rounded-none border border-black" : "rounded-lg"} ${activeClasses.iconBg} ${activeClasses.accentText} group-hover:scale-105 transition duration-200 shrink-0`}>
              <CheckCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
                Başarı
              </span>
              <span id="stat-value-completions" className="text-xs sm:text-sm font-semibold text-[#1A1A1A] dark:text-zinc-100 block mt-1 font-mono">
                {totalLogsCount} Tamamlama
              </span>
            </div>
          </div>

          {/* Stat 4: Reminders Configuration */}
          <button
            id="stat-card-permission"
            type="button"
            onClick={handleRequestPermission}
            className={`w-full text-left p-2.5 sm:p-3 flex items-center space-x-2.5 cursor-pointer group ${templateCardClass} ${
              !hasNotificationPermission && designTemplate === "modern"
                ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30"
                : ""
            }`}
            title="Masaüstü Bildirim İzin Durumu"
          >
            <div className={`p-1.5 sm:p-2 group-hover:scale-105 transition duration-200 shrink-0 ${designTemplate === "brutalist" ? "rounded-none border border-black" : "rounded-lg"} ${hasNotificationPermission ? `${activeClasses.iconBg} ${activeClasses.accentText}` : `${activeClasses.accentBg}`}`}>
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[9px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
                Uyarılı
              </span>
              <span id="stat-value-permission" className="text-xs sm:text-sm font-semibold text-[#1A1A1A] dark:text-zinc-100 truncate block mt-1 font-mono">
                {hasNotificationPermission ? "✓ Açık" : "⚠️ İzin İste"}
              </span>
            </div>
          </button>
        </section>

        {/* Dynamic Display sections depending on the active Tab */}
        <AnimatePresence mode="wait">
          {currentTab === "calendar" ? (
            <motion.div
              key="calendar-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Center Left: Dynamic Calendar Widget */}
              <div id="calendar-left-pane" className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <CalendarView
                  routines={routines}
                  logs={logs}
                  selectedDate={selectedDate}
                  onSelectDate={(date) => setSelectedDate(date)}
                  activeTheme={activeTheme}
                  calendarWeeks={calendarWeeks}
                  designTemplate={designTemplate}
                />
              </div>

              {/* Center Right: Task occurrences List and Quick completions on the select dates */}
              <div id="calendar-right-pane" className="lg:col-span-5 xl:col-span-4 flex flex-col">
                <DailyTaskList
                  dateStr={selectedDate}
                  routines={routines}
                  logs={logs}
                  onToggleComplete={handleToggleComplete}
                  onEditRoutine={(routine) => {
                    setEditingRoutine(routine);
                    setIsAddModalOpen(true);
                  }}
                  onDeleteRoutine={handleDeleteRoutine}
                  activeTheme={activeTheme}
                  designTemplate={designTemplate}
                />
              </div>
            </motion.div>
          ) : currentTab === "routines" ? (
            <motion.div
              key="routines-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <RoutinesManager
                routines={routines}
                onAddRoutineClick={() => {
                  setEditingRoutine(null);
                  setIsAddModalOpen(true);
                }}
                onEditRoutine={(routine) => {
                  setEditingRoutine(routine);
                  setIsAddModalOpen(true);
                }}
                onDeleteRoutine={handleDeleteRoutine}
                onToggleReminder={handleToggleReminder}
                categories={categories}
                onManageCategoriesClick={() => setIsCategoryModalOpen(true)}
                logs={logs}
                onToggleComplete={handleToggleComplete}
                activeTheme={activeTheme}
                designTemplate={designTemplate}
              />
            </motion.div>
          ) : currentTab === "wallet" ? (
            <motion.div
              key="wallet-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {isWalletLockEnabled && walletPassword ? (
                !isWalletUnlocked ? (
                  <WalletPasswordLockScreen
                    onUnlockSuccess={() => setIsWalletUnlocked(true)}
                    onCancel={() => setCurrentTab("calendar")}
                    designTemplate={designTemplate}
                    activeClasses={activeClasses}
                  />
                ) : (
                  <WalletView
                    routines={routines}
                    monthlyTasks={monthlyTasks}
                    onToggleComplete={handleToggleComplete}
                    onEditRoutine={(routine) => {
                      setEditingRoutine(routine);
                      setIsAddModalOpen(true);
                    }}
                    onDeleteRoutine={handleDeleteRoutine}
                    onAddRoutineClick={(defaultCategory) => {
                      setEditingRoutine(null);
                      setIsAddModalOpen(true);
                      if (defaultCategory) {
                        setEditingRoutine({
                          id: "",
                          title: "",
                          description: "",
                          category: defaultCategory,
                          color: defaultCategory === "Gelir" ? "emerald" : "rose",
                          frequency: "monthly",
                          weekDays: [1],
                          monthDay: 1,
                          startDate: toLocalDateString(new Date()),
                          time: "12:00",
                          isReminderActive: true,
                          createdAt: new Date().toISOString(),
                        });
                      }
                    }}
                    activeTheme={activeTheme}
                    activeClasses={activeClasses}
                    designTemplate={designTemplate}
                  />
                )
              ) : (
                <WalletView
                  routines={routines}
                  monthlyTasks={monthlyTasks}
                  onToggleComplete={handleToggleComplete}
                  onEditRoutine={(routine) => {
                    setEditingRoutine(routine);
                    setIsAddModalOpen(true);
                  }}
                  onDeleteRoutine={handleDeleteRoutine}
                  onAddRoutineClick={(defaultCategory) => {
                    setEditingRoutine(null);
                    setIsAddModalOpen(true);
                    if (defaultCategory) {
                      setEditingRoutine({
                        id: "",
                        title: "",
                        description: "",
                        category: defaultCategory,
                        color: defaultCategory === "Gelir" ? "emerald" : "rose",
                        frequency: "monthly",
                        weekDays: [1],
                        monthDay: 1,
                        startDate: toLocalDateString(new Date()),
                        time: "12:00",
                        isReminderActive: true,
                        createdAt: new Date().toISOString(),
                      });
                    }
                  }}
                  activeTheme={activeTheme}
                  activeClasses={activeClasses}
                  designTemplate={designTemplate}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="settings-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Header card inside settings */}
              <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className={`p-2 sm:p-2.5 ${activeClasses.accentBg} rounded-xl`}>
                    <Settings className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-base font-semibold sm:font-medium text-zinc-900 dark:text-zinc-100">
                      Uygulama Ayarları & Veri Yönetimi
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-light leading-snug sm:leading-relaxed mt-0.5">
                      Görünüm tercihlerini özelleştirin, verilerinizi yedekleyin, tamamlanma günlüğünü inceleyin veya sistem uyumluluğunu kontrol edin.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bento Grid layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel 0: Kategori Yönetimi */}
                <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-2xs space-y-3 sm:space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🏷️ <span>Kategorileri Yönet</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                    Rutinleriniz için kullandığınız kategorileri ekleyin, düzenleyin veya silin. Değişiklikler anında tüm rutinlerinize yansıtılır.
                  </p>
                  <div className="pt-0.5 sm:pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 ${activeClasses.accentBg} text-[11px] sm:text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-sm`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Kategorileri Düzenle ({categories.length})</span>
                    </button>
                  </div>
                </div>

                {/* Panel 1: Görünüm & Tema */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      🎨 <span>Tema ve Renk Paleti</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setDarkMode(!darkMode)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F5F5] dark:bg-zinc-800 hover:bg-[#EAEAEA] dark:hover:bg-zinc-750 transition cursor-pointer flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"
                    >
                      {darkMode ? (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Aydınlık Mod</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Karanlık Mod</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-light">
                    Uygulamanızın tamamında kullanılacak vurgu rengini seçin. Seçilen renk anında kaydedilir.
                  </p>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                    {THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setActiveTheme(opt.id);
                          try {
                            localStorage.setItem("app_theme", opt.id);
                          } catch (e) {
                            console.error("Local storage error saving theme:", e);
                          }
                        }}
                        className={`py-3.5 rounded-xl cursor-pointer transition flex flex-col items-center justify-center gap-1.5 border relative group ${opt.dotBg} ${
                          activeTheme === opt.id
                            ? "border-zinc-900 dark:border-white scale-102 ring-2 ring-zinc-200 dark:ring-zinc-800"
                            : "border-[#E5E5E5] dark:border-zinc-800/80"
                        }`}
                      >
                        {activeTheme === opt.id ? (
                          <Check className={`w-4 h-4 stroke-[3] ${opt.id === "lime" || opt.id === "yellow" ? "text-zinc-900" : "text-white"}`} />
                        ) : (
                          <div className="w-1.5 h-1.5 bg-black/15 dark:bg-white/20 rounded-full" />
                        )}
                        <span className={`text-[9px] font-bold tracking-wider uppercase ${opt.id === "lime" || opt.id === "yellow" ? "text-zinc-900" : "text-white"}`}>
                          {opt.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Takvim Görünüm Periyodu */}
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                    <h4 className="text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      📅 <span>Takvim Görünüm Periyodu</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                      Eski 6 haftalık şablon görünümüne geçmek veya 5 haftalık sade görünümü korumak için aşağıdaki periyotlardan birini seçebilirsiniz:
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarWeeks(35);
                          try {
                            localStorage.setItem("calendar_weeks", "35");
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          calendarWeeks === 35
                            ? `${activeClasses.accentBg} border-transparent shadow-xs`
                            : "bg-white dark:bg-zinc-900 border-[#E5E5E5] dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span>5 Hafta (Sade & Temiz)</span>
                        {calendarWeeks === 35 && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCalendarWeeks(42);
                          try {
                            localStorage.setItem("calendar_weeks", "42");
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          calendarWeeks === 42
                            ? `${activeClasses.accentBg} border-transparent shadow-xs`
                            : "bg-white dark:bg-zinc-900 border-[#E5E5E5] dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span>6 Hafta (Tüm Günler)</span>
                        {calendarWeeks === 42 && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </button>
                    </div>
                  </div>

                  {/* Görsel Tasarım Şablonu (Düzen) Seçimi */}
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                    <h4 className="text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      📐 <span>Görsel Tasarım Şablonu (Yerleşim Teması)</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                      Uygulamanın genel yerleşim, kenarlık ve gölge tarzını değiştiren can alıcı tasarım şablonlarından birine geçiş yapın:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "modern", name: "Modern Bento (Varsayılan)", emoji: "🍱", desc: "Varsayılan bento kutuları" },
                        { id: "brutalist", name: "Neo-Brutalist (Retro)", emoji: "⚡", desc: "Kalın kontur & 2D gölge" },
                        { id: "minimal", name: "Sade Minimal (Yalın)", emoji: "🍃", desc: "Gölgesiz temiz akış" },
                        { id: "terminal", name: "Retro Terminal", emoji: "📟", desc: "Kod tipi monoblok" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDesignTemplate(item.id)}
                          className={`p-2.5 text-left cursor-pointer transition relative flex flex-col justify-between ${
                            item.id === "brutalist" ? "rounded-none" :
                            item.id === "minimal" ? "rounded-2xl" :
                            item.id === "terminal" ? "rounded-none" : "rounded-xl"
                          } ${
                            designTemplate === item.id
                              ? `${activeClasses.accentBg} border-transparent shadow-xs`
                              : "bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 text-zinc-800 dark:text-zinc-200">
                            <span className="text-xs">{item.emoji}</span>
                            <span className={`text-[11px] font-bold leading-none ${designTemplate === item.id ? "text-zinc-950 dark:text-zinc-900" : ""}`}>{item.name}</span>
                          </div>
                          <span className={`text-[9px] font-light leading-snug ${designTemplate === item.id ? "text-zinc-900/80 dark:text-zinc-100/80" : "text-slate-400 dark:text-zinc-550"}`}>
                            {item.desc}
                          </span>
                          {designTemplate === item.id && (
                            <span className="absolute top-1.5 right-1.5 text-[8px] px-1 py-0.5 rounded leading-none bg-black/15 text-zinc-900 font-bold">Aktif</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Panel 2: Veri Yedekleme ve Kurtarma */}
                <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-2xs space-y-3 sm:space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    💾 <span>Veri Yedekleme ve Kurtarma</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                    Tüm kategorilerinizi, planlanan rutin şablonlarınızı ve şimdiye kadarki tamamlama logs kayıtlarınızı tek tıklamayla JSON olarak yedekleyin veya eski bir yedeği sisteme yükleyin.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1">
                    {/* Invisible file input for restore trigger */}
                    <input
                      type="file"
                      id="settings-import-file-input"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={() => document.getElementById("settings-import-file-input")?.click()}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#F5F5F5] hover:bg-[#EAEAEA] dark:bg-zinc-805 dark:hover:bg-zinc-750 text-[#1A1A1A] dark:text-zinc-205 text-[11px] sm:text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 border border-[#E5E5E5]/60 dark:border-zinc-700"
                    >
                      <span>📥</span>
                      <span>Yedeği İçe Aktar</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 ${activeClasses.accentBg} text-[11px] sm:text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1.5 shadow-sm`}
                    >
                      <span>📤</span>
                      <span>Verileri Yedekle (.JSON)</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {backupStatus && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -5 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -5 }}
                        className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
                          backupStatus.type === "success"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-950/30"
                            : "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-slate-200 dark:border-rose-950/30"
                        }`}
                      >
                        <span>{backupStatus.message}</span>
                        <button
                          type="button"
                          onClick={() => setBackupStatus(null)}
                          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Panel 3: Yerel Bellek & Cihaz Uyumluluğu */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-2xs space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    🛡️ <span>Güvence & Android Sürüm Uyumluluğu</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-[#FAFBFB] dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                      <span className="block text-[11px] font-bold text-zinc-900 dark:text-zinc-200 mb-0.5">
                        ⚡ Yerel Bellek ve Performans Koruması
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal">
                        Bellek tıkanmasını önleme amacıyla 1 yılı aşmış eski tamamlama logları ve eski takvim kayıtları otomatik olarak yıpranma filtresiyle silinir ve performans her zaman maksimumda tutulur.
                      </p>
                    </div>

                    <div className="p-3 bg-[#FAFBFB] dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                      <span className="block text-[11px] font-bold text-zinc-900 dark:text-zinc-200 mb-0.5">
                        🤖 Hangi Android Sürümleri ile Uyumlu?
                      </span>
                      <p className="text-[10px] text-slate-550 dark:text-zinc-400 leading-normal">
                        Uygulama, modern tarayıcı standartları sayesinde <strong>Android 5.0 (Lollipop) ve üzeri tüm Android işletim sistemleri</strong> (Android 10, 11, 12, 13, 14 ve 15 dahil) ile %100 tam uyumlu çalışabilir. Cihazınızda Google Chrome, Samsung Internet veya mobil yerel WebView bulunması yeterlidir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Panel 4: Bildirim Alarmları Günlüğü & Test Sesi */}
                <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-2xs space-y-3 sm:space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🔔 <span>Sistem Bildirimleri ve Uyarı Yapısı</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                    Zamanlanan rutin saatleriniz geldiğinde tarayıcınızın arka planda size bildirim ve alarm çalabilmesi için gereken yetkileri kontrol edin.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 sm:p-2.5 bg-[#FAFBFB] dark:bg-zinc-950/40 rounded-lg sm:rounded-xl border border-slate-100 dark:border-zinc-850">
                      <div className="text-[11px] font-semibold text-zinc-804 dark:text-zinc-300">
                        Tarayıcı Bildirim İzin Durumu
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestPermission}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          hasNotificationPermission
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : "bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-450"
                        }`}
                      >
                        {hasNotificationPermission ? "✓ İzin Verildi" : "⚠️ İzin İste"}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 sm:p-2.5 bg-[#FAFBFB] dark:bg-zinc-950/40 rounded-lg sm:rounded-xl border border-slate-100 dark:border-zinc-850">
                      <div className="text-[11px] font-semibold text-zinc-804 dark:text-zinc-300">
                        Alarm Sesi Test Oynatım
                      </div>
                      <button
                        type="button"
                        onClick={playNotificationSound}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#1A1A1A] hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-[#1A1A1A] transition cursor-pointer flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Sesi Dinle</span>
                      </button>
                    </div>
                  </div>
                </div>
                  {/* Panel 5: Cüzdan Güvenliği (Şifre Kilidi) */}
                <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-2xs space-y-3 sm:space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🔒 <span>Cüzdan Güvenlik Kilidi</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                    Gelir, gider ve finansal özetinizi içeren Cüzdan sekmesine erişimi size özel bir giriş şifresiyle kısıtlayarak verilerinizi güvene alın.
                  </p>

                  <div className="space-y-3">
                    {/* Active password validation block */}
                    {walletPassword && (
                      <div className="p-3 bg-amber-50/15 dark:bg-amber-950/10 rounded-xl border border-amber-500/20 dark:border-amber-500/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                            🔑 Güvenlik Doğrulaması <span className="text-amber-600 dark:text-amber-400 font-semibold">(Mevcut Şifre)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowResetConfirmation(!showResetConfirmation)}
                            className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
                          >
                            Şifremi Unuttum? ⚠️
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-500 dark:text-zinc-400 leading-snug font-light">
                          Kilit durumunu değiştirmek ya da yeni bir şifre belirlemek için önce mevcut şifrenizi girmeniz zorunludur.
                        </p>
                        <input
                          type="password"
                          placeholder="Mevcut erişim şifrenizi yazınız..."
                          value={currentWalletPasswordInput}
                          onChange={(e) => {
                            setWalletPasswordStatus(null);
                            setCurrentWalletPasswordInput(e.target.value);
                          }}
                          className="w-full py-1.5 px-2.5 text-xs border border-[#E5E5E5] dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {/* Password reset warning block */}
                    <AnimatePresence>
                      {showResetConfirmation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-2 text-left"
                        >
                          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-450">
                            <span className="text-xs">⚠️</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Kritik Güvenlik Resetleme Protokolü</span>
                          </div>
                          <p className="text-[10px] text-rose-600 dark:text-rose-450 font-light leading-relaxed">
                            Erişim şifrenizi hatırlamıyorsanız sıfırlayabilirsiniz. Ancak finansal gizliliği korumak amacıyla; <strong>cüzdandaki tüm planlanan gelir ve gider rutin kayıtlarınızın tutarları güvenlik gereği 0 TL olarak güncellenecektir!</strong> Bu işlem geri alınamaz.
                          </p>
                          <div className="flex items-center justify-end gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setShowResetConfirmation(false)}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-semibold rounded-lg cursor-pointer transition"
                            >
                              İptal
                            </button>
                            <button
                              type="button"
                              onClick={handleResetWalletSecurityAndAmounts}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition shadow-xs"
                            >
                              Şifreyi Sıfırla & Tutarları 0 TL Yap
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between p-2 sm:p-2.5 bg-[#FAFBFB] dark:bg-zinc-950/40 rounded-lg sm:rounded-xl border border-slate-100 dark:border-zinc-850">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-300">
                          Şifreli Kilit Durumu
                        </div>
                        <div className="text-[9px] text-slate-550 dark:text-zinc-500 font-light">
                          {isWalletLockEnabled && walletPassword ? "Aktif: Cüzdana girerken şifre istenir." : "Pasif: Cüzdana şifresiz girilebilir."}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWalletPasswordStatus(null);
                          if (!walletPassword) {
                            setWalletPasswordStatus({
                              type: "error",
                              message: "Cüzdan kilidini açmadan önce aşağıdaki alandan bir şifre tanımlamalısınız."
                            });
                            return;
                          }
                          
                          // VERIFICATION REQUIRED
                          if (currentWalletPasswordInput !== walletPassword) {
                            setWalletPasswordStatus({
                              type: "error",
                              message: "Kilit durumunu değiştirmek için lütfen yukarıdaki doğrulama alanına 'Mevcut Şifre'nizi girin."
                            });
                            return;
                          }

                          setIsWalletLockEnabled(!isWalletLockEnabled);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          isWalletLockEnabled && walletPassword
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-450"
                            : "bg-[#F5F5F5] hover:bg-[#EAEAEA] lg:dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-805 dark:text-zinc-200"
                        }`}
                      >
                        {isWalletLockEnabled && walletPassword ? "✓ Kilidi Kaldır" : "🛡️ Kilidi Aktif Et"}
                      </button>
                    </div>

                    <div className="p-3 bg-[#FAFBFB] dark:bg-zinc-950/40 rounded-xl border border-slate-100 dark:border-zinc-1000 space-y-2.5">
                      <span className="block text-[11px] font-bold text-zinc-900 dark:text-zinc-200">
                        {walletPassword ? "🔑 Şifre Değiştir" : "🔑 Yeni Şifre Tanımla"}
                      </span>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold block">Şifre</label>
                          <input
                            type="password"
                            placeholder="...."
                            value={newWalletPasswordInput}
                            onChange={(e) => {
                              setWalletPasswordStatus(null);
                              setNewWalletPasswordInput(e.target.value);
                            }}
                            className="w-full py-1.5 px-2.5 text-xs border border-[#E5E5E5] dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold block">Tekrar</label>
                          <input
                            type="password"
                            placeholder="...."
                            value={newWalletPasswordConfirmInput}
                            onChange={(e) => {
                              setWalletPasswordStatus(null);
                              setNewWalletPasswordConfirmInput(e.target.value);
                            }}
                            className="w-full py-1.5 px-2.5 text-xs border border-[#E5E5E5] dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {walletPassword ? (
                          <span className="text-[9px] font-bold text-emerald-650 dark:text-emerald-400 flex items-center gap-1">
                            ✓ Şifre Kayıtlı
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold italic">
                            Henüz şifre belirlenmedi
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setWalletPasswordStatus(null);

                            // VERIFICATION REQUIRED (If there's an existing password)
                            if (walletPassword && currentWalletPasswordInput !== walletPassword) {
                              setWalletPasswordStatus({
                                type: "error",
                                message: "Şifreyi değiştirmek için lütfen yukarıdaki doğrulama alanına 'Mevcut Şifre'nizi doğru girin."
                              });
                              return;
                            }

                            if (!newWalletPasswordInput) {
                              setWalletPasswordStatus({
                                type: "error",
                                message: "Şifre alanı boş bırakılamaz."
                              });
                              return;
                            }
                            if (newWalletPasswordInput !== newWalletPasswordConfirmInput) {
                              setWalletPasswordStatus({
                                type: "error",
                                message: "Girdiğiniz yeni şifreler birbiriyle uyuşmuyor."
                              });
                              return;
                            }

                            // Save
                            setWalletPassword(newWalletPasswordInput);
                            setIsWalletLockEnabled(true);
                            setNewWalletPasswordInput("");
                            setNewWalletPasswordConfirmInput("");
                            setCurrentWalletPasswordInput("");
                            setWalletPasswordStatus({
                              type: "success",
                              message: "Şifreniz başarıyla kaydedildi ve Cüzdan kilidi aktif hale getirildi!"
                            });
                          }}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition ${activeClasses.accentBg} text-white hover:opacity-90`}
                        >
                          Şifreyi Kaydet
                        </button>
                      </div>

                      <AnimatePresence>
                        {walletPasswordStatus && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`text-[10px] p-2 rounded-lg font-medium mt-2 ${
                              walletPasswordStatus.type === "success"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-950/20 text-rose-705 dark:text-rose-450"
                            }`}
                          >
                            {walletPasswordStatus.message}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 5 (Full Width): Bu Ayın Tarihsel Göreve Genel Bakışı */}
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-[#E5E5E5] dark:border-zinc-800 shadow-2xs space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    🗓️ <span>Bu Ayın Tarihsel Göreve Genel Bakışı</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-light leading-relaxed">
                    Rutinlerinizin bu aya ait tüm tekrarlanan görev örnekleri aşağıda listelenmektedir. Tamamlananlar <span className="italic line-through opacity-60 text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1 rounded">üstü çizili</span> gösterilir. Tamamlama durumunu sollarındaki daireye tıklayarak değiştirebilirsiniz.
                  </p>
                </div>

                {Object.keys(groupedTasks).length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#E5E5E5] dark:border-zinc-800 rounded-2xl bg-[#FBFBFB] dark:bg-zinc-900/40">
                    <p className="text-xs sm:text-sm text-[#777777] dark:text-zinc-400 font-medium">Bu aya ait planlanmış görev bulunmuyor.</p>
                    <p className="text-[10px] sm:text-xs text-[#999999] dark:text-zinc-500 mt-0.5">Rutin sekmesini kullanarak yeni rutinler ve hatırlatıcılar oluşturun!</p>
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto pr-1 space-y-4 divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {Object.keys(groupedTasks).sort().map((dateStr, idx) => {
                      const tasksForDay = groupedTasks[dateStr];
                      return (
                        <div key={dateStr} className={`space-y-2.5 ${idx > 0 ? "pt-4" : ""}`}>
                          <div className="text-[10px] font-bold text-zinc-650 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded w-fit">
                            🗓️ {formatToTurkishDate(dateStr)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pl-1">
                            {tasksForDay.map((item) => {
                              const { id: taskKey, routine, isCompleted } = item;
                              return (
                                <div
                                  key={taskKey}
                                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                                    isCompleted
                                      ? "bg-[#F9F9F9]/50 dark:bg-zinc-950/10 border-slate-200/40 dark:border-zinc-850/40 opacity-60 text-slate-450 italic"
                                      : "bg-white dark:bg-zinc-900 border-[#E5E5E5] dark:border-zinc-800 hover:border-[#CCCCCC] dark:hover:border-zinc-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleComplete(routine.id, dateStr)}
                                      className={`w-5 h-5 rounded-full flex items-center justify-center border cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 ${
                                        isCompleted
                                          ? "bg-[#1A1A1A] dark:bg-white border-transparent text-white dark:text-[#1A1A1A]"
                                          : "bg-white dark:bg-zinc-905 border-[#CCCCCC] dark:border-zinc-700 text-[#CCCCCC] dark:text-zinc-500 hover:border-[#1A1A1A] dark:hover:border-white"
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <Check className="w-2.5 h-2.5 stroke-[3] text-white dark:text-[#1A1A1A]" />
                                      ) : (
                                        <Circle className="w-2.5 h-2.5 opacity-30" />
                                      )}
                                    </button>
                                    
                                    <div className="min-w-0 flex-1">
                                      <h5 className={`text-xs font-semibold truncate ${isCompleted ? "line-through text-slate-400 font-normal italic" : "text-zinc-900 dark:text-zinc-100"}`}>
                                        {routine.title}
                                      </h5>
                                      <div className="flex items-center text-[10px] text-slate-555 dark:text-zinc-400 font-medium gap-1.5 mt-0.5">
                                        <span>🕒 {routine.time}</span>
                                        <span>•</span>
                                        <span className="text-[9px] uppercase tracking-wider font-bold">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Routine Creator Overlay Modal Sheet */}
      <AddRoutineModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRoutine(null);
        }}
        onSave={handleSaveRoutine}
        editingRoutine={editingRoutine}
        categories={categories}
        routines={routines}
      />

      {/* 📁 Category Management Dialog */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <CategoryManagerModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            categories={categories}
            routines={routines}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
      </AnimatePresence>

      {/* 🗑️ Deletion Confirmation Custom Modal */}
      <AnimatePresence>
        {deleteRoutineId && (
          <div
            id="delete-confirmation-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              id="delete-confirmation-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-6 text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-[#FF3333] border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-medium text-[#1A1A1A]">Rutini Sil</h3>
                <p className="text-xs text-[#777777] leading-relaxed">
                  Bu rutini silmek istediğinize emin misiniz? Bu rutin altındaki geçmiş tüm tamamlanma raporları da kalıcı olarak kaldırılacaktır.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2 animate-feed-in">
                <button
                  type="button"
                  id="confirm-delete-cancel-btn"
                  onClick={() => setDeleteRoutineId(null)}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-[#E5E5E5] hover:bg-[#F9F9F9] rounded-xl cursor-pointer transition"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  id="confirm-delete-approve-btn"
                  onClick={handleConfirmDeleteRoutine}
                  className="flex-1 py-2 text-sm font-medium text-white bg-[#FF3333] hover:bg-[#EE2222] rounded-xl cursor-pointer shadow-sm transition"
                >
                  Evet, Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      <footer id="app-footer" className="bg-white dark:bg-[#121212] border-t border-[#E5E5E5] dark:border-zinc-800/80 py-3 sm:py-4 text-center text-[11px] sm:text-xs text-slate-400 dark:text-zinc-500 space-y-0.5 transition-colors duration-200">
        <p>© 2026 Rutin & Hatırlatıcı Takvimi • <strong>Ertan Naimoğlu</strong> • Tüm verileriniz tarayıcınızda (yerelde) güvenle barındırılır.</p>
        <p>Hafızada şişme yapmayan 1 yıllık sınır barındıran mimari.</p>
      </footer>
    </div>
  );
}
