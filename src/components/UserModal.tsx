/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, User, Plus, Trash2, Send, CheckCircle2, Bot, Calendar, Landmark } from "lucide-react";
import { BotUser } from "../types";
import { sendMailingReal } from "../api";

interface UserModalProps {
  user: BotUser;
  onClose: () => void;
  onUpdateUser: (updated: BotUser) => void;
  useRealApi?: boolean;
  isRealConnected?: boolean;
}

export default function UserModal({ user, onClose, onUpdateUser, useRealApi = false, isRealConnected = false }: UserModalProps) {
  const [newTag, setNewTag] = useState("");
  const [msgText, setMsgText] = useState("");
  const [mediaType, setMediaType] = useState<"" | "photo" | "document" | "audio" | "video">("");
  const [mediaFile, setMediaFile] = useState("");
  const [mediaSource, setMediaSource] = useState<"url" | "device">("url");
  const [fileName, setFileName] = useState("");
  const [sentStatus, setSentStatus] = useState(false);
  const [sending, setSending] = useState(false);

  // States for editable contact details
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

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

  const handleToggleActive = () => {
    onUpdateUser({
      ...user,
      is_active: !user.is_active,
    });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const cleanTag = newTag.trim().toLowerCase().replace(/\s+/g, "_");
    if (!user.tags.includes(cleanTag)) {
      onUpdateUser({
        ...user,
        tags: [...user.tags, cleanTag],
      });
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateUser({
      ...user,
      tags: user.tags.filter(t => t !== tagToRemove),
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    
    setSending(true);
    if (useRealApi && isRealConnected) {
      try {
        await sendMailingReal({
          text: msgText,
          target: "users",
          user_ids: [user.user_id],
          media_type: mediaType !== "" ? mediaType : undefined,
          media_file: mediaType !== "" ? mediaFile : undefined
        });
        setSending(false);
        setSentStatus(true);
        setTimeout(() => setSentStatus(false), 4000);
        setMsgText("");
      } catch (err: any) {
        setSending(false);
        alert("Не удалось отправить тестовое сообщение: " + err.message);
      }
    } else {
      setTimeout(() => {
        setSending(false);
        setSentStatus(true);
        setTimeout(() => setSentStatus(false), 3000);
        setMsgText("");
      }, 800);
    }
  };

  // Human-readable labels for specific funnel tags
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#0b0825] border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative">
        <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="bg-white/[0.02] border-b border-white/10 p-5 flex justify-between items-center shrink-0 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500/10 p-2.5 rounded-xl ring-1 ring-indigo-400/20 text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-md">
                {user.first_name || "Лид без имени"}
              </h3>
              <p className="text-[11px] text-sky-300 font-semibold font-mono">
                {user.username ? `@${user.username}` : "TG UID: " + user.user_id}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/45 hover:text-white p-1.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar relative z-10">
          
          {/* User Information Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1 col-span-1">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Дата входа
              </span>
              <span className="text-xs font-semibold text-white/95 break-all font-mono">{user.created_at}</span>
            </div>
            <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1 col-span-1">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Landmark className="w-3.5 h-3.5 text-sky-400" />
                Telegram ID
              </span>
              <span className="text-xs font-bold text-sky-300 break-all font-mono">{user.user_id}</span>
            </div>
            
            <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1 col-span-2">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest block font-mono">
                Имя лида
              </span>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                placeholder="Имя не указано"
              />
            </div>
            
            <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1 col-span-1">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest block font-mono">
                Телефон
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                placeholder="не указан"
              />
            </div>
            
            <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1 col-span-1">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest block font-mono">
                E-mail
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-sky-300 outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-medium"
                placeholder="не указан"
              />
            </div>
          </div>

          {/* Save Profile Button (reveals on change) */}
          {(firstName !== (user.first_name || "") || 
            phone !== (user.phone || "") || 
            email !== (user.email || "")) && (
            <button
              onClick={async () => {
                setSaveStatus("saving");
                try {
                  await onUpdateUser({
                    ...user,
                    first_name: firstName.trim() || undefined,
                    phone: phone.trim() || undefined,
                    email: email.trim() || undefined,
                  });
                  setSaveStatus("saved");
                  setTimeout(() => setSaveStatus("idle"), 2000);
                } catch (e) {
                  setSaveStatus("idle");
                  alert("Не удалось сохранить данные профиля.");
                }
              }}
              disabled={saveStatus === "saving"}
              className="w-full bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] cursor-pointer"
            >
              {saveStatus === "saving" ? "Сохранение..." : saveStatus === "saved" ? "✓ Успешно сохранено!" : "Сохранить изменения в профиле"}
            </button>
          )}

          {/* Status Switcher & Info */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide block font-mono">Статус рассылок в боте</span>
              <span className={`text-xs font-bold mt-1 inline-flex items-center gap-1.5 ${
                user.is_active ? "text-emerald-400" : "text-rose-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}></span>
                {user.is_active ? "Активный подписчик" : "Отписался от бота / заблокировал"}
              </span>
            </div>
            
            <button
              onClick={handleToggleActive}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                user.is_active 
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" 
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              {user.is_active ? "Залочить" : "Активировать"}
            </button>
          </div>

          {/* Tag Management */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                Воронки и теги пользователя
              </label>
              <span className="text-xs text-sky-300 font-semibold">{user.tags.filter(t => t !== "received_lead").length} тегов</span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[40px] p-3 rounded-2xl border border-white/10 bg-white/[0.01]">
              {user.tags.filter(t => t !== "received_lead").length === 0 ? (
                <span className="text-xs text-white/40 italic">Нет выданных тегов лид-магнитов</span>
              ) : (
                user.tags
                  .filter(t => t !== "received_lead")
                  .map(tag => (
                    <span 
                      key={tag} 
                      className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-xl font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    >
                      {getTagLabel(tag)}
                      <button 
                        onClick={() => handleRemoveTag(tag)}
                        className="text-white/30 hover:text-rose-400 ml-1 transition-colors cursor-pointer"
                        title="Удалить воронку"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
              )}
            </div>

            {/* Add tag form */}
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Впишите тег... (например: energy)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-white placeholder-white/20"
              />
              <button 
                type="submit"
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1 select-none cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Добавить
              </button>
            </form>
          </div>

          {/* Test Telegram API Push Notification Message */}
          <div className="border-t border-white/10 pt-5 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
              <Bot className="w-4 h-4 text-indigo-400" />
              Отправка тестового Push-сообщения
            </div>
            
            <form onSubmit={handleSendMessage} className="space-y-3">
              {/* Media Attachment Selector */}
              <div className="space-y-2 bg-black/20 p-3 rounded-2xl border border-white/5">
                <span className="block text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  Прикрепить медиафайл (опционально):
                </span>
                
                <div className="grid grid-cols-2 gap-2 bg-black/30 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    disabled={!user.is_active}
                    onClick={() => { setMediaSource("url"); setMediaType(""); setMediaFile(""); setFileName(""); }}
                    className={`py-1 rounded-lg text-[8px] font-bold transition-all cursor-pointer ${
                      mediaSource === "url" 
                        ? "bg-indigo-500 text-white shadow-sm" 
                        : "text-white/40 hover:text-white/70 disabled:opacity-30"
                    }`}
                  >
                    По ссылке / ID
                  </button>
                  <button
                    type="button"
                    disabled={!user.is_active}
                    onClick={() => { setMediaSource("device"); setMediaType(""); setMediaFile(""); setFileName(""); }}
                    className={`py-1 rounded-lg text-[8px] font-bold transition-all cursor-pointer ${
                      mediaSource === "device" 
                        ? "bg-indigo-500 text-white shadow-sm" 
                        : "text-white/40 hover:text-white/70 disabled:opacity-30"
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
                          disabled={!user.is_active}
                          onClick={() => setMediaType(item.id as any)}
                          className={`py-1 rounded-lg text-[8px] font-bold transition-all cursor-pointer ${
                            mediaType === item.id 
                              ? "bg-indigo-500 text-white shadow-sm" 
                              : "text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-30"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {mediaType !== "" && user.is_active && (
                      <div className="space-y-1 animate-fade-in pt-1">
                        <label className="block text-[8px] font-bold text-indigo-300 uppercase tracking-wider font-mono">
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
                          className="w-full p-2 bg-white/[0.02] border border-white/10 rounded-xl text-[10px] outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-white/20 font-mono"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2 pt-1 animate-fade-in">
                    <label className="block text-[8px] font-bold text-indigo-300 uppercase tracking-wider font-mono">
                      Выберите файл с вашего ноутбука или смартфона:
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1.5 px-3 rounded-xl text-[10px] transition-all cursor-pointer select-none">
                        Выбрать файл
                        <input
                          type="file"
                          accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-white/60 truncate font-medium max-w-[150px]">
                        {fileName ? fileName : "Файл не выбран"}
                      </span>
                    </div>
                    {mediaType !== "" && (
                      <span className="text-[8px] text-emerald-400 font-bold block mt-1 font-mono">
                        ✓ Файл: {
                          mediaType === "photo" ? "ИЗОБРАЖЕНИЕ" :
                          mediaType === "video" ? "ВИДЕО" :
                          mediaType === "audio" ? "АУДИО" : "ДОКУМЕНТ"
                        }
                      </span>
                    )}
                  </div>
                )}
              </div>

              <textarea
                placeholder="Напишите текст, чтобы мгновенно протестировать отправку этого сообщения..."
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                rows={2}
                disabled={!user.is_active}
                className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-white disabled:opacity-40 resize-none placeholder-white/20"
              />
              <div className="flex justify-between items-center">
                {!user.is_active && (
                  <span className="text-[10px] text-rose-400 font-semibold font-mono">Рассылка заблокирована</span>
                )}
                {sentStatus && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Сообщение доставлено в ЛС Telegram!
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    type="submit"
                    disabled={sending || !msgText.trim() || !user.is_active}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                    {sending ? "Посылаю..." : "Отправить"}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
