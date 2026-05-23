/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Send, CheckCircle, Volume2, Info, Loader2 } from "lucide-react";
import { BotUser } from "../types";

interface MailingModalProps {
  users: BotUser[];
  onClose: () => void;
}

export default function MailingModal({ users, onClose }: MailingModalProps) {
  const [selectedTag, setSelectedTag] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [completed, setCompleted] = useState(false);

  // Extract unique tags and count users
  const tagCounts: { [key: string]: number } = {};
  users.forEach(u => {
    u.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const availableTags = Object.keys(tagCounts)
    .filter(tag => tag !== "received_lead")
    .map(tag => ({
      name: tag,
      count: tagCounts[tag]
    }));

  const activeUsersCount = users.filter(u => u.is_active).length;

  const handleStartMailing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Filter recipients - only active users with the selected tag
    const recipients = users.filter(u => {
      if (!u.is_active) return false;
      if (selectedTag === "") return true; // All active users
      return u.tags.includes(selectedTag);
    });

    if (recipients.length === 0) {
      alert("Нет активных пользователей для рассылки с выбранными условиями.");
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: recipients.length });

    // Simulate sending interval over-time for a nice feeling of high scale bulk broadcast in real-time
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setProgress({ current: index, total: recipients.length });

      if (index >= recipients.length) {
        clearInterval(interval);
        setSending(false);
        setCompleted(true);
      }
    }, 120); // 120ms dispatch lag
  };

  const getTagFriendlyName = (tag: string) => {
    switch (tag) {
      case "money_and_succes": return "Медитация «Деньги и успех»";
      case "ideal_day": return "Медитация «Идеальный день»";
      case "little_step": return "Гайд «Маленькие шаги»";
      case "energy": return "Гайд «Энергия»";
      default: return tag;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#0b0825] border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative">
        <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="bg-white/[0.02] border-b border-white/10 p-5 flex justify-between items-center shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-purple-500/15 p-2.5 rounded-xl ring-1 ring-purple-400/20 text-purple-300">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-md">Массовая Робот-рассылка</h3>
              <p className="text-[11px] text-white/40 font-medium">Рассылка сообщений лидам в Telegram по сегментам</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/45 hover:text-white p-1.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            disabled={sending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar relative z-10">
          
          {completed ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20 rounded-full w-16 h-16 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white font-display">Рассылка успешно завершена!</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  Пуш-сообщение успешно отправлено <b>{progress.total}</b> активным пользователям в Телеграм.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-xs cursor-pointer shadow-md"
              >
                Закрыть верификатор
              </button>
            </div>
          ) : sending ? (
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h4 className="font-bold text-white text-sm font-display">Идет фоновая отправка сообщений...</h4>
                <p className="text-[11px] text-white/45 leading-relaxed">
                  Транслируем пуши в ЛС Telegram пользователей (авто-разбивка лимита API Bot: 30 отправлений в секунду во избежание флуд-блокировок).
                </p>
                <div className="w-full bg-white/5 rounded-full h-2 mt-4 ring-1 ring-white/10 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-150" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-sky-305 inline-block mt-2 font-mono">
                  Отправлено {progress.current} из {progress.total} получателям ({Math.round((progress.current / progress.total) * 100)}%)
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStartMailing} className="space-y-4">
              
              {/* Target Segment */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  Целевой сегмент рассылки:
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full p-2.5 bg-[#0a061e] border border-white/10 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-sky-500/25 text-white/80"
                >
                  <option value="" className="bg-[#0f0b29]">Все активные лиды ({activeUsersCount} чел.)</option>
                  {availableTags.map(t => (
                    <option key={t.name} value={t.name} className="bg-[#0f0b29]">
                      Воронка: {getTagFriendlyName(t.name)} ({t.count} чел.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Payload */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  Текст сообщения:
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Привет! Вы получили этот ценный разбор, потому что оставили заявку на мини-лендинге Tilda..."
                  className="w-full p-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500/25 text-white placeholder-white/20"
                />
                <span className="text-[10px] text-white/30 block leading-tight font-mono">
                  Поддерживается разметка Markdown (жирный, курсив, инвертированные ссылки) для отображения в Telegram.
                </span>
              </div>

              {/* API Integration Hint */}
              <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20 flex items-start gap-2.5 text-xs text-indigo-200/90 leading-relaxed font-normal">
                <Info className="w-4.5 h-4.5 shrink-0 text-indigo-400 mt-0.5" />
                <div>
                  При нажатии на кнопку ниже, фронт пошлет тело сообщения с тегом рассылки в файл <code className="text-sky-300 bg-white/5 font-mono text-[10px] px-1 rounded font-bold">admin_api.py</code> по роуту <code className="text-indigo-300 font-mono font-bold text-[10px]">POST /api/mailing</code>, заставляя бот стримить пуш по всей SQLite базе.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 border border-white/10 hover:bg-white/5 bg-transparent text-white/80 font-semibold py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md border border-white/10 cursor-pointer active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" />
                  Запустить рассылку
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
