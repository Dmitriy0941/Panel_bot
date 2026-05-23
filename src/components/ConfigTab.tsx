/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Settings, Save, Key, ShieldAlert, Bot, Layers, CheckCircle } from "lucide-react";

export default function ConfigTab() {
  const [token, setToken] = useState("8392104928:AAHj8329-aHJi20384_Kashs921bHjsf");
  const [channel, setChannel] = useState("@katya_migel_blog");
  const [adminId, setAdminId] = useState("549210492");
  const [delay, setDelay] = useState(10); // delay before second lead gift check/delivery
  const [secret, setSecret] = useState("tilda_webhook_sec_83921048");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-6" id="settings-section">
      <div className="flex justify-between items-center border-b border-gray-150 pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
            <Settings className="w-5 h-5 text-blue-600 animate-spin-slow" />
            Настройки Телеграм-бота и вебхуков
          </h2>
          <p className="text-xs text-gray-500 font-normal">Конфигурация параметров цепочек и связи с Тильдой</p>
        </div>
        
        {saved && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Конфигурация успешно сохранена!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Telegram parameters */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <Bot className="w-4 h-4 text-blue-500" />
            Ядро Телеграм-бота (bot.py)
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Токен телеграм-бота (BOT_TOKEN):
            </label>
            <input 
              type="password" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Username канала для обязательной подписки (CHANNEL_USERNAME):
            </label>
            <input 
              type="text" 
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Мой Telegram ID (для оповещений админу) (ADMIN_ID):
            </label>
            <input 
              type="text" 
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
            />
          </div>
        </div>

        {/* Funnel chain and webhook key integration */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <Layers className="w-4 h-4 text-purple-500" />
            Цепочки лид-магнитов и Тильда
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Задержка перед отправкой следующего сообщения воронки (секунд):
            </label>
            <input 
              type="number" 
              value={delay}
              onChange={(e) => setDelay(parseInt(e.target.value, 15) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Секретный ключ вебхуков Tilda (Webhook Secret):
            </label>
            <input 
              type="text" 
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800"
            />
          </div>

          <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-150 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed font-normal">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <b>Хранение секретов:</b> Не пишите API Токены в открытом коде! Добавляйте эти параметры в <code>.env</code> файл на вашем сервере, чтобы бот считывал их безопасно при импорте.
            </div>
          </div>
        </div>

        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            className="w-full md:w-auto ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Сохранить настройки
          </button>
        </div>

      </form>
    </div>
  );
}
