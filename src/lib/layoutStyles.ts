/**
 * Mappings and helper functions for layout design templates:
 * - "modern": Modern Bento Grid
 * - "brutalist": Neo-Brutalist Sharp High Contrast
 * - "minimal": Soft Minimalist Frame
 * - "terminal": Retro Coding Terminal
 */

export interface TemplateStyle {
  card: string;
  button: string;
  iconBg: string;
  font: string;
  borderClass: string;
  badge: string;
  divider: string;
  input: string;
  tabActive: string;
  tabInactive: string;
  modal: string;
}

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  modern: {
    card: "bg-white dark:bg-zinc-900 rounded-xl border border-[#E5E5E5] dark:border-zinc-800 shadow-3xs hover:shadow-xs transition duration-200",
    button: "px-4 py-2 font-semibold text-xs rounded-xl shadow-xs transition duration-200",
    iconBg: "p-2 rounded-lg bg-[#F5F5F5] dark:bg-zinc-800 text-[#1A1A1A] dark:text-white",
    font: "font-sans",
    borderClass: "border-[#E5E5E5] dark:border-zinc-800",
    badge: "text-[9px] font-semibold px-2.5 py-1 rounded-md",
    divider: "border-b border-[#E5E5E5] dark:border-zinc-800",
    input: "rounded-lg border border-[#E5E5E5] dark:border-zinc-800",
    tabActive: "bg-white dark:bg-zinc-800 shadow-xs font-bold scale-[1.02]",
    tabInactive: "text-[#777777] dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white hover:bg-[#EAEAEA] dark:hover:bg-zinc-800/40",
    modal: "rounded-2xl shadow-xl border border-[#E5E5E5] dark:border-zinc-800 overflow-hidden"
  },
  brutalist: {
    card: "bg-white dark:bg-zinc-950 rounded-none border-2 border-black dark:border-zinc-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all duration-150",
    button: "px-4 py-2 font-black text-xs rounded-none border-2 border-black dark:border-zinc-200 bg-white hover:bg-black hover:text-white dark:bg-zinc-950 dark:hover:bg-zinc-100 dark:hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all",
    iconBg: "p-2 rounded-none border border-black dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white",
    font: "font-sans font-bold",
    borderClass: "border-2 border-black dark:border-zinc-200",
    badge: "text-[9px] font-black uppercase px-2 py-0.5 rounded-none border border-black dark:border-zinc-200",
    divider: "border-b-2 border-black dark:border-zinc-200",
    input: "rounded-none border-2 border-black dark:border-zinc-200 focus:ring-0 focus:outline-none bg-white dark:bg-zinc-950 text-black dark:text-white",
    tabActive: "bg-black text-white dark:bg-white dark:text-black font-black border-2 border-black dark:border-white scale-[1.03]",
    tabInactive: "text-zinc-700 dark:text-zinc-400 font-bold hover:text-black dark:hover:text-white border-2 border-transparent",
    modal: "rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] border-4 border-black dark:border-zinc-300 overflow-hidden"
  },
  minimal: {
    card: "bg-slate-50/50 dark:bg-zinc-900/30 rounded-3xl border border-transparent shadow-none hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition duration-300",
    button: "px-4 py-2 font-medium text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:scale-[1.01] hover:bg-zinc-200 shadow-none transition duration-300",
    iconBg: "p-2 rounded-full bg-zinc-100/50 dark:bg-zinc-800/40 text-zinc-800 dark:text-zinc-200",
    font: "font-sans font-light tracking-tight",
    borderClass: "border-zinc-100 dark:border-zinc-850",
    badge: "text-[8px] font-medium tracking-tight px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-850",
    divider: "border-b border-zinc-100 dark:border-zinc-850",
    input: "rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60",
    tabActive: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium rounded-full scale-[1.01] shadow-none",
    tabInactive: "text-zinc-500 dark:text-zinc-400 font-normal hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/30",
    modal: "rounded-3xl shadow-none border border-zinc-100 dark:border-zinc-850 overflow-hidden"
  },
  terminal: {
    card: "bg-[#09090b] text-zinc-300 rounded-none border border-dashed border-zinc-700 dark:border-zinc-500 shadow-none hover:border-zinc-500 font-mono transition duration-150",
    button: "px-4 py-2 font-mono text-xs rounded-none border border-dashed border-zinc-650 dark:border-zinc-500 hover:bg-zinc-800/40 hover:border-zinc-450 transition",
    iconBg: "p-2 rounded-none border border-dashed border-zinc-700 bg-zinc-950 text-zinc-300",
    font: "font-mono",
    borderClass: "border-zinc-700 dark:border-zinc-650",
    badge: "text-[8px] font-mono px-1.5 py-0.5 rounded-none border border-dashed border-zinc-750 dark:border-zinc-550 bg-black",
    divider: "border-b border-dashed border-zinc-700 dark:border-zinc-650",
    input: "rounded-none border border-dashed border-zinc-700 focus:border-zinc-400 bg-black text-green-400 font-mono focus:ring-0 focus:outline-none",
    tabActive: "bg-zinc-900 border border-zinc-450 text-green-400 font-mono font-bold scale-[1.02]",
    tabInactive: "text-zinc-500 font-mono hover:text-green-300 hover:bg-zinc-900/50 border border-transparent",
    modal: "rounded-none shadow-none border border-double border-zinc-400 dark:border-zinc-500 bg-[#09090b] text-green-400 font-mono overflow-hidden"
  }
};

export const getTemplateClass = (template: string, element: keyof TemplateStyle): string => {
  const t = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.modern;
  return t[element];
};
