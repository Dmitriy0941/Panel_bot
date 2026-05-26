/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Search, Eye, ToggleLeft, ToggleRight, Trash2, Filter, Sparkles } from "lucide-react";
import { BotUser } from "../types";

interface UsersTableProps {
  users: BotUser[];
  onSelectUser: (user: BotUser) => void;
  onToggleStatus: (id: string) => void;
  onDeleteUser: (id: string) => void;
}

export default function UsersTable({ users, onSelectUser, onToggleStatus, onDeleteUser }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 20;

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tagFilter, statusFilter]);

  // Собираем список тегов для выпадающего меню фильтра, исключая служебные
  const allTags = Array.from(
    new Set(users.flatMap(u => u.tags))
  ).filter(tag => !tag.startsWith("received_") && tag !== "received_lead");

  // Логика фильтрации таблицы
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.user_id.toString().includes(searchTerm) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTag = tagFilter === "" || user.tags.includes(tagFilter);

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "blocked" && !user.is_active);

    return matchesSearch && matchesTag && matchesStatus;
  });

  // Расчет пагинации
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length);
  const shownFrom = filteredUsers.length > 0 ? startIndex + 1 : 0;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Палитра красок
  const getTagColorClass = (tag: string) => {
    if (tag.includes("money")) return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
    if (tag.includes("ideal")) return "bg-purple-500/10 text-purple-300 border-purple-500/20";
    if (tag.includes("step")) return "bg-amber-500/10 text-amber-300 border-amber-500/20";
    if (tag.includes("energy")) return "bg-pink-500/10 text-pink-400 border-pink-500/20";
    return "bg-white/5 text-white/70 border-white/10";
  };

  // Электронный словарик
  const getTagLabel = (tag: string) => {
    switch (tag) {
      case "chain_money_meditation":
      case "money_and_succes": 
        return "Медитация «Деньги и успех»";
      case "chain_ideal_day":
      case "ideal_day": 
        return "Медитация «Идеальный день»";
      case "chain_little_step":
      case "little_step": 
        return "Гайд «Маленькие шаги»";
      case "chain_energy":
      case "energy": 
        return "Гайд «Энергия»";
      default: return tag;
    }
  };

  return (
    <div className="bg-white/[0.03] rounded-3xl ring-1 ring-white/10 backdrop-blur overflow-hidden" id="users-table-section">
      
      {/* Верхняя панель таблицы */}
      <div className="p-5 border-b border-white/10 bg-white/[0.01] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-display">
            <Sparkles className="w-4.5 h-4.5 text-sky-450" />
            База пользователей бота Money Migel
          </h3>
          <span className="text-[11px] text-white/50 font-semibold bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 font-mono">
            Отображено: <b>{filteredUsers.length}</b> из <b>{users.length}</b> лидов
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Поиск по имени, @username или ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500/40 transition-all font-medium text-white placeholder-white/20"
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 w-3.5 h-3.5 text-white/30" />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-[#0a061e] border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500/40 transition-all font-medium text-white/80 select-style-dark"
            >
              <option value="" className="bg-[#0f0b29]">Все воронки (теги)</option>
              {allTags.map(tag => (
                <option key={tag} value={tag} className="bg-[#0f0b29]">{getTagLabel(tag)}</option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 w-3.5 h-3.5 text-white/30" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-[#0a061e] border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500/40 transition-all font-medium text-white/80"
            >
              <option value="all" className="bg-[#0f0b29]">Все статусы лидов</option>
              <option value="active" className="bg-[#0f0b29]">Только активные подписчики</option>
              <option value="blocked" className="bg-[#0f0b29]">Только заблокировавшие</option>
            </select>
          </div>

        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs text-white/85">
          <thead className="bg-white/5 text-white/50 uppercase tracking-widest text-[9px] font-bold border-b border-white/10 font-mono">
            <tr>
              <th className="px-5 py-3.5">Telegram ID</th>
              <th className="px-5 py-3.5">Имя</th>
              <th className="px-5 py-3.5">Username</th>
              <th className="px-5 py-3.5">Статус подписки</th>
              <th className="px-5 py-3.5">Пройденные воронки (теги)</th>
              <th className="px-5 py-3.5">Активация</th>
              <th className="px-5 py-3.5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-white/40 font-medium">
                  Лидов с такими фильтрами не найдено
                </td>
              </tr>
            ) : (
              paginatedUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                  
                  <td className="px-5 py-4 font-bold text-white/40 font-mono text-[11px]">
                    {user.user_id}
                  </td>

                  <td className="px-5 py-4 font-semibold text-white">
                    {user.first_name || <span className="text-white/30 italic font-mono">—</span>}
                  </td>

                  <td className="px-5 py-4">
                    {user.username ? (
                      <a 
                        href={`https://t.me/${user.username}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sky-400 hover:text-sky-300 font-semibold hover:underline"
                      >
                        @{user.username}
                      </a>
                    ) : (
                      <span className="text-white/30 italic">скрыт</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {user.is_active ? (
                      <span className="bg-emerald-500/10 text-emerald-300 font-semibold px-2.5 py-1 rounded-xl border border-emerald-500/20 inline-flex items-center gap-1.5 text-[10px]">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        Активен
                      </span>
                    ) : (
                      <span className="bg-rose-500/10 text-rose-300 font-semibold px-2.5 py-1 rounded-xl border border-rose-500/20 inline-flex items-center gap-1.5 text-[10px]">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                        Заблок.
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                      {user.tags.filter(t => !t.startsWith("received_") && t !== "received_lead").length === 0 ? (
                        <span className="text-white/30 italic text-[10px]">нет воронки</span>
                      ) : (
                        user.tags
                          .filter(t => !t.startsWith("received_") && t !== "received_lead")
                          .map(tag => (
                            <span 
                              key={tag} 
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getTagColorClass(tag)}`}
                            >
                              {getTagLabel(tag)}
                            </span>
                          ))
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-white/50 font-medium whitespace-nowrap font-mono">
                    {user.created_at.split(" ")[0]}
                  </td>

                  <td className="px-5 py-4 text-right w-36 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      <button 
                        onClick={() => onSelectUser(user)}
                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                        title="Подробнее / Редактировать теги"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => onToggleStatus(user.id)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          user.is_active 
                            ? "text-emerald-400 hover:text-rose-400 hover:bg-rose-500/10" 
                            : "text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                        title={user.is_active ? "Заблокировать" : "Активировать"}
                      >
                        {user.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>

                      <button 
                        onClick={() => {
                          if (confirm("Вы точно хотите навсегда удалить пользователя из локальной базы?")) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className="p-1.5 text-white/35 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Удалить из списка"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-white/[0.01] border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/50 font-medium font-sans">
        <span>Показано {shownFrom}-{endIndex} из {filteredUsers.length}</span>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                currentPage === 1
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 active:scale-95 cursor-pointer"
              }`}
            >
              Назад
            </button>

            {(() => {
              const startPage = Math.max(1, currentPage - 2);
              const endPage = Math.min(totalPages, currentPage + 2);
              const buttons = [];
              
              if (startPage > 1) {
                buttons.push(
                  <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-1 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 cursor-pointer font-bold"
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  buttons.push(<span key="dots-start" className="text-white/35 px-1 font-bold">...</span>);
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                buttons.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 rounded-xl border font-bold transition-all cursor-pointer active:scale-95 ${
                      currentPage === i
                        ? "bg-sky-500 border-sky-400/20 text-white shadow-md shadow-sky-500/20"
                        : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {i}
                  </button>
                );
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  buttons.push(<span key="dots-end" className="text-white/35 px-1 font-bold">...</span>);
                }
                buttons.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-1 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 cursor-pointer font-bold"
                  >
                    {totalPages}
                  </button>
                );
              }

              return buttons;
            })()}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                currentPage === totalPages
                  ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 active:scale-95 cursor-pointer"
              }`}
            >
              Вперед
            </button>
          </div>
        )}
      </div>

    </div>
  );
}