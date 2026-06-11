/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routine, RoutineLog } from "../types";

/**
 * Checks if a specific date (YYYY-MM-DD) falls within the 1-year future boundary from today.
 */
export function isWithinOneYear(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queryDate = new Date(dateStr);
  queryDate.setHours(0, 0, 0, 0);

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);
  oneYearFromNow.setHours(23, 59, 59, 999);

  return queryDate.getTime() >= today.getTime() - 86400000 * 30 && queryDate.getTime() <= oneYearFromNow.getTime(); 
  // Allow viewing 30 days of past history, up to 1 year of future dates.
}

/**
 * Returns list of routine tasks scheduled for a specific date string (YYYY-MM-DD).
 * It will not display occurrences beyond 1 year in the future.
 */
export function getOccurrencesForDate(routines: Routine[], dateStr: string): Routine[] {
  const queryDate = new Date(dateStr + "T00:00:00");
  const queryTime = queryDate.getTime();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxFuture = new Date();
  maxFuture.setFullYear(today.getFullYear() + 1);
  maxFuture.setHours(23, 59, 59, 999);

  // If the query date is beyond 1 year from today, return empty array to respect the constraint.
  if (queryTime > maxFuture.getTime()) {
    return [];
  }

  return routines.filter((routine) => {
    const start = new Date(routine.startDate + "T00:00:00");
    start.setHours(0, 0, 0, 0);

    if (queryTime < start.getTime()) {
      return false; // Routine hasn't started yet
    }

    if (routine.frequency === "daily") {
      return true;
    } else if (routine.frequency === "weekly") {
      const dayOfWeek = queryDate.getDay(); // 0: Sunday, 1: Monday, etc.
      return routine.weekDays.includes(dayOfWeek);
    } else if (routine.frequency === "monthly") {
      const dayOfMonth = queryDate.getDate();
      const expectedDay = routine.monthDay;

      // Handle months with fewer days than routine's selection (e.g. routine set for 31st, but month has 28 days)
      const lastDayOfMonth = new Date(
        queryDate.getFullYear(),
        queryDate.getMonth() + 1,
        0
      ).getDate();

      if (expectedDay > lastDayOfMonth) {
        return dayOfMonth === lastDayOfMonth;
      }
      return dayOfMonth === expectedDay;
    }

    return false;
  });
}

/**
 * Clean up old logs to keep LocalStorage lightweight and optimized.
 * Trims routine logs older than 180 days (6 months) as requested to maintain high performance.
 */
export function pruneOldLogs(logs: RoutineLog[]): RoutineLog[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 180); // Keep 6 months of historical compliance.
  const cutoffTime = cutoffDate.getTime();

  return logs.filter((log) => {
    const logDate = new Date(log.date + "T00:00:00");
    return logDate.getTime() >= cutoffTime;
  });
}

/**
 * Format date in Turkish style: 31 Mayıs 2026, Pazar
 */
export function formatToTurkishDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

/**
 * Format week days in Turkish abbreviations
 */
export const TURKISH_WEEKDAYS = [
  { value: 1, label: "Pazartesi", short: "Pzt" },
  { value: 2, label: "Salı", short: "Sal" },
  { value: 3, label: "Çarşamba", short: "Çar" },
  { value: 4, label: "Perşembe", short: "Per" },
  { value: 5, label: "Cuma", short: "Cum" },
  { value: 6, label: "Cumartesi", short: "Cmt" },
  { value: 0, label: "Pazar", short: "Paz" },
];

/**
 * Helper to get date string representation (YYYY-MM-DD) of a Date object local-time safe.
 */
export function toLocalDateString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

/**
 * Generate calendar grid days for a given year and month (including paddings of previous/next month).
 */
export function getCalendarGrid(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startPaddingDays = (firstDayOfMonth.getDay() + 6) % 7; // Convert Sunday=0 to fit European/Turkish style where Monday is first day of week
  const daysInMonth = lastDayOfMonth.getDate();

  const grid = [];

  // Pad from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = startPaddingDays - 1; i >= 0; i--) {
    const dayVal = prevMonthLastDay - i;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dayVal).padStart(2, "0")}`;
    grid.push({
      dateStr,
      day: dayVal,
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    grid.push({
      dateStr,
      day: i,
      isCurrentMonth: true,
    });
  }

  // Pad from next month
  const nextMonthPadding = 42 - grid.length; // standard 6-row grid has 42 cells
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let i = 1; i <= nextMonthPadding; i++) {
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    grid.push({
      dateStr,
      day: i,
      isCurrentMonth: false,
    });
  }

  return grid;
}

/**
 * Calculat streak statistics based on completion history.
 */
export function calculateStreak(logs: RoutineLog[]): number {
  const completedDates = new Set(
    logs.filter((l) => l.completed).map((l) => l.date)
  );

  let streakCount = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  // Check today
  const todayStr = toLocalDateString(checkDate);
  const completedToday = completedDates.has(todayStr);

  if (!completedToday) {
    // If not completed today, maybe completed yesterday is fine (streak keeps alive until today ends)
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const checkDateStr = toLocalDateString(checkDate);
    if (completedDates.has(checkDateStr)) {
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
    // Safety break
    if (streakCount > 366) break;
  }

  return streakCount;
}
