/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CalendarRange, RefreshCcw } from "lucide-react";
import { DashboardStats } from "../types";
import { motion } from "motion/react";

interface StatsGridProps {
  stats: DashboardStats;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onRefresh: () => void;
  onResetDates: () => void;
}

export default function StatsGrid({
  stats,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
  onResetDates,
}: StatsGridProps) {
  return (
    <div className="space-y-6">
      {/* Filters Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white/[0.03] ring-1 ring-white/10 p-5 rounded-3xl backdrop-blur relative overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>
        
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight font-display">Статистика активности</h2>
          <p className="text-[11px] text-white/40 font-normal">Сводки пополнений базы и подписок на лид-магниты</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Date Picker container */}
          <div className="flex items-center gap-3 border border-white/10 rounded-xl px-3.5 py-1.5 bg-white/[0.02] hover:bg-white/[0.04] focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500/40 transition-all text-xs font-semibold text-white/70 w-full sm:w-auto justify-between">
            <span className="text-white/40 flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5 text-sky-400" />
              Период:
            </span>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-transparent border-none outline-none text-white font-semibold cursor-pointer py-0.5 text-xs select-none color-scheme-dark hover:text-sky-300 transition-colors"
                style={{ contentVisibility: "auto" }}
              />
              <span className="text-white/20">—</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-transparent border-none outline-none text-white font-semibold cursor-pointer py-0.5 text-xs select-none color-scheme-dark hover:text-sky-300 transition-colors"
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <button 
              onClick={onResetDates}
              className="text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              Сброс
            </button>
          )}

          <button 
            onClick={onRefresh}
            className="flex items-center gap-1.5 bg-sky-500/15 text-sky-300 hover:bg-sky-500/20 px-3.5 py-2 rounded-xl text-xs font-semibold border border-sky-500/30 transition-all cursor-pointer"
            title="Синхронизировать SQLite БД"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-sky-300" />
            Обновить
          </button>
        </div>
      </motion.div>
    </div>
  );
}
