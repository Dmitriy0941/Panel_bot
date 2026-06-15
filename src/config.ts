/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Базовый URL вашего Python FastAPI сервера (admin_api.py)
// 1. В локальной разработке: "http://localhost:8000"
// 2. В Netlify вы можете добавить переменную окружения VITE_API_BASE_URL в панели управления Netlify settings.
const env = (import.meta as any).env || {};

// Базовый URL вашего Python FastAPI сервера (admin_api.py)
// Мы прописали ваш домен https://api.antonovdv.ru по умолчанию!
export const API_BASE_URL = env.VITE_API_BASE_URL || window.location.origin;

// Вспомогательный флаг: использовать ли реальный сервер или интерактивный мок-режим
export const USE_REAL_API = true;
