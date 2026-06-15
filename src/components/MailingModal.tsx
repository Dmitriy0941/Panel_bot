/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Send, CheckCircle, Volume2, Info, Loader2, CheckSquare, Square, Users, Tags, MessageSquare, AlertCircle } from "lucide-react";
import { BotUser } from "../types";
import { sendMailingReal, MailingPayload } from "../api";

interface MailingModalProps {
  users: BotUser[];
  onClose: () => void;
  useRealApi?: boolean;
  isRealConnected?: boolean;
}

export default function MailingModal({ users, onClose, useRealApi = false, isRealConnected = false }: MailingModalProps) {
  const [targetMode, setTargetMode] = useState<"all" | "tags" | "users">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [targetUserIds, setTargetUserIds] = useState("");
  const [mediaType, setMediaType] = useState<"" | "photo" | "document" | "audio" | "video">("");
  const [mediaFile, setMediaFile] = useState("");
  const [mediaSource, setMediaSource] = useState<"url" | "device">("url");
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [completed, setCompleted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Определяем тип медиа по MIME-типу файла
    if (file.type.startsWith("image/")) {
      setMediaType("photo");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else if (file.type.startsWith("audio/")) {
      setMediaType("audio");
    } else {
      setMediaType("document");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMediaFile(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Extract unique tags and count users
  const tagCounts: { [key: string]: number } = {};
  users.forEach(u => {
    u.tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  // Фильтруем только служебные теги выдачи лидов (начинающиеся с received_), оставляя все воронки и произвольные теги для рассылки
  const availableTags = Object.keys(tagCounts)
    .filter(tag => !tag.startsWith("received_") && tag !== "received_lead")
    .map(tag => ({
      name: tag,
      count: tagCounts[tag]
    }));

  const activeUsersCount = users.filter(u => u.is_active).length;

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleStartMailing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    let recipients: BotUser[] = [];
    let parsedIds: number[] = [];

    if (targetMode === "all") {
      recipients = users.filter(u => u.is_active);
    } else if (targetMode === "tags") {
      if (selectedTags.length === 0) {
        alert("Пожалуйста, выберите хотя бы один тег для рассылки.");
        return;
      }
      recipients = users.filter(u => u.is_active && u.tags.some(t => selectedTags.includes(t)));
    } else if (targetMode === "users") {
      if (!targetUserIds.trim()) {
        alert("Пожалуйста, введите хотя бы один Telegram ID.");
        return;
      }
      parsedIds = targetUserIds
        .split(",")
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      if (parsedIds.length === 0) {
        alert("Пожалуйста, введите корректные числовые Telegram ID.");
        return;
      }
      // Находим получателей среди наших пользователей или просто создаем виртуальный список для прогресс-бара
      recipients = users.filter(u => u.is_active && parsedIds.includes(u.user_id));
      if (recipients.length === 0 && useRealApi) {
        // Если на бэке могут быть пользователи, которых нет в локальном списке
        recipients = parsedIds.map(id => ({
          id: String(id),
          user_id: id,
          is_active: true,
          tags: [],
          created_at: ""
        }));
      }
    }

    if (recipients.length === 0) {
      alert("Нет активных пользователей для рассылки с выбранными условиями.");
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: recipients.length });

    if (useRealApi && isRealConnected) {
      try {
        const payload: MailingPayload = {
          text: message,
          target: targetMode,
          tags: targetMode === "tags" ? selectedTags : undefined,
          user_ids: targetMode === "users" ? parsedIds : undefined,
          media_type: mediaType !== "" ? mediaType : undefined,
          media_file: mediaType !== "" ? mediaFile : undefined
        };

        await sendMailingReal(payload);
        
        // Progress bar simulation for UX
        let index = 0;
        const interval = setInterval(() => {
          index += Math.ceil(recipients.length / 8) || 1;
          if (index >= recipients.length) {
            index = recipients.length;
            clearInterval(interval);
            setSending(false);
            setCompleted(true);
          }
          setProgress({ current: index, total: recipients.length });
        }, 110);
      } catch (err: any) {
        setSending(false);
        alert(`Не удалось запустить рассылку на сервере: ${err.message}`);
      }
    } else {
      // Simulate local demo dispatch interval
      let index = 0;
      const interval = setInterval(() => {
        index++;
        setProgress({ current: index, total: recipients.length });

        if (index >= recipients.length) {
          clearInterval(interval);
          setSending(false);
          setCompleted(true);
        }
      }, Math.max(20, Math.min(120, 1000 / recipients.length)));
    }
  };

  const getTagFriendlyName = (tag: string) => {
    switch (tag) {
      case "chain_money_meditation": return "Медитация «Деньги и успех»";
      case "chain_ideal_day": return "Медитация «Идеальный день»";
      case "chain_little_step": return "Гайд «Маленькие шаги»";
      case "chain_energy": return "Гайд «Энергия»";
      default: return tag;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#0b0c10]/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative">
        <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-[#FF7F11]/5 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="bg-white/[0.02] border-b border-white/10 p-5 flex justify-between items-center shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#FF7F11]/10 p-2.5 rounded-xl ring-1 ring-[#FF7F11]/20 text-[#FF7F11]">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-md">Умная Робот-рассылка</h3>
              <p className="text-[11px] text-white/40 font-medium">Таргетированная рассылка в Telegram по сегментам и ID</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/45 hover:text-white p-1.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer active:scale-[0.96] transition-transform"
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
                <h4 className="text-base font-bold text-white font-display">Рассылка успешно запущена!</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  Фоновая отправка сообщений для <b>{progress.total}</b> получателей активирована на сервере VPS.
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-[#FF7F11] hover:bg-[#E06A0B] text-white font-semibold py-2.5 px-6 rounded-xl transition-all text-xs cursor-pointer shadow-md shadow-orange-500/10 border border-[#FF7F11]/20 active:scale-95"
              >
                Закрыть окно рассылок
              </button>
            </div>
          ) : sending ? (
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <Loader2 className="w-10 h-10 text-[#FF7F11] animate-spin" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h4 className="font-bold text-white text-sm font-display">Отправка сообщений в процессе...</h4>
                <p className="text-[11px] text-white/45 leading-relaxed">
                  Сервер выполняет асинхронную рассылку. Во избежание флуд-блокировок Telegram API сообщения отсылаются с интервалом в 40мс.
                </p>
                <div className="w-full bg-white/5 rounded-full h-2 mt-4 ring-1 ring-white/10 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#FF7F11] to-amber-500 h-full rounded-full transition-all duration-155" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-orange-300 inline-block mt-2 font-mono">
                  Обработано {progress.current} из {progress.total} получателей ({Math.round((progress.current / progress.total) * 100)}%)
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStartMailing} className="space-y-5">
              
              {/* Target Segment Modes */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  Получатели рассылки:
                </label>
                
                <div className="grid grid-cols-3 gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setTargetMode("all")}
                    className={`py-2 px-3 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      targetMode === "all" 
                        ? "bg-[#FF7F11] text-white shadow-md shadow-orange-500/10" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Всем ({activeUsersCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetMode("tags")}
                    className={`py-2 px-3 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      targetMode === "tags" 
                        ? "bg-[#FF7F11] text-white shadow-md shadow-orange-500/10" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <Tags className="w-4 h-4" />
                    <span>По воронкам</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetMode("users")}
                    className={`py-2 px-3 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      targetMode === "users" 
                        ? "bg-[#FF7F11] text-white shadow-md shadow-orange-500/10" 
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>По ID</span>
                  </button>
                </div>
              </div>

              {/* Dynamic inputs based on targetMode */}
              {targetMode === "tags" && (
                <div className="space-y-2.5 bg-black/20 p-4.5 rounded-2xl border border-white/5 animate-fade-in">
                  <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                    Выберите воронки (хотя бы одну):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableTags.map(tag => {
                      const isChecked = selectedTags.includes(tag.name);
                      return (
                        <button
                          type="button"
                          key={tag.name}
                          onClick={() => handleTagToggle(tag.name)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer active:scale-95 ${
                            isChecked 
                              ? "bg-[#FF7F11]/10 border-[#FF7F11]/30 text-orange-200" 
                              : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/[0.04] hover:text-white/80"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#FF7F11] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-white/20 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="block truncate text-[11px]">{getTagFriendlyName(tag.name)}</span>
                            <span className="text-[10px] text-white/30 font-mono font-normal">Активных: {tag.count} чел.</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {targetMode === "users" && (
                <div className="space-y-2 bg-black/20 p-4.5 rounded-2xl border border-white/5 animate-fade-in">
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                    Список Telegram User ID:
                  </label>
                  <input
                    type="text"
                    required
                    value={targetUserIds}
                    onChange={(e) => setTargetUserIds(e.target.value)}
                    placeholder="84729103, 19284719, 47291038"
                    className="w-full p-3 bg-white/[0.03] border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF7F11]/25 focus:border-[#FF7F11]/50 text-white placeholder-white/20 font-mono"
                  />
                  <span className="text-[10px] text-white/30 block leading-tight font-normal">
                    Введите числовые Telegram UID получателей через запятую.
                  </span>
                </div>
              )}

              {/* Media Attachment Selector */}
              <div className="space-y-3 bg-black/20 p-4.5 rounded-2xl border border-white/5">
                <span className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  Прикрепить медиафайл (опционально):
                </span>
                
                <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => { setMediaSource("url"); setMediaType(""); setMediaFile(""); setFileName(""); }}
                    className={`py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer active:scale-95 ${
                      mediaSource === "url" 
                        ? "bg-[#FF7F11] text-white shadow-sm" 
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    По ссылке / ID
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMediaSource("device"); setMediaType(""); setMediaFile(""); setFileName(""); }}
                    className={`py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer active:scale-95 ${
                      mediaSource === "device" 
                        ? "bg-[#FF7F11] text-white shadow-sm" 
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    Загрузить с устройства
                  </button>
                </div>

                {mediaSource === "url" ? (
                  <>
                    <div className="grid grid-cols-5 gap-1 p-1 bg-black/35 rounded-xl border border-white/5">
                      {[
                        { id: "", label: "Без медиа" },
                        { id: "photo", label: "Фото" },
                        { id: "document", label: "Файл" },
                        { id: "audio", label: "Аудио" },
                        { id: "video", label: "Видео" }
                      ].map(item => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setMediaType(item.id as any)}
                          className={`py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer active:scale-95 ${
                            mediaType === item.id 
                              ? "bg-[#FF7F11] text-white shadow-sm" 
                              : "text-white/40 hover:text-white/70 hover:bg-white/5"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {mediaType !== "" && (
                      <div className="space-y-1.5 animate-fade-in pt-1">
                        <label className="block text-[9px] font-bold text-orange-300 uppercase tracking-wider font-mono">
                          Telegram File ID или прямая URL ссылка:
                        </label>
                        <input
                          type="text"
                          required
                          value={mediaFile}
                          onChange={(e) => setMediaFile(e.target.value)}
                          placeholder={
                            mediaType === "photo" ? "AgACAgIAAxkBAAIB... или https://site.com/image.jpg" :
                            mediaType === "document" ? "BQACAgIAAxkBAAIC... или https://site.com/document.pdf" :
                            mediaType === "audio" ? "CQACAgIAAxkBAAID... или https://site.com/audio.mp3" :
                            "BAACAgIAAxkBAAIE... или https://site.com/video.mp4"
                          }
                          className="w-full p-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-[11px] outline-none focus:ring-2 focus:ring-[#FF7F11]/25 focus:border-[#FF7F11]/50 text-white placeholder-white/20 font-mono"
                        />
                        <span className="text-[9px] text-white/30 block leading-tight font-normal">
                          💡 <b>Совет:</b> Самый быстрый способ получить <code>file_id</code> — переслать медиафайл вашему боту в Telegram. Бот автоматически вернет готовый ID для вставки!
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <label className="block text-[9px] font-bold text-orange-300 uppercase tracking-wider font-mono">
                      Выберите файл с вашего ноутбука или смартфона:
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="bg-[#FF7F11] hover:bg-[#E06A0B] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer select-none active:scale-95 shadow-md shadow-orange-500/10 border border-[#FF7F11]/20">
                        Выбрать файл
                        <input
                          type="file"
                          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-white/60 truncate font-medium">
                        {fileName ? fileName : "Файл не выбран"}
                      </span>
                    </div>
                    {mediaType !== "" && (
                      <span className="text-[9px] text-emerald-400 font-bold block mt-1 font-mono">
                        ✓ Файл распознан как: {
                          mediaType === "photo" ? "ИЗОБРАЖЕНИЕ" :
                          mediaType === "video" ? "ВИДЕОРОЛИК" :
                          mediaType === "audio" ? "АУДИОФАЙЛ" : "ДОКУМЕНТ"
                        }
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Message Payload */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  Текст сообщения (поддерживается HTML):
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Привет! Вы получили этот ценный разбор, потому что оставили заявку на мини-лендинге Tilda..."
                  className="w-full p-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#FF7F11]/25 focus:border-[#FF7F11]/50 text-white placeholder-white/20 leading-relaxed"
                />
                <div className="flex justify-between text-[10px] text-white/30 font-mono">
                  <span>Вы можете использовать теги: &lt;b&gt;, &lt;i&gt;, &lt;code&gt;, &lt;a href="..."&gt;</span>
                  <span>{message.length} симв.</span>
                </div>
              </div>

              {/* API Integration Hint */}
              <div className="bg-[#FF7F11]/10 rounded-2xl p-4 border border-[#FF7F11]/20 flex items-start gap-2.5 text-xs text-orange-200/90 leading-relaxed font-normal">
                <Info className="w-4.5 h-4.5 shrink-0 text-[#FF7F11] mt-0.5" />
                <div>
                  Запуск рассылки отправит запрос <code className="text-orange-300 font-mono font-bold text-[10px]">POST /api/mailing</code> на бэкенд FastAPI. Рассылка будет выполняться в фоне на стороне VPS, не блокируя работу интерфейса.
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
                  className="w-2/3 bg-gradient-to-r from-[#FF7F11] to-amber-500 hover:from-[#E06A0B] hover:to-amber-600 text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 border border-[#FF7F11]/20 cursor-pointer active:scale-[0.98]"
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
