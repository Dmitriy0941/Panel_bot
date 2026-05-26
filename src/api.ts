/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BotUser } from "./types";

// Get base URL from localStorage or configuration
export function getApiBaseUrl(): string {
  const customUrl = localStorage.getItem("custom_api_url");
  if (customUrl) return customUrl.trim();
  const env = (import.meta as any).env || {};
  return (env.VITE_API_BASE_URL || "https://api.antonovdv.ru").trim();
}

// Update base URL
export function setApiBaseUrl(url: string) {
  if (!url || url.trim() === "") {
    localStorage.removeItem("custom_api_url");
  } else {
    // Add protocol if missing
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }
    localStorage.setItem("custom_api_url", targetUrl);
  }
}

// Real login authentication using FastAPI OAuth2 token endpoint
export async function loginReal(username: string, password: string): Promise<string> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}/api/auth/login`;

  // FastAPI expects form-urlencoded body for OAuth2 Password Flow
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!res.ok) {
    let errMsg = `Ошибка входа (Код: ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch (e) {}
    throw new Error(errMsg);
  }

  const data = await res.json();
  if (data && data.access_token) {
    localStorage.setItem("bot_admin_token", data.access_token);
    return data.access_token;
  }
  throw new Error("Неверный формат ответа авторизации от сервера.");
}

// Core request builder with CORS and auth header
async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}${path}`;
  const token = localStorage.getItem("bot_admin_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  } as any;

  // 10 seconds timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      // Clean stale/expired token to prevent endless auth loops
      localStorage.removeItem("bot_admin_token");
      throw new Error("Не авторизован под токеном доступа (401/403). Пожалуйста, выйдите и войдите заново.");
    }

    if (!res.ok) {
      let errMsg = `Сервер вернул ошибку ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          errMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (e) {}
      throw new Error(errMsg);
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    return await res.text();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Сервер не отвечает (Таймаут). Проверьте активность admin_api.py на вашем VPS.");
    }
    throw err;
  }
}

// Test connectivity by pinging the base URL api
export async function testConnection(url: string = getApiBaseUrl()): Promise<boolean> {
  const targetUrl = url.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    // Ping openapi or docs since they don't require authorization
    const res = await fetch(`${targetUrl}/openapi.json`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.status === 200;
  } catch (e) {
    clearTimeout(timeoutId);
    return false;
  }
}

// 1. Load users from FastAPI
export async function fetchUsersReal(): Promise<BotUser[]> {
  const data = await apiRequest("/api/users?limit=1000");
  
  // Format response data to match BotUser interface if keys differ
  if (Array.isArray(data)) {
    return data.map((u: any, idx: number) => ({
      id: u.id || String(u.user_id || idx),
      user_id: Number(u.user_id),
      first_name: u.first_name || "Без имени",
      username: u.username || undefined,
      is_active: u.is_active !== undefined ? u.is_active : true,
      tags: Array.isArray(u.tags) ? u.tags : [],
      created_at: u.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19),
    }));
  }
  return [];
}

export interface MailingPayload {
  text: string;
  target: "all" | "tags" | "users";
  tags?: string[];
  user_ids?: number[];
}

// 2. Toggle active status
export async function toggleUserActiveReal(user_db_id: string, user_id: number, is_active: boolean): Promise<any> {
  return await apiRequest(`/api/users/${user_id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
}

// 3. Delete user
export async function deleteUserReal(user_db_id: string, user_id: number): Promise<any> {
  return await apiRequest(`/api/users/${user_id}`, {
    method: "DELETE",
  });
}

// 4. Send mass broadcast (Mailing) to TG users with targeted filters
export async function sendMailingReal(payload: MailingPayload): Promise<{ success: boolean; message?: string }> {
  return await apiRequest("/api/mailing", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 4.1 Update user tags and active state
export async function updateUserReal(user_id: number, tags: string[], is_active?: boolean): Promise<any> {
  return await apiRequest(`/api/users/${user_id}`, {
    method: "PATCH",
    body: JSON.stringify({
      tags,
      ...(is_active !== undefined ? { is_active } : {}),
    }),
  });
}

// 5. Bulk Import users via CSV to FastAPI
export async function importUsersReal(users: BotUser[]): Promise<any> {
  return { success: true, message: "Используйте интерфейс загрузки CSV для импорта." };
}
