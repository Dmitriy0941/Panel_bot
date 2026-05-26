/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Bot, 
  LogOut, 
  Volume2, 
  Sparkles,
  Award,
  Compass,
  Users,
  ShieldCheck,
  UserMinus,
  Wifi,
  WifiOff,
  Database,
  Settings,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { BotUser, DashboardStats } from "./types";
import { loadUsersFromStorage, saveUsersToStorage, calculateStats } from "./mockData";
import { 
  getApiBaseUrl, 
  setApiBaseUrl, 
  testConnection, 
  fetchUsersReal, 
  toggleUserActiveReal, 
  deleteUserReal, 
  importUsersReal,
  updateUserReal
} from "./api";

import LoginScreen from "./components/LoginScreen";
import StatsGrid from "./components/StatsGrid";
import UsersTable from "./components/UsersTable";
import ImportExport from "./components/ImportExport";
import UserModal from "./components/UserModal";
import MailingModal from "./components/MailingModal";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState<BotUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<BotUser | null>(null);
  const [showMailingModal, setShowMailingModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [useRealApi, setUseRealApi] = useState<boolean>(() => {
    const stored = localStorage.getItem("use_real_api");
    return stored === null ? true : stored === "true";
  });
  const [isRealConnected, setIsRealConnected] = useState<boolean | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>(getApiBaseUrl());
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const loadBotData = async () => {
    setIsLoading(true);
    setApiError(null);
    
    if (!useRealApi) {
      setUsers(loadUsersFromStorage());
      setIsRealConnected(false);
      setIsLoading(false);
      return;
    }

    try {
      const activeUrl = getApiBaseUrl();
      const isOk = await testConnection(activeUrl);
      if (isOk) {
        const liveUsers = await fetchUsersReal();
        setUsers(liveUsers);
        setIsRealConnected(true);
      } else {
        throw new Error(`Не удалось связаться с сервером по адресу ${activeUrl}. Проверьте запущен ли admin_api.py и настроен ли SSL/CORS.`);
      }
    } catch (err: any) {
      console.error("API error details:", err);
      setIsRealConnected(false);
      setApiError(err.message || "Ошибка подключения. Невозможно загрузить участников.");
      setUsers(loadUsersFromStorage());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("use_real_api", String(useRealApi));
    loadBotData();
  }, [useRealApi]);

  useEffect(() => {
    const token = localStorage.getItem("bot_admin_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    loadBotData();
  };

  const handleLogout = () => {
    localStorage.removeItem("bot_admin_token");
    setIsLoggedIn(false);
  };

  const handleRefreshData = () => {
    loadBotData();
  };

  const handleResetDates = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleUpdateUsersList = (updatedUsers: BotUser[]) => {
    setUsers(updatedUsers);
    if (!useRealApi || !isRealConnected) {
      saveUsersToStorage(updatedUsers);
    }
  };

  const handleImportSuccess = async (importedUsers: BotUser[]) => {
    const existingUids = users.map(u => u.user_id);
    const uniqueImported = importedUsers.filter(u => !existingUids.includes(u.user_id));
    
    if (uniqueImported.length === 0) {
      alert("Все импортируемые пользователи уже есть в базе данных!");
      return;
    }

    const merged = [...uniqueImported, ...users];
    
    if (useRealApi && isRealConnected) {
      try {
        setIsLoading(true);
        await importUsersReal(uniqueImported);
        await loadBotData(); 
      } catch (err: any) {
        alert("Ошибка импорта на живой сервер: " + err.message);
        handleUpdateUsersList(merged);
      } finally {
        setIsLoading(false);
      }
    } else {
      handleUpdateUsersList(merged);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;
    const newActiveState = !targetUser.is_active;

    const updated = users.map(u => u.id === id ? { ...u, is_active: newActiveState } : u);
    setUsers(updated);

    if (useRealApi && isRealConnected) {
      try {
        await toggleUserActiveReal(targetUser.id, targetUser.user_id, newActiveState);
      } catch (err: any) {
        alert("Ошибка переключения статуса на VPS сервере: " + err.message);
        loadBotData();
      }
    } else {
      saveUsersToStorage(updated);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    if (!confirm(`Вы действительно хотите безвозвратно удалить пользователя ${targetUser.first_name || targetUser.user_id} из базы бота?`)) {
      return;
    }

    const filtered = users.filter(u => u.id !== id);
    setUsers(filtered);
    if (selectedUser?.id === id) {
      setSelectedUser(null);
    }

    if (useRealApi && isRealConnected) {
      try {
        await deleteUserReal(targetUser.id, targetUser.user_id);
      } catch (err: any) {
        alert("Ошибка удаления на VPS сервере: " + err.message);
        loadBotData(); 
      }
    } else {
      saveUsersToStorage(filtered);
    }
  };

  const handleUpdateUserInModal = async (updatedUser: BotUser) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    setSelectedUser(updatedUser);

    if (useRealApi && isRealConnected) {
      try {
        await updateUserReal(updatedUser.user_id, updatedUser.tags, updatedUser.is_active);
      } catch (err: any) {
        alert("Ошибка обновления пользователя на сервере VPS: " + err.message);
        loadBotData();
      }
    } else {
      saveUsersToStorage(updated);
    }
  };

  const handleSaveApiBaseUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiBaseUrl(apiUrl);
    await loadBotData();
  };

  const handleResetToDefaultUrl = async () => {
    localStorage.removeItem("custom_api_url");
    const val = getApiBaseUrl();
    setApiUrl(val);
    await loadBotData();
  };

  const dashboardStats = calculateStats(users, startDate, endDate);

  const getTagDescription = (tag: string) => {
    if (tag === "chain_money_meditation") return "Медитация Деньги и успех";
    if (tag === "chain_energy") return "Гайд Почему нет энергии";
    if (tag === "chain_little_step") return "Гайд Магия маленьких шагов";
    if (tag === "chain_ideal_day") return "Медитация Идеальный день";
    return tag;
  };

  // Наше строгое сито для нужных полосок
  const ALLOWED_TAGS = [
    "chain_money_meditation",
    "chain_energy",
    "chain_little_step",
    "chain_ideal_day"
  ];
  
  const filteredTagsForCharts = dashboardStats.tags.filter(t => ALLOWED_TAGS.includes(t.tag));

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#030014] text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex-1 flex items-center justify-center p-4">
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </div>
        <footer className="py-6 text-center text-xs text-white/40 border-t border-white/5 bg-black/40 backdrop-blur">
          Панель управления • Money Migel © 2026. Все права защищены.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none -z-10" />

      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-500 to-sky-500 p-2.5 rounded-xl text-white shadow-lg flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 font-display">
                Money Migel 
                <span className="text-[10px] font-bold text-sky-305 bg-sky-500/15 px-1.5 py-0.5 rounded border border-sky-400/20 select-none font-mono">BOT.CORE</span>
              </h1>
              <span className="text-[11px] text-white/50 font-normal block leading-none mt-0.5">
                Админ-панель воронки лид-магнитов
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMailingModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer border border-white/10"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Запустить рассылку</span>
            </button>

            <button 
              onClick={handleLogout}
              className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all border border-white/10 bg-white/5"
              title="Выйти из системы"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-sky-300 animate-pulse" />
            <span className="text-xs text-sky-200/90 font-medium tracking-wide">Система управления лид-магнитами</span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-white font-display">
            Аналитика & Контроль Воронок
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-white/60 font-normal">
            Интегрированная база данных потенциальных клиентов, пришедших с мини-лендингов в Телеграм-бот
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white/[0.03] ring-1 ring-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
                !useRealApi 
                  ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                  : isRealConnected === true
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                  : isRealConnected === false
                  ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 animate-pulse"
                  : "bg-white/10 text-white/50 ring-1 ring-white/10"
              }`}>
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : !useRealApi ? (
                  <Database className="w-5 h-5" />
                ) : isRealConnected === true ? (
                  <Wifi className="w-5 h-5" />
                ) : (
                  <WifiOff className="w-5 h-5" />
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">РЕЖИМ РАБОТЫ ПАНЕЛИ:</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    !useRealApi 
                      ? "bg-amber-500/15 border-amber-400/20 text-amber-300" 
                      : isRealConnected === true 
                      ? "bg-emerald-500/15 border-emerald-400/20 text-emerald-300"
                      : "bg-rose-500/15 border-rose-400/20 text-rose-300"
                  } font-mono`}>
                    {!useRealApi ? "ЛОКАЛЬНАЯ ДЕМО БАЗА" : isRealConnected ? "ЖИВАЯ SQLite VPS" : "СБОЙ СВЯЗИ VPS"}
                  </span>
                </div>
                
                <h3 className="text-white text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                  {!useRealApi ? (
                    <span>Используется локальное демо-хранилище (Mock режим)</span>
                  ) : isRealConnected === true ? (
                    <span className="flex items-center gap-1.5">
                      Связь установлена к <code className="text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 font-mono text-xs">{getApiBaseUrl()}</code>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-300">
                      Нет связи с VPS сервером по адресу <code className="text-rose-400 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10 font-mono text-xs">{getApiBaseUrl()}</code>
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setUseRealApi(!useRealApi)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  useRealApi 
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/90" 
                    : "bg-indigo-500 text-white border-indigo-400/30 hover:bg-indigo-600 shadow-md"
                }`}
              >
                {useRealApi ? "Перейти на Демо-режим" : "Включить Живую VPS"}
              </button>

              {useRealApi && (
                <button
                  onClick={loadBotData}
                  disabled={isLoading}
                  title="Обновить связь с сервером"
                  className="p-2 border border-white/10 hover:bg-white/10 bg-white/5 text-white/80 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              )}

              <button
                onClick={() => setShowConfigPanel(!showConfigPanel)}
                className={`p-2 border rounded-xl transition-all cursor-pointer duration-150 flex items-center justify-center gap-1.5 text-xs font-bold ${
                  showConfigPanel 
                    ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300" 
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Настройки домена</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {useRealApi && isRealConnected === false && apiError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 border-t border-rose-500/20 pt-4"
              >
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-200 flex gap-3 overflow-hidden">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-1.5 leading-relaxed">
                    <p className="font-bold text-rose-300">⚠️ Почему отображается пустая база или демо-режим:</p>
                    <p className="font-normal text-[11px] text-rose-100/80">
                      Ваш браузер заблокировал или не смог выполнить запросы к домену <code className="bg-black/30 px-1 py-0.5 rounded font-mono font-bold text-rose-300">{getApiBaseUrl()}</code>.
                      <br /><b>Причина ошибки:</b> <span className="font-semibold italic text-white">{apiError}</span>
                    </p>
                    <div className="pt-1.5 text-[11px] text-white/60 space-y-1 list-decimal pl-3 font-normal">
                      <div>1. Убедитесь, что ваш Python FastAPI-сервер запускается с файлом <b className="text-white">admin_api.py</b> и корректно активен на VPS.</div>
                      <div>2. В коде вашего FastAPI (<b className="text-sky-300 font-mono">admin_api.py</b>) обязательно должна быть включена поддержка CORS роутинга (CORSMiddleware) для вашего Netlify домена.</div>
                      <div>3. Домен сервера должен поддерживать <b className="text-emerald-405 font-semibold">HTTPS</b>. Если ваш сервер VPS доступен по обычному HTTP (например, <code className="font-mono text-[10px] bg-black/30 px-1">http://api.antonovdv.ru</code>), браузер может заблокировать запрос из соображений безопасности (Mixed Content), так как Netlify работает по HTTPS.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showConfigPanel && (
              <motion.form 
                onSubmit={handleSaveApiBaseUrl}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 border-t border-white/10 pt-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  
                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                      Адрес вашего Python FastAPI сервера (VPS):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="https://api.antonovdv.ru"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="w-full text-xs font-mono bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/40 text-white placeholder-white/20"
                      />
                    </div>
                    <span className="text-[10px] text-white/40 block">
                      Укажите домен (или IP-адрес с портом, например: <code className="font-mono bg-white/5 px-1 rounded text-orange-300">https://your-vps:8000</code>).
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isLoading ? "Подключение..." : "Применить"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResetToDefaultUrl}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                      title="Сбросить на значение по умолчанию"
                    >
                      Сброс
                    </button>
                  </div>

                </div>
              </motion.form>
            )}
          </AnimatePresence>

        </motion.div>

        <StatsGrid 
          stats={dashboardStats}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRefresh={handleRefreshData}
          onResetDates={handleResetDates}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="flex flex-col gap-4 lg:col-span-1">
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)" }}
              className="bg-white/[0.02] ring-1 ring-white/10 p-5 rounded-3xl relative overflow-hidden flex items-center justify-between border-l-4 border-l-sky-500 backdrop-blur transition-all duration-200 cursor-pointer h-full min-h-[105px]"
            >
              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">Всего в базе</span>
                <span className="text-3xl font-extrabold text-white mt-1.5 block font-display">{dashboardStats.total_users}</span>
                <span className="text-[10px] text-white/40 mt-1 block font-normal">Записей в SQLite БД</span>
              </div>
              <div className="bg-sky-500/10 p-2.5 rounded-2xl ring-1 ring-sky-500/20 text-sky-400">
                <Users className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)" }}
              className="bg-white/[0.02] ring-1 ring-white/10 p-5 rounded-3xl relative overflow-hidden flex items-center justify-between border-l-4 border-l-emerald-500 backdrop-blur transition-all duration-200 cursor-pointer h-full min-h-[105px]"
            >
              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">Активные</span>
                <span className="text-3xl font-extrabold text-emerald-400 mt-1.5 block font-display">{dashboardStats.active_users}</span>
                <span className="text-[10px] text-emerald-400/70 mt-1 block font-medium">Получают рассылки</span>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-2xl ring-1 ring-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)" }}
              className="bg-white/[0.02] ring-1 ring-white/10 p-5 rounded-3xl relative overflow-hidden flex items-center justify-between border-l-4 border-l-rose-500 backdrop-blur transition-all duration-200 cursor-pointer h-full min-h-[105px]"
            >
              <div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block font-mono">Отписки / Блоки</span>
                <span className="text-3xl font-extrabold text-rose-400 mt-1.5 block font-display">{dashboardStats.unsubscribed}</span>
                <span className="text-[10px] text-rose-400/70 mt-1 block font-medium">Залочили бота</span>
              </div>
              <div className="bg-rose-500/10 p-2.5 rounded-2xl ring-1 ring-rose-500/20 text-rose-400">
                <UserMinus className="w-5 h-5" />
              </div>
            </motion.div>

          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden rounded-3xl bg-white/[0.03] hover:bg-white/[0.04] ring-1 ring-white/10 p-6 backdrop-blur flex flex-col justify-between transition-colors duration-200 lg:col-span-2 h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl text-indigo-500"></div>

            <div className="relative z-10">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-1.5 font-display">
                <Award className="w-5 h-5 text-sky-300" />
                Распределение лидов по тегам воронок
              </h3>
              <p className="text-xs text-white/50 mb-6 font-normal">
                Доли подписчиков, верифицировавших и активировавших конкретные подарки Money Migel
              </p>
            </div>

            <div className="space-y-4 relative z-10 my-4 flex-1">
              {filteredTagsForCharts.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/40 italic">Основные теги не найдены в базе данных</div>
              ) : (
                filteredTagsForCharts.map(t => {
                  const percentage = Math.round((t.count / (dashboardStats.total_users || 1)) * 105);
                  const safePercentage = Math.min(percentage, 100);
                  
                  const barGradient = t.tag.includes("money") ? "from-emerald-400 to-teal-500" :
                                      t.tag.includes("ideal") ? "from-indigo-400 to-purple-500" :
                                      t.tag.includes("step") ? "from-amber-400 to-orange-500" :
                                      t.tag.includes("energy") ? "from-pink-400 to-fuchsia-500" : "from-sky-400 to-blue-500";

                  return (
                    <div key={t.tag} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-white/80">{getTagDescription(t.tag)}</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-white/40 font-mono">({t.count} чел.)</span>
                          <span className="text-sky-300 font-bold font-mono">{safePercentage}%</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-white/5 rounded-full h-2 ring-1 ring-white/10 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${safePercentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                        ></motion.div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5 text-xs text-white/50 mt-4 leading-relaxed relative z-10 w-full shrink-0">
              💡 <b>Как это работает:</b> При заполнении форм на лендингах, данные лидов по вебхуку летят в СУБД бота SQLite. Когда клиент нажимает кнопку запуска в Telegram, бот автоматически навешивает соответствующие теги подписок, позволяя вам сегментировать рассылки.
            </div>
          </motion.div>

        </div>

        <ImportExport 
          users={users}
          onImportSuccess={handleImportSuccess}
        />

        <UsersTable 
          users={users}
          onSelectUser={setSelectedUser}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={handleDeleteUser}
        />

      </main>

      <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-6 text-center text-xs text-white/40 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>Панель администрирования бота Money Migel © 2026.</span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-white/30">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Antonov Dmitriy Design
          </span>
        </div>
      </footer>

      {selectedUser && (
        <UserModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateUser={handleUpdateUserInModal}
          useRealApi={useRealApi}
          isRealConnected={isRealConnected === true}
        />
      )}

      {showMailingModal && (
        <MailingModal 
          users={users}
          onClose={() => setShowMailingModal(false)}
          useRealApi={useRealApi}
          isRealConnected={isRealConnected === true}
        />
      )}

    </div>
  );
}