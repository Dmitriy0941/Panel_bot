/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, Download, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { BotUser } from "../types";

interface ImportExportProps {
  onImportSuccess: (imported: BotUser[]) => void;
  users: BotUser[];
}

export default function ImportExport({ onImportSuccess, users }: ImportExportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV string into BotUser array with support for Salebot formats, Excel delimiters, and exponential number formats
  const parseCSV = (text: string): BotUser[] => {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length <= 1) return [];

    // Automatically detect delimiter (Excel in Russian locale uses semicolon ';', standard is comma ',')
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ";" : ",";

    // Clean headers from quotes and spaces
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ""));
    const importedUsers: BotUser[] = [];

    // Intelligent column index mapping for English/Russian Salebot and custom headers
    let idIdx = -1;
    let usernameIdx = -1;
    let nameIdx = -1;
    let tagsIdx = -1;
    let phoneIdx = -1;
    let emailIdx = -1;

    const idHeaders = [
      "platform_id", "идентификатор на платформе", "идентификатор пользователя", 
      "идентификатор платформы", "platform id", "id на платформе", "platformid", 
      "client_id", "client id", "id", "идентификатор"
    ];
    const usernameHeaders = ["username", "nik", "ник", "nickname", "логин", "username на платформе", "никнейм"];
    const nameHeaders = ["first_name", "name", "имя", "fio", "фио", "first name", "имя пользователя"];
    const tagsHeaders = ["tags", "теги", "сегменты", "группы", "tag", "тег"];
    const phoneHeaders = ["phone", "телефон", "номер телефона", "tel", "телефон пользователя", "мобильный"];
    const emailHeaders = ["email", "e-mail", "почта", "email пользователя", "mail", "почта пользователя", "s"];

    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (idIdx === -1 && idHeaders.includes(h)) idIdx = i;
      if (usernameIdx === -1 && usernameHeaders.includes(h)) usernameIdx = i;
      if (nameIdx === -1 && nameHeaders.includes(h)) nameIdx = i;
      if (tagsIdx === -1 && tagsHeaders.includes(h)) tagsIdx = i;
      if (phoneIdx === -1 && phoneHeaders.includes(h)) phoneIdx = i;
      if (emailIdx === -1 && emailHeaders.includes(h)) emailIdx = i;
    }

    // Additional fuzzy matching for ID
    if (idIdx === -1) {
      idIdx = headers.findIndex(h => h.includes("platform") || h.includes("идентификатор") || h.includes("user_id") || h.includes("userid"));
    }

    // Split rows considering quotes and dynamically detected delimiter
    const regex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);


    
    // Dynamic value-scanning heuristics for Email and Phone columns if not matched by headers
    if (emailIdx === -1) {
      // Try exact find for 's' column
      emailIdx = headers.findIndex(h => h === "s");
      if (emailIdx === -1) {
        for (let col = 0; col < headers.length; col++) {
          if (col === idIdx || col === usernameIdx || col === nameIdx || col === tagsIdx || col === phoneIdx) continue;
          for (let r = 1; r < Math.min(lines.length, 10); r++) {
            const cells = lines[r]?.split(regex) || [];
            const cellVal = cells[col]?.replace(/"/g, "").trim() || "";
            if (cellVal && cellVal.includes("@") && cellVal.includes(".") && !cellVal.startsWith("@") && cellVal.length > 4) {
              emailIdx = col;
              break;
            }
          }
          if (emailIdx !== -1) break;
        }
      }
    }

    if (phoneIdx === -1) {
      for (let col = 0; col < headers.length; col++) {
        if (col === idIdx || col === usernameIdx || col === nameIdx || col === tagsIdx || col === emailIdx) continue;
        for (let r = 1; r < Math.min(lines.length, 10); r++) {
          const cells = lines[r]?.split(regex) || [];
          const cellVal = cells[col]?.replace(/"/g, "").replace(/[-+\s()]/g, "").trim() || "";
          if (cellVal && /^\d+$/.test(cellVal) && cellVal.length >= 7 && cellVal.length <= 15) {
            phoneIdx = col;
            break;
          }
        }
        if (phoneIdx !== -1) break;
      }
    }
    
    // Default indices if mapping failed completely
    if (idIdx === -1) idIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    // We strictly do NOT fallback for usernameIdx to prevent false positive imports (like UTM sources or emails)
    if (tagsIdx === -1) tagsIdx = headers.length > 3 ? 3 : headers.length - 1;

    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(regex);
      if (currentline.length <= Math.max(idIdx, nameIdx, usernameIdx, tagsIdx)) continue;
      
      let userIdStr = currentline[idIdx]?.replace(/"/g, "").trim() || "";
      if (!userIdStr) continue;

      // Handle Excel exponential/scientific number formats (e.g. 6,24E+09 or 6.24E+09)
      userIdStr = userIdStr.replace(",", "."); // convert decimal separator
      const parsedNum = Number(userIdStr);
      if (isNaN(parsedNum)) continue;

      const userId = Math.round(parsedNum);
      if (userId <= 0) continue;

      let rUsername = currentline[usernameIdx]?.replace(/"/g, "").replace("@", "").trim() || "";
      // Telegram username must start with a letter, contain only a-z, 0-9, underscores, and be at least 5 chars long
      if (!/^[a-zA-Z][a-zA-Z0-9_]{4,}$/.test(rUsername)) {
        rUsername = ""; // Clear invalid username format to force Telegram API lookup
      }
      let rFirstName = currentline[nameIdx]?.replace(/"/g, "").trim() || "";
      let rTagsStr = currentline[tagsIdx]?.replace(/"/g, "").trim() || "";
      let rPhone = phoneIdx !== -1 ? currentline[phoneIdx]?.replace(/"/g, "").trim() || "" : "";
      let rEmail = emailIdx !== -1 ? currentline[emailIdx]?.replace(/"/g, "").trim() || "" : "";

      // Parse tags separated by comma, semicolon, or vertical bar
      const tags = rTagsStr
        ? rTagsStr.split(/[;,|]/).map(t => t.trim()).filter(Boolean)
        : [];

      importedUsers.push({
        id: Math.random().toString(36).substring(2, 9),
        user_id: userId,
        first_name: rFirstName || undefined,
        username: rUsername || undefined,
        phone: rPhone || undefined,
        email: rEmail || undefined,
        is_active: true,
        tags: tags,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      });
    }

    // Collapse duplicates by user_id and merge their tags
    const uniqueUsersMap = new Map<number, BotUser>();

    for (const u of importedUsers) {
      if (uniqueUsersMap.has(u.user_id)) {
        const existing = uniqueUsersMap.get(u.user_id)!;
        // Merge tags, ensuring uniqueness
        const mergedTags = Array.from(new Set([...(existing.tags || []), ...(u.tags || [])]));
        existing.tags = mergedTags;
        // Merge names, usernames, phones, and emails if missing
        if (!existing.username && u.username) existing.username = u.username;
        if (!existing.first_name && u.first_name) existing.first_name = u.first_name;
        if (!existing.phone && u.phone) existing.phone = u.phone;
        if (!existing.email && u.email) existing.email = u.email;
      } else {
        uniqueUsersMap.set(u.user_id, u);
      }
    }

    return Array.from(uniqueUsersMap.values());
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setStatus({
        type: "error",
        message: "Пожалуйста, выберите файл в формате .csv",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const imported = parseCSV(text);
        if (imported.length === 0) {
          setStatus({
            type: "error",
            message: "Не удалось прочитать контакты. Проверьте столбцы CSV (user_id, username, first_name, tags)",
          });
          return;
        }

        onImportSuccess(imported);
        setStatus({
          type: "success",
          message: `База пополнена! Успешно добавлено: ${imported.length} контактов.`,
        });
        
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setStatus({
          type: "error",
          message: "Ошибка обработки структуры файла CSV.",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const exportToCSV = () => {
    if (users.length === 0) return;
    
    const headers = ["user_id", "username", "first_name", "tags", "phone", "email", "is_active", "created_at"];
    const csvRows = [headers.join(",")];

    users.forEach(u => {
      const row = [
        u.user_id,
        u.username ? `${u.username}` : "",
        u.first_name ? `"${u.first_name.replace(/"/g, '""')}"` : "",
        `"${u.tags.join("|")}"`,
        u.phone ? `"${u.phone}"` : "",
        u.email ? `"${u.email}"` : "",
        u.is_active ? "1" : "0",
        `"${u.created_at}"`
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `money_migel_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.03] p-6 rounded-3xl ring-1 ring-white/10 backdrop-blur" id="csv-section">
      <div>
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2 font-display">
          <Upload className="w-4 h-4 text-[#FF7F11]" />
          Синхронизация пополнений (CSV)
        </h3>
        <p className="text-xs text-white/50 mb-4 font-normal">
          Добавьте лидов для массовых авторассылок. Разделитель: запятая. Списки тегов воронок разделяйте знаком вертикальной черты <code>|</code>.
        </p>
        
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerInput}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
            dragActive 
              ? "border-[#FF7F11] bg-[#FF7F11]/10 text-white" 
              : "border-white/10 hover:border-[#FF7F11]/30 hover:bg-white/5"
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <FileText className="w-8 h-8 mx-auto text-white/30 mb-2" />
          <p className="text-xs font-semibold text-white/80">Перетащите сюда .CSV файл или нажмите для обзора</p>
          <p className="text-[10px] text-white/40 mt-1 font-mono">Формат: user_id, username, first_name, tags</p>
        </div>

        {status.type && (
          <div className={`mt-3 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
            status.type === "success" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
          }`}>
            {status.type === "success" ? (
              <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>{status.message}</div>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 pt-5 md:pt-0 md:pl-6">
        <div>
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2 font-display">
            <Download className="w-4 h-4 text-[#FF7F11]" />
            Экспорт полной базы
          </h3>
          <p className="text-xs text-white/50 mb-4 leading-relaxed font-normal">
            Выгрузите собранных пользователей бота со всеми присвоенными воронками (тегами) для импорта в аналитические CRM или создание резервной копии.
          </p>
          <div className="bg-black/30 border border-white/5 p-4 rounded-2xl mb-4">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Шаблон структуры CSV:</h4>
            <pre className="text-[10px] text-orange-200/85 font-mono overflow-x-auto p-1 leading-normal">
              user_id,username,first_name,tags{"\n"}
              49204024,tony_active,Антон,"money_and_succes"
            </pre>
          </div>
        </div>

        <button 
          onClick={exportToCSV}
          className="w-full bg-gradient-to-r from-[#FF7F11] to-amber-500 hover:from-[#E06A0B] hover:to-amber-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide shadow-md shadow-orange-500/10 cursor-pointer active:scale-[0.98] border border-[#FF7F11]/20"
        >
          <Download className="w-4 h-4" />
          Скачать базу ({users.length} лидов)
        </button>
      </div>
    </div>
  );
}
