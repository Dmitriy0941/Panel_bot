/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BotUser, DashboardStats } from "./types";

export const DEFAULT_USERS: BotUser[] = [
  {
    id: "1",
    user_id: 84729103,
    first_name: "Екатерина",
    username: "katya_migel",
    is_active: true,
    tags: ["money_and_succes"],
    created_at: "2026-05-20 14:22:10",
  },
  {
    id: "2",
    user_id: 19284719,
    first_name: "Александр",
    username: "sasha_psy",
    is_active: true,
    tags: ["ideal_day"],
    created_at: "2026-05-21 09:15:33",
  },
  {
    id: "3",
    user_id: 47291038,
    first_name: "Анна",
    username: "anna_energy",
    is_active: true,
    tags: ["energy"],
    created_at: "2026-05-22 18:45:00",
  },
  {
    id: "4",
    user_id: 93821049,
    first_name: "Дмитрий",
    username: "dima_step",
    is_active: false,
    tags: ["little_step"],
    created_at: "2026-05-18 11:30:12",
  },
  {
    id: "5",
    user_id: 38291048,
    first_name: "Мария",
    username: "masha_brand",
    is_active: true,
    tags: ["money_and_succes"],
    created_at: "2026-05-23 08:12:45",
  },
  {
    id: "6",
    user_id: 28491038,
    first_name: "Иван",
    username: "ivan_novikov",
    is_active: true,
    tags: ["energy", "ideal_day"],
    created_at: "2026-05-19 20:05:11",
  },
  {
    id: "7",
    user_id: 73829104,
    first_name: "Ольга",
    username: "olga_light",
    is_active: false,
    tags: ["little_step"],
    created_at: "2026-05-15 16:34:55",
  },
  {
    id: "8",
    user_id: 11029384,
    first_name: "Сергей",
    username: undefined,
    is_active: true,
    tags: ["money_and_succes"],
    created_at: "2026-05-23 10:11:00",
  }
];

// Load from or initialize localStorage
export function loadUsersFromStorage(): BotUser[] {
  const data = localStorage.getItem("bot_users");
  if (!data) {
    localStorage.setItem("bot_users", JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_USERS;
  }
}

export function saveUsersToStorage(users: BotUser[]) {
  localStorage.setItem("bot_users", JSON.stringify(users));
}

// Compute dashboard statistics based on filter dates and user list
export function calculateStats(users: BotUser[], startDateStr?: string, endDateStr?: string): DashboardStats {
  let filtered = [...users];

  if (startDateStr) {
    const start = new Date(startDateStr);
    filtered = filtered.filter(u => new Date(u.created_at) >= start);
  }
  if (endDateStr) {
    // Set to end of day
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter(u => new Date(u.created_at) <= end);
  }

  const total = filtered.length;
  const active = filtered.filter(u => u.is_active).length;
  const unsubscribed = total - active;
  const conversion_rate = total > 0 ? Math.round((active / total) * 100) : 0;

  // Calculate tag counts
  const tagMap: { [key: string]: number } = {};
  filtered.forEach(u => {
    u.tags.forEach(t => {
      tagMap[t] = (tagMap[t] || 0) + 1;
    });
  });

  const tags = Object.keys(tagMap).map(tag => ({
    tag,
    count: tagMap[tag]
  })).sort((a, b) => b.count - a.count);

  return {
    total_users: total,
    active_users: active,
    unsubscribed,
    conversion_rate,
    tags
  };
}
