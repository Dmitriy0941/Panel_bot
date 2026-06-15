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
  Users,
  ShieldCheck,
  UserMinus,
  Wifi,
  WifiOff,
  Database,
  Settings,
  RefreshCw,
  AlertCircle,
  Trash2
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
  updateUserReal,
  cleanupBlockedUsersReal
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
    if (importedUsers.length === 0) {
      alert("Файл импорта пуст!");
      return;
    }

    if (useRealApi && isRealConnected) {
      try {
        setIsLoading(true);
        const res = await importUsersReal(importedUsers);
        alert(res.message || "Импорт успешно завершен!");
        await loadBotData(); 
      } catch (err: any) {
        alert("Ошибка импорта на живой сервер: " + err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      const updatedUsersList = [...users];
      let addedCount = 0;
      let updatedCount = 0;

      for (const imp of importedUsers) {
        const existingIdx = updatedUsersList.findIndex(u => u.user_id === imp.user_id);
        if (existingIdx !== -1) {
          const existing = updatedUsersList[existingIdx];
          const mergedTags = Array.from(new Set([...existing.tags, ...imp.tags]));
          updatedUsersList[existingIdx] = {
            ...existing,
            username: imp.username || existing.username,
            first_name: imp.first_name || existing.first_name,
            tags: mergedTags
          };
          updatedCount++;
        } else {
          updatedUsersList.unshift(imp);
          addedCount++;
        }
      }

      handleUpdateUsersList(updatedUsersList);
      alert(`Локальный импорт завершен! Добавлено новых: ${addedCount}, обновлено существующих: ${updatedCount}`);
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

  const handleCleanupBlocked = async () => {
    const blockedUsers = users.filter(u => !u.is_active);
    const blockedCount = blockedUsers.length;
    if (blockedCount === 0) {
      alert("В базе данных нет неактивных пользователей (которые заблокировали или удалили бота) для удаления.");
      return;
    }

    if (!confirm(`Вы действительно хотите навсегда удалить всех неактивных пользователей (${blockedCount} чел.) из базы бота SQLite?`)) {
      return;
    }

    setIsLoading(true);
    if (useRealApi && isRealConnected) {
      try {
        const res = await cleanupBlockedUsersReal();
        alert(res.message || `Успешно удалено неактивных пользователей: ${blockedCount}`);
        await loadBotData();
      } catch (err: any) {
        alert("Ошибка очистки на сервере: " + err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      const activeUsers = users.filter(u => u.is_active);
      setUsers(activeUsers);
      saveUsersToStorage(activeUsers);
      setIsLoading(false);
      alert(`Успешно удалено ${blockedCount} неактивных пользователей из локальной базы.`);
    }
  };

  const handleUpdateUserInModal = async (updatedUser: BotUser) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    setSelectedUser(updatedUser);

    if (useRealApi && isRealConnected) {
      try {
        await updateUserReal(updatedUser.user_id, updatedUser.tags, updatedUser.is_active, updatedUser.phone, updatedUser.email);
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

  const getFilteredUsers = () => {
    let filtered = [...users];
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(u => new Date(u.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(u => new Date(u.created_at) <= end);
    }
    return filtered;
  };

  const filteredUsersForStats = getFilteredUsers();

  const groupedTags = [
    {
      id: "money",
      label: "Медитация Деньги и успех",
      count: filteredUsersForStats.filter(u => u.tags.some(t => t === "chain_money_meditation" || t === "money_and_succes")).length,
      gradient: "from-[#FF7F11] to-amber-500"
    },
    {
      id: "energy",
      label: "Гайд Почему нет энергии",
      count: filteredUsersForStats.filter(u => u.tags.some(t => t === "chain_energy" || t === "energy")).length,
      gradient: "from-[#FF7F11] via-amber-500 to-yellow-500"
    },
    {
      id: "step",
      label: "Гайд Магия маленьких шагов",
      count: filteredUsersForStats.filter(u => u.tags.some(t => t === "chain_little_step" || t === "little_step")).length,
      gradient: "from-amber-400 to-[#FF7F11]"
    },
    {
      id: "ideal_day",
      label: "Медитация Идеальный день",
      count: filteredUsersForStats.filter(u => u.tags.some(t => t === "chain_ideal_day" || t === "ideal_day")).length,
      gradient: "from-orange-400 to-[#FF7F11]"
    }
  ].sort((a, b) => b.count - a.count);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white flex flex-col justify-between relative overflow-hidden editorial-grid">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#FF7F11]/5 blur-3xl pointer-events-none" />
        
        <div className="flex-1 flex items-center justify-center p-4">
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </div>
        <footer className="py-6 text-center text-xs text-white/40 border-t border-white/[0.06] bg-black/40 backdrop-blur">
          Панель управления • Money Migel © 2026. Все права защищены.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col justify-between relative overflow-x-hidden selection:bg-[#FF7F11] selection:text-white editorial-grid">
      {/* Background Lights and Geometrics */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#FCE6D5]/10 via-[#F3E8EE]/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full border border-white/[0.02] pointer-events-none -z-10" />
      <div className="absolute right-[-100px] bottom-[-100px] w-96 h-96 rounded-full bg-[#FF7F11]/5 blur-3xl pointer-events-none -z-10" />
      <div className="absolute left-[-100px] bottom-[20%] w-96 h-96 rounded-full bg-[#FF7F11]/5 blur-3xl pointer-events-none -z-10" />

      <header className="bg-black/25 backdrop-blur-md border-b border-white/[0.06] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-18 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-[#FF7F11]/10 border border-[#FF7F11]/20 p-2 sm:p-2.5 rounded-xl text-[#FF7F11] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 font-display uppercase">
                Money Migel 
                <span className="text-[8px] sm:text-[9px] font-bold text-[#FF7F11] bg-[#FF7F11]/10 px-1.5 py-0.5 rounded border border-[#FF7F11]/20 select-none font-mono">BOT.CORE</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] text-white/40 font-normal block mt-0.5">
                Админ-панель воронки лид-магнитов
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setShowMailingModal(true)}
              className="bg-[#FF7F11] hover:bg-[#E06A0B] text-white px-2.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-orange-500/10 active:scale-[0.96] cursor-pointer"
            >
              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Запустить рассылку</span>
              <span className="xs:hidden">Рассылка</span>
            </button>

            <button 
              onClick={handleLogout}
              className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all border border-white/[0.08] bg-white/[0.02] active:scale-[0.96] cursor-pointer flex items-center justify-center"
              title="Выйти из системы"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8">
        
        {/* Hero split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-4 sm:py-10">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left animate-stagger-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-1.5 shadow-inner backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#FF7F11] animate-pulse" />
              <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider font-mono">Система управления лид-магнитами</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white font-display uppercase leading-none select-none">
              Аналитика & <span className="text-[#FF7F11] font-bold">Контроль Воронок</span>
            </h2>
            
            <span className="text-[10px] text-white/40 block mt-1 sm:mt-2 font-mono uppercase tracking-[0.25em]">
              [ MONEY MIGEL • DATABASE CONTROL • 2026 ]
            </span>
            
            <p className="max-w-xl text-xs sm:text-sm text-white/50 font-normal leading-relaxed">
              Интегрированная база данных потенциальных клиентов, пришедших с мини-лендингов в Телеграм-бот. Управляйте рассылками, отслеживайте переходы и анализируйте конверсии в реальном времени.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-1 sm:pt-2">
              <a 
                href="#users-table-section"
                className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.96] flex items-center gap-1.5"
              >
                <span>Открыть базу лидов</span>
                <span className="text-white/40">↓</span>
              </a>
            </div>
          </div>

          {/* Right Frame Column (Mockup curvy render and overlay card) */}
          <div className="lg:col-span-5 relative group min-h-[220px] sm:min-h-[300px] w-full flex items-center justify-center animate-stagger-2">
            <div className="w-full h-56 sm:h-80 rounded-[32px] overflow-hidden border border-white/[0.08] relative backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              
              {/* Background generated 3D image */}
              <img 
                src="/modern_sunset_funnel_graphic.png" 
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 select-none" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080b]/70 via-[#07080b]/10 to-transparent" />
              
              {/* Overlay Card - U-Verge Glass style */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 u-glass rounded-2xl p-3.5 sm:p-4.5 space-y-2">
                <span className="text-[9px] font-bold text-[#FF7F11] uppercase tracking-widest block font-mono">
                  [ БАЗА ДАННЫХ — АКТИВНА ]
                </span>
                <p className="text-[10px] text-white/70 font-normal leading-normal">
                  Аналитический хаб подключен к SQLite базе данных. Все вебхуки активны и верифицируют лиды.
                </p>
                <div className="flex gap-4 pt-1 font-mono">
                  <div>
                    <span className="text-[8px] text-white/40 uppercase block">[ ВСЕГО ЛИДОВ ]</span>
                    <span className="text-xs font-bold text-white tabular-nums">{users.length}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-white/40 uppercase block">[ АКТИВНЫЕ ]</span>
                    <span className="text-xs font-bold text-[#FF7F11] tabular-nums">{dashboardStats.active_users}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rotating circle badge */}
            <div className="absolute -top-6 -right-6 hidden sm:flex w-20 h-20 rounded-full border border-white/[0.08] bg-black/50 backdrop-blur flex items-center justify-center text-center select-none shadow-lg animate-[spin_20s_linear_infinite]">
              <span className="absolute text-[6px] font-bold text-white/35 uppercase tracking-[0.12em] font-mono leading-none">
                CORE • STATS • DATA •
              </span>
              <span className="text-[#FF7F11] font-bold text-md">+</span>
            </div>
          </div>
          
        </div>

        {/* Server status alert and config panel */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="u-glass rounded-3xl p-4 sm:p-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#FF7F11]/5 blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center gap-3">
              <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                !useRealApi 
                  ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                  : isRealConnected === true
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                  : isRealConnected === false
                  ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 animate-pulse"
                  : "bg-white/10 text-white/50 ring-1 ring-white/10"
              }`}>
                {isLoading ? (
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                ) : !useRealApi ? (
                  <Database className="w-4.5 h-4.5" />
                ) : isRealConnected === true ? (
                  <Wifi className="w-4.5 h-4.5" />
                ) : (
                  <WifiOff className="w-4.5 h-4.5" />
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-bold text-white/45 uppercase tracking-widest font-mono">РЕЖИМ РАБОТЫ ПАНЕЛИ:</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    !useRealApi 
                      ? "bg-amber-500/15 border-amber-400/20 text-amber-300" 
                      : isRealConnected === true 
                      ? "bg-emerald-500/15 border-emerald-400/20 text-emerald-300"
                      : "bg-rose-500/15 border-rose-400/20 text-rose-300"
                  } font-mono`}>
                    {!useRealApi ? "ЛОКАЛЬНАЯ ДЕМО БАЗА" : isRealConnected ? "ЖИВАЯ SQLite VPS" : "СБОЙ СВЯЗИ VPS"}
                  </span>
                </div>
                
                <h3 className="text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 flex-wrap">
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:self-center shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setUseRealApi(!useRealApi)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-[0.96] flex items-center justify-center gap-1.5 ${
                  useRealApi 
                    ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/90" 
                    : "bg-[#FF7F11] text-white border-orange-500/20 hover:bg-[#E06A0B] shadow-md shadow-orange-500/10"
                }`}
              >
                {useRealApi ? "Перейти на Демо-режим" : "Включить Живую VPS"}
              </button>

              <div className="flex gap-2">
                {useRealApi && (
                  <button
                    onClick={loadBotData}
                    disabled={isLoading}
                    title="Обновить связь с сервером"
                    className="p-2 border border-white/10 hover:bg-white/10 bg-white/5 text-white/80 rounded-xl transition-all disabled:opacity-50 cursor-pointer active:scale-[0.96] flex items-center justify-center flex-1 sm:flex-none"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  </button>
                )}

                <button
                  onClick={() => setShowConfigPanel(!showConfigPanel)}
                  className={`p-2 border rounded-xl transition-all cursor-pointer duration-150 flex items-center justify-center gap-1.5 text-xs font-bold active:scale-[0.96] flex-1 sm:flex-none ${
                    showConfigPanel 
                      ? "bg-[#FF7F11]/20 border-[#FF7F11]/30 text-orange-300" 
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Настройки домена</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCleanupBlocked}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-[0.96] disabled:opacity-50 flex items-center justify-center gap-1.5"
                title="Удалить всех неактивных пользователей из базы"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистить неактивных</span>
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
                      <div>3. Домен сервера должен поддерживать <b className="text-emerald-405 font-semibold">HTTPS</b>. Если ваш server VPS доступен по обычному HTTP (например, <code className="font-mono text-[10px] bg-black/30 px-1">http://api.antonovdv.ru</code>), браузер может заблокировать запрос из соображений безопасности (Mixed Content), так как Netlify работает по HTTPS.</div>
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
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono">
                      Адрес вашего Python FastAPI сервера (VPS):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="https://api.antonovdv.ru"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="w-full text-xs font-mono bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-[#FF7F11]/40 text-white placeholder-white/20"
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
                      className="flex-1 bg-[#FF7F11] hover:bg-[#E06A0B] text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-[0.96] disabled:opacity-50"
                    >
                      {isLoading ? "Подключение..." : "Применить"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResetToDefaultUrl}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-[0.96]"
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
          
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 lg:col-span-1">
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,127,17,0.2)" }}
              className="u-glass p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border-l-4 border-l-[#FF7F11] backdrop-blur transition-all duration-250 cursor-pointer min-h-[105px] group"
            >
              <div>
                <span className="text-[9px] font-bold text-white/45 uppercase tracking-widest block font-mono">Всего в базе</span>
                <span className="text-3xl font-extrabold text-white mt-1.5 block font-display tabular-nums">{dashboardStats.total_users}</span>
                <span className="text-[10px] text-white/40 mt-1 block font-normal">Записей в SQLite БД</span>
              </div>
              <div className="bg-[#FF7F11]/10 p-2.5 rounded-xl border border-[#FF7F11]/20 text-[#FF7F11] relative z-10">
                <Users className="w-5 h-5" />
              </div>
              
              {/* Background 3D Database Graphic representation */}
              <div className="absolute right-[-14px] bottom-[-14px] w-20 h-20 opacity-15 group-hover:opacity-30 group-hover:scale-105 transition-all duration-300 pointer-events-none">
                <img src="/sunset_database_graphic.png" className="w-full h-full object-contain select-none" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(52,211,153,0.2)" }}
              className="u-glass p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border-l-4 border-l-emerald-500 backdrop-blur transition-all duration-250 cursor-pointer min-h-[105px]"
            >
              <div>
                <span className="text-[9px] font-bold text-white/45 uppercase tracking-widest block font-mono">Активные</span>
                <span className="text-3xl font-extrabold text-emerald-400 mt-1.5 block font-display tabular-nums">{dashboardStats.active_users}</span>
                <span className="text-[10px] text-emerald-400/70 mt-1 block font-medium">Получают рассылки</span>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(244,63,94,0.2)" }}
              className="u-glass p-5 rounded-2xl relative overflow-hidden flex items-center justify-between border-l-4 border-l-rose-500 backdrop-blur transition-all duration-250 cursor-pointer min-h-[105px]"
            >
              <div>
                <span className="text-[9px] font-bold text-white/45 uppercase tracking-widest block font-mono">Отписки / Блоки</span>
                <span className="text-3xl font-extrabold text-rose-400 mt-1.5 block font-display tabular-nums">{dashboardStats.unsubscribed}</span>
                <span className="text-[10px] text-rose-400/70 mt-1 block font-medium">Залочили бота</span>
              </div>
              <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 text-rose-400">
                <UserMinus className="w-5 h-5" />
              </div>
            </motion.div>

          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden rounded-2xl bg-white/[0.015] hover:bg-white/[0.025] border border-white/[0.06] p-5 sm:p-6 backdrop-blur flex flex-col justify-between transition-all duration-300 lg:col-span-2 h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF7F11]/5 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-[#FF7F11]/5 blur-3xl text-orange-500"></div>

            <div className="relative z-10">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-1.5 font-display">
                <Award className="w-5 h-5 text-orange-300" />
                Распределение лидов по тегам воронок
              </h3>
              <p className="text-xs text-white/50 mb-6 font-normal">
                Доли подписчиков, верифицировавших и активировавших конкретные подарки Money Migel
              </p>
            </div>

            <div className="space-y-4 relative z-10 my-4 flex-1">
              {groupedTags.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/40 italic">Основные теги не найдены в базе данных</div>
              ) : (
                groupedTags.map(t => {
                  const percentage = Math.round((t.count / (dashboardStats.total_users || 1)) * 100);
                  const safePercentage = Math.min(percentage, 100);

                  return (
                    <div key={t.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-white/70 text-[11px]">{t.label}</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-white/35 font-mono text-[10px]">({t.count} чел.)</span>
                          <span className="text-orange-300 font-bold font-mono tabular-nums text-[11px]">{safePercentage}%</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-white/5 rounded-full h-1.5 border border-white/[0.05] overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${safePercentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className={`h-full rounded-full bg-gradient-to-r ${t.gradient}`}
                        ></motion.div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 text-xs text-white/45 mt-4 leading-relaxed relative z-10 w-full shrink-0">
              💡 <b>Как это работает:</b> При заполнении форм на лендингах, данные лидов летят в СУБД SQLite. Бот автоматически вешает теги подписок, позволяя вам сегментировать рассылки.
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

      <footer className="bg-[#07080b]/90 backdrop-blur-md border-t border-white/[0.06] py-6 text-center text-xs text-white/40 mt-12 shrink-0 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>Панель администрирования бота Money Migel © 2026.</span>
          <span className="flex items-center gap-1 font-mono text-[9px] text-white/30">
            <Sparkles className="w-3 h-3 text-[#FF7F11]" />
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