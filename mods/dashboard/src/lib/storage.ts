/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * localStorage that never throws: private windows, blocked site data and
 * quota errors all behave like an empty store.
 */
export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignored: the value just won't survive a reload.
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignored.
    }
  },
  getJson<T>(key: string): T | null {
    const raw = storage.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJson(key: string, value: unknown) {
    storage.set(key, JSON.stringify(value));
  }
};

/*
 * Nothing token-like is stored (M4): the session lives in memory and in an
 * httpOnly cookie. Older dashboards stored it under this key; the dashboard
 * removes it on load.
 */
export const LEGACY_SESSION_KEY = "fonoster.session";

export const STORAGE_KEYS = {
  workspace: "fonoster.workspace",
  nav: "fonoster.nav",
  theme: "fonoster.theme"
} as const;
