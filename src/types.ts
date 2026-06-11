/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Routine {
  id: string;
  title: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  weekDays: number[]; // 0: Sunday, 1: Monday, 2: Tuesday, etc.
  monthDay: number; // 1 to 31
  startDate: string; // YYYY-MM-DD
  time: string; // HH:MM
  category: string; // e.g., "Sağlık", "İş", "Kişisel", "Eğitim"
  color: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";
  isReminderActive: boolean;
  createdAt: string;
}

export interface RoutineLog {
  id: string; // Unique combined key: e.g. "routineId_YYYY-MM-DD"
  routineId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string; // ISO string
}

export interface NotificationItem {
  id: string;
  routineId?: string;
  title: string;
  message: string;
  time: string; // ISO string or HH:MM
  date: string; // YYYY-MM-DD
  read: boolean;
  type: "reminder" | "system";
}

export interface Category {
  name: string;
  icon: string;
  color: string;
}

export interface SnoozedAlarm {
  id: string;
  routineId: string;
  snoozeUntilTime: string; // HH:MM
  date: string; // YYYY-MM-DD
  originalTime: string;
}
