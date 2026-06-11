import React, { useState } from "react";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WalletPasswordLockScreenProps {
  onUnlockSuccess: () => void;
  onCancel: () => void;
  designTemplate: string;
  activeClasses: {
    accentBg: string;
    accentText: string;
    selection?: string;
  };
}

export default function WalletPasswordLockScreen({
  onUnlockSuccess,
  onCancel,
  designTemplate,
  activeClasses,
}: WalletPasswordLockScreenProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Retrieve hashed or stored password from localStorage to validate
  const handleUnlockAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem("wallet_password") || "";

    if (passwordInput === storedPassword) {
      setErrorMsg("");
      onUnlockSuccess();
    } else {
      setIsShaking(true);
      setErrorMsg("Şifre hatalı, lütfen tekrar deneyin.");
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  // Direct keypad helper for rapid layout
  const handleQuickKeypad = (num: string) => {
    setErrorMsg("");
    setPasswordInput((prev) => prev + num);
  };

  const handleClear = () => {
    setPasswordInput("");
    setErrorMsg("");
  };

  // Styled base classes based on design templates
  const isTerminal = designTemplate === "terminal";
  const isBrutalist = designTemplate === "brutalist";
  const isMinimal = designTemplate === "minimal";

  let cardClasses = "bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 p-6 rounded-2xl shadow-lg";
  let inputClasses = "w-full py-2.5 px-3.5 pr-10 text-xs sm:text-sm border border-[#E5E5E5] dark:border-zinc-800 rounded-xl bg-[#F9F9F9] dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-orange-500 transition-colors";
  let buttonClasses = `w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-white cursor-pointer hover:opacity-90 transition shadow-sm flex items-center justify-center gap-1.5`;

  if (isTerminal) {
    cardClasses = "bg-zinc-950 border border-green-500/60 p-6 rounded-none font-mono text-green-400";
    inputClasses = "w-full py-2 px-3 border border-dashed border-green-500 bg-black text-green-300 font-mono text-xs focus:outline-hidden";
    buttonClasses = "w-full py-2 px-4 border border-green-500 text-black bg-green-500 font-mono text-xs font-bold hover:bg-green-600 transition flex items-center justify-center gap-1.5";
  } else if (isBrutalist) {
    cardClasses = "bg-white dark:bg-zinc-900 border-4 border-black dark:border-white p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]";
    inputClasses = "w-full py-2.5 px-3 border-2 border-black bg-white dark:bg-zinc-900 text-black dark:text-white text-xs sm:text-sm font-bold focus:outline-hidden";
    buttonClasses = "w-full py-2.5 px-4 bg-orange-500 text-white border-2 border-black font-black text-xs hover:bg-orange-600 transition flex items-center justify-center gap-1.5";
  } else if (isMinimal) {
    cardClasses = "bg-white dark:bg-zinc-950 border-0 p-6 rounded-3xl shadow-xs";
    inputClasses = "w-full py-3 px-4 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm focus:outline-hidden text-center";
    buttonClasses = "w-full py-3 px-4 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition flex items-center justify-center gap-1.5";
  } else {
    // Dynamic Accent Background for default "modern" template
    buttonClasses = `w-full py-2.5 px-4 ${activeClasses.accentBg} text-xs font-semibold rounded-xl text-white cursor-pointer hover:opacity-95 transition shadow-sm flex items-center justify-center gap-1.5`;
  }

  return (
    <div className="max-w-md mx-auto my-4 sm:my-8">
      <motion.div
        animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={cardClasses}
      >
        <div className="flex items-center gap-2 mb-5">
          <button
            type="button"
            onClick={onCancel}
            className={`flex items-center gap-1 text-[11px] font-medium transition cursor-pointer hover:underline ${
              isTerminal ? "text-green-500 hover:text-green-300" : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Geri Dön</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className={`p-4 rounded-full ${
            isTerminal ? "bg-green-500/10 text-green-400 border border-green-500" :
            isBrutalist ? "bg-white border-2 border-black text-black" :
            isMinimal ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100" :
            "bg-orange-50 dark:bg-orange-950/20 text-orange-500"
          }`}>
            <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h2 className={`text-base sm:text-lg font-bold ${isTerminal ? "text-green-400" : "text-zinc-900 dark:text-zinc-100"}`}>
              Cüzdan Alanı Kilitli
            </h2>
            <p className={`text-[11px] sm:text-xs mt-1 font-light leading-relaxed max-w-xs ${
              isTerminal ? "text-green-500/80" : "text-slate-500 dark:text-zinc-400"
            }`}>
              Finansal veri güvenliğiniz için Ayarlar'da belirlediğiniz erişim şifresini girmeniz gerekmektedir.
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlockAttempt} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={passwordInput}
              onChange={(e) => {
                setErrorMsg("");
                setPasswordInput(e.target.value);
              }}
              placeholder={isTerminal ? ">>> sifre_giriniz" : "Erişim Şifresi"}
              className={inputClasses}
              autoFocus
            />
            {!isTerminal && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-[11px] text-center font-medium ${isTerminal ? "text-red-500 font-mono" : "text-rose-500"}`}
              >
                ⚠️ {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Quick Digit Pad to ease mobile clicking */}
          <div className="mt-4 pt-2">
            <p className={`text-[10px] uppercase tracking-wider font-semibold text-center mb-2.5 ${
              isTerminal ? "text-green-500/60" : "text-slate-400 dark:text-zinc-500"
            }`}>
              Hızlı PIN / Rakam Girişi (Gerekirse)
            </p>
            <div className={`grid grid-cols-3 gap-1.5 max-w-[210px] mx-auto`}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleQuickKeypad(num)}
                  className={`py-1.5 sm:py-2 text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                    isTerminal 
                      ? "border border-green-500/30 text-green-400 hover:bg-green-500/10 font-mono"
                      : isBrutalist 
                      ? "border border-black bg-white dark:bg-zinc-900 text-black dark:text-white font-bold"
                      : isMinimal
                      ? "bg-zinc-105 dark:bg-zinc-900 rounded-lg hover:bg-zinc-200 text-zinc-900 dark:text-zinc-100"
                      : "bg-[#F3F4F6] dark:bg-zinc-800 hover:bg-slate-205 text-zinc-805 dark:text-zinc-200 rounded-lg"
                  } ${num === "0" ? "col-span-2" : ""}`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className={`py-1.5 sm:py-2 text-[10px] font-bold sm:font-semibold transition flex items-center justify-center cursor-pointer ${
                  isTerminal 
                    ? "border border-red-550/30 text-red-400 hover:bg-red-500/10 font-mono"
                    : isBrutalist 
                    ? "border border-black bg-white dark:bg-zinc-900 text-red-500"
                    : "bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg"
                }`}
              >
                Sil
              </button>
            </div>
          </div>

          <button type="submit" className={buttonClasses}>
            <span>Kilidi Aç</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
