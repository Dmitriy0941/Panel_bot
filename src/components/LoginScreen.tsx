/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Bot, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate backend call
    setTimeout(() => {
      if (
        (username.trim() === "admin" && password === "admin123") ||
        (username.trim().toLowerCase() === "katya" && password === "migel2026")
      ) {
        localStorage.setItem("bot_admin_token", "mock_jwt_token_" + Math.random().toString(36).substring(7));
        setLoading(false);
        onLoginSuccess();
      } else {
        setLoading(false);
        setError("Неверный логин или пароль. Попробуйте admin / admin123");
      }
    }, 600);
  };

  const handleQuickDemo = () => {
    setUsername("admin");
    setPassword("admin123");
    localStorage.setItem("bot_admin_token", "demo_token_12345");
    onLoginSuccess();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md bg-white/[0.03] ring-1 ring-white/15 rounded-3xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative"
    >
      
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl pointer-events-none"></div>

      {/* Header Decorator */}
      <div className="p-8 border-b border-white/10 relative z-10 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="absolute top-6 right-6 bg-white/5 p-2 rounded-xl ring-1 ring-white/10">
          <Bot className="w-5 h-5 text-sky-400" />
        </div>
        <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Вход в систему
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">Панель Управления</h2>
        <p className="text-xs text-white/50 mt-1.5 font-normal leading-relaxed">
          Авторизация в админ-панели телеграм-бота для верификации лидов Money Migel
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="p-8 space-y-5 relative z-10">
        {error && (
          <div className="bg-rose-500/10 text-rose-200 p-3.5 rounded-2xl text-xs border border-rose-500/20 flex items-start gap-2.5">
            <span className="text-rose-400 font-bold">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5" htmlFor="username">
            Логин администратора
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-sm font-medium text-white placeholder-white/20"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5" htmlFor="password">
            Пароль доступа
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="w-full pl-10 pr-12 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all text-sm font-medium text-white placeholder-white/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide shadow-lg active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
        >
          {loading ? "Администрирование..." : "Войти в систему"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="relative flex items-center justify-center my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <span className="relative bg-[#030014] px-3.5 text-[9px] text-white/30 font-bold tracking-widest uppercase">ИЛИ ИСПЫТАТЬ</span>
        </div>

        <button
          type="button"
          onClick={handleQuickDemo}
          className="w-full border border-white/10 hover:border-sky-500/40 hover:bg-white/5 bg-transparent text-white/80 font-semibold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          Войти как демонстратор (демо)
        </button>
      </form>

      <div className="bg-white/[0.01] p-4 border-t border-white/10 text-center text-[10px] text-white/45 font-mono">
        Тест логин: <b className="text-white/60">admin</b>, пароль: <b className="text-white/60">admin123</b>
      </div>
    </motion.div>
  );
}
