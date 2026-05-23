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
  UserMinus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { BotUser, DashboardStats } from "./types";
import { loadUsersFromStorage, saveUsersToStorage, calculateStats } from "./mockData";

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

  // Clean login token validation at start
  useEffect(() => {
    const token = localStorage.getItem("bot_admin_token");
    if (token) {
      setIsLoggedIn(true);
    }
    // Load initial bot users
    setUsers(loadUsersFromStorage());
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUsers(loadUsersFromStorage());
  };

  const handleLogout = () => {
    localStorage.removeItem("bot_admin_token");
    setIsLoggedIn(false);
  };

  const handleRefreshData = () => {
    setUsers(loadUsersFromStorage());
  };

  const handleResetDates = () => {
    setStartDate("");
    setEndDate("");
  };

  // User state controllers
  const handleUpdateUsersList = (updatedUsers: BotUser[]) => {
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
  };

  const handleImportSuccess = (importedUsers: BotUser[]) => {
    // Merge new users by checking UID duplicates
    const existingUids = users.map(u => u.user_id);
    const uniqueImported = importedUsers.filter(u => !existingUids.includes(u.user_id));
    
    if (uniqueImported.length === 0) {
      alert("Все импортируемые пользователи уже есть в базе данных!");
      return;
    }

    const merged = [...uniqueImported, ...users];
    handleUpdateUsersList(merged);
  };

  const handleToggleStatus = (id: string) => {
    const updated = users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u);
    handleUpdateUsersList(updated);
  };

  const handleDeleteUser = (id: string) => {
    const filtered = users.filter(u => u.id !== id);
    handleUpdateUsersList(filtered);
    if (selectedUser?.id === id) {
      setSelectedUser(null);
    }
  };

  const handleUpdateUserInModal = (updatedUser: BotUser) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    handleUpdateUsersList(updated);
    setSelectedUser(updatedUser);
  };

  // Compute stats on fly
  const dashboardStats = calculateStats(users, startDate, endDate);

  // Friendly names helper for visual progression charts
  const getTagDescription = (tag: string) => {
    switch (tag) {
      case "money_and_succes": return "Медитация «Деньги и успех»";
      case "ideal_day": return "Медитация «Идеальный день»";
      case "little_step": return "Гайд «Реальная магия маленьких шагов»";
      case "energy": return "Гайд «Почему у вас нет энергии»";
      default: return tag;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#030014] text-white flex flex-col justify-between relative overflow-hidden">
        {/* Glow ambient lines */}
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
      {/* Glow glowing bg layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none -z-10" />

      {/* Top Header navbar */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo */}
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

          {/* Right Action buttons */}
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

      {/* Main Content Space */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Header and general animation framework */}
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
            Интегрированная база данных потенциальных клиентов, пришедших по вебхукам с мини-лендингов Tilda в ваш Python-бот
          </p>
        </motion.div>

        {/* Stats Cards Section */}
        <StatsGrid 
          stats={dashboardStats}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onRefresh={handleRefreshData}
          onResetDates={handleResetDates}
        />

        {/* Middle Section: Side-by-side Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Stack of three stats cards */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            
            {/* Total Users */}
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

            {/* Active Users */}
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

            {/* Unsubscribed Blocked Users */}
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

          {/* Right Column: Funnels Distribution Card */}
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
                Распределение лидов по вороночным тегам
              </h3>
              <p className="text-xs text-white/50 mb-6 font-normal">
                Доли подписчиков, верифицировавших и активировавших конкретные подарки Money Migel
              </p>
            </div>

            <div className="space-y-4 relative z-10 my-4 flex-1">
              {dashboardStats.tags.filter(t => t.tag !== "received_lead").length === 0 ? (
                <div className="text-center py-8 text-xs text-white/40 italic">Теги не найдены в отфильтрованой базе данных</div>
              ) : (
                dashboardStats.tags
                  .filter(t => t.tag !== "received_lead")
                  .map(t => {
                    const percentage = Math.round((t.count / (dashboardStats.total_users || 1)) * 105);
                    const safePercentage = Math.min(percentage, 100);
                    return (
                      <div key={t.tag} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-white/80">{getTagDescription(t.tag)}</span>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="text-white/40 font-mono">({t.count} чел.)</span>
                            <span className="text-sky-300 font-bold font-mono">{safePercentage}%</span>
                          </div>
                        </div>
                        
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-white/5 rounded-full h-2 ring-1 ring-white/10 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${safePercentage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className={`h-full rounded-full bg-gradient-to-r ${
                              t.tag === "money_and_succes" ? "from-emerald-400 to-teal-500" :
                              t.tag === "ideal_day" ? "from-indigo-400 to-purple-500" :
                              t.tag === "little_step" ? "from-amber-400 to-orange-500" :
                              t.tag === "energy" ? "from-pink-400 to-fuchsia-500" : "from-sky-400 to-blue-500"
                            }`}
                          ></motion.div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5 text-xs text-white/50 mt-4 leading-relaxed relative z-10 w-full shrink-0">
              💡 <b>Как это работает:</b> При заполнении форм на Tilda, данные лидов по вебхуку летят в СУБД бота SQLite. Когда клиент нажимает "Старт" в Telegram, бот автоматически навешивает соответствующие теги подписок, позволяя вам сегментировать рассылки.
            </div>
          </motion.div>

        </div>

        {/* CSV Import/Export Controls */}
        <ImportExport 
          users={users}
          onImportSuccess={handleImportSuccess}
        />

        {/* Primary list Table of users */}
        <UsersTable 
          users={users}
          onSelectUser={setSelectedUser}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={handleDeleteUser}
        />

      </main>

      {/* Footer copyright */}
      <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-6 text-center text-xs text-white/40 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>Панель администрирования бота Money Migel © 2026.</span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-white/30">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Ultraviolet Premium Design
          </span>
        </div>
      </footer>

      {/* Modals popup overlays */}
      {selectedUser && (
        <UserModal 
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateUser={handleUpdateUserInModal}
        />
      )}

      {showMailingModal && (
        <MailingModal 
          users={users}
          onClose={() => setShowMailingModal(false)}
        />
      )}

    </div>
  );
}
