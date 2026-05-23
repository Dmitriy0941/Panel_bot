/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BotUser {
  id: string; // SQLite ID or Telegram ID
  user_id: number; // Telegram UID
  first_name?: string;
  username?: string;
  is_active: boolean; // subscribed vs blocked
  tags: string[];
  created_at: string; // ISO date or formatted
}

export interface TagStat {
  tag: string;
  count: number;
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  unsubscribed: number;
  conversion_rate?: number; // active / total %
  tags: TagStat[];
}

export interface ConfigSettings {
  bot_token?: string;
  channel_username?: string;
  admin_id?: string;
  welcome_message?: string;
}
