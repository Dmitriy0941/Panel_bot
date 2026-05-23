/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Copy, Check, Terminal, ExternalLink, HelpCircle, Layers, CheckCircle2, ShieldAlert, FileCode2, Link, ArrowRightLeft } from "lucide-react";

export default function IntegrationGuide() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const tildaEmdedCode = `<!-- Вставка скомпилированной React админки в блок T123 (HTML) на Тильде -->
<div id="admin-frame-container" style="width:100%; height:900px; overflow:hidden; border-radius:16px; border:1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05);">
    <iframe 
        src="https://bot-admin-vash-domen.web.app/" 
        style="width:100%; height:100%; border:none;" 
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    ></iframe>
</div>`;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-8" id="guide-section">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Инструкция по связке и запуску (Tilda + Бот на Python)
        </h2>
        <p className="text-xs text-gray-500 font-normal mt-0.5">
          Объяснение архитектуры взаимодействия ваших готовых скриптов и форм на Tilda
        </p>
      </div>

      {/* Concept Architecture Flow for User */}
      <div className="bg-amber-50/70 rounded-2xl p-6 border border-amber-150 space-y-4">
        <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-amber-700" />
          Как работает ваша идеальная связка (Tilda + Бот + Админка)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-amber-950 font-normal">
          <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-1.5 shadow-xs">
            <span className="bg-amber-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase">Шаг 1. Форма на Tilda</span>
            <p className="leading-relaxed">
              Клиент заходит на Tilda, вписывает Email/Имя и жмет <b>«Получить подарок»</b>. Кнопка настроена на автоматический редирект на нужную воронку бота с реферальным хвостом: например, <code>?start=money_and_succes</code>.
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-1.5 shadow-xs">
            <span className="bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase">Шаг 2. Вебхук {`->`} Бот</span>
            <p className="leading-relaxed">
              В момент клика Tilda отправляет данные формы (Email, телефон) на ваш скрипт <code>webhook_server.py</code>. Скрипт тут же вносит Email лида в базу <code>data/bot.db</code> и привязывает к нему соответствующий тег воронки.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-1.5 shadow-xs">
            <span className="bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[10px] uppercase">Шаг 3. Бот + Админка</span>
            <p className="leading-relaxed">
              Пользователь запускает цепочку в Telegram. Бот выдает PDF/аудио. Вы в красивой админке (через <code>admin_api.py</code>) сразу видите эту статистику, можете делать массовые рассылки и выгружать контакты!
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Your existing files and API connection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
          <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wide">Почему вам НЕ нужно дописывать бэкэнд вручную</h4>
        </div>
        
        <div className="border border-gray-150 p-5 rounded-xl bg-gray-50/50 text-xs text-gray-700 leading-relaxed font-normal space-y-3">
          <p>
            В структуре вашего бота на сервере уже есть готовые скрипты:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-medium text-gray-800">
            <li>
              <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-bold">admin_api.py</code> — это уже готовый API-сервер. Фронтенд-панель (данное React приложение) напрямую делает веб-запросы к этому файлу на вашем сервере для отображения статистики, редактирования тегов и экспорта базы.
            </li>
            <li>
              <code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded font-bold">webhook_server.py</code> — отвечает за мгновенный приём лидов с Tilda.
            </li>
            <li>
              <code className="text-gray-600 bg-gray-100 px-1 py-0.5 rounded font-bold">data/bot.db</code> — локальная БД SQLite, в которой хранятся все пользователи, их активность и метки.
            </li>
          </ul>
          <p className="text-gray-500 font-normal">
            <b>Что требуется сделать:</b> Запустить <code>admin_api.py</code> на сервере (например, на порту 8000), скомпилировать эту красивую админ-панель и прописать в ней URL вашего сервера VPS. Скрипты уже содержат всю необходимую логику интеграции!
          </p>
        </div>
      </div>

      {/* Step 2: Install on Tilda */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
          <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wide font-bold">Интеграция админ-панели прямо в личный кабинет Tilda</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 border border-gray-150 p-5 rounded-xl bg-gray-50/50">
            <h5 className="font-bold text-xs text-gray-800 uppercase flex items-center gap-1.5">
              <Link className="w-4 h-4 text-indigo-600" />
              Встраивание через HTML-блок T123:
            </h5>
            <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4 font-normal leading-relaxed">
              <li>
                Соберите эту готовую веб-панель (<code>npm run build</code>) и залейте статические файлы на любой хостинг (например, Vercel, Netlify или непосредственно на ваш сервер VPS).
              </li>
              <li>
                В конструкторе Tilda на странице управления блогом или скрытой технической странице добавьте блок <b>«T123 (HTML-код)»</b> (раздел «Другое»).
              </li>
              <li>
                В контент блока вставьте скопированный код фрейма <code>iframe</code>, указав вместо демо-ссылки ваш адрес развернутой панели.
              </li>
              <li>
                Установите пароль на страницу на Тильде, и у вас будет безопасная админка внутри вашего конструктора сайта!
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Код фрейма для блока T123:</span>
              <button 
                onClick={() => copyToClipboard(tildaEmdedCode, "tilda")}
                className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
              >
                {copiedSection === "tilda" ? "Скопировано!" : "Скопировать код"}
              </button>
            </div>
            <pre className="text-[10px] font-mono text-gray-800 bg-amber-50/50 border border-amber-200 p-4 rounded-xl leading-normal overflow-x-auto min-h-[120px]">
              {tildaEmdedCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Step 3: Webhooks and Connection */}
      <div className="space-y-4 border-t border-gray-150 pt-6">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-600 text-white font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
          <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wide font-bold">Настройка приема данных форм с Тильды</h4>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-150/50 rounded-xl p-5 text-xs text-indigo-900 leading-relaxed font-normal space-y-2">
          <p>
            Чтобы контакты, которые пользователь ввёл на Tilda до перехода в бота, попадали в базу вашего бота мгновенно:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              В настройках Тильды перейдите в <b>«Настройки сайта» → «Шапки и подвалы» или «Формы» → Webhook</b>.
            </li>
            <li>
              Укажите адрес вашего webhook-сервера Python (который запускает <code>webhook_server.py</code> на вашем VPS), например: <code className="bg-indigo-100 font-bold px-1.5 py-0.5 rounded text-[10px]">https://your-server-ip:8000/tilda/webhook</code>.
            </li>
            <li>
              В настройках конкретной формы на Tilda поставьте галочку напротив этого добавленного Webhook-приёмника.
            </li>
            <li>
              <b>Ваш настроенный редирект:</b> В поле <i>«Адрес страницы в случае успеха (Redirect URL)»</i> формы на Tilda пропишите адрес воронки: <code className="bg-indigo-100 font-bold px-1.5 py-0.5 rounded text-[10px]">https://t.me/Money_migel_bot?start=money_and_succes</code> (или другую воронку). 
              <br />
              <span className="text-gray-500 font-normal">При клике, контакты улетают по вебхуку в базу, а сам человек перенаправляется в интерфейс Telegram, где бот моментально выдает лид-магнит.</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}

