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
import { useEffect, useSyncExternalStore } from "react";
import { STORAGE_KEYS, storage } from "./storage";

export type ThemePreference = "dark" | "light" | "system";

function resolve(preference: ThemePreference): "dark" | "light" {
  if (preference !== "system") return preference;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function readThemePreference(): ThemePreference {
  const stored = storage.get(STORAGE_KEYS.theme);
  return stored === "light" || stored === "system" ? stored : "dark";
}

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function apply(preference: ThemePreference) {
  document.documentElement.dataset.theme = resolve(preference);
}

function setThemePreference(preference: ThemePreference) {
  storage.set(STORAGE_KEYS.theme, preference);
  apply(preference);
  listeners.forEach((listener) => listener());
}

/**
 * The theme preference, applied to <html data-theme> (public/theme.js sets it
 * before paint). Every caller shares one preference; mount it once in the
 * shell so "system" keeps following the OS wherever the user is.
 */
export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readThemePreference);

  useEffect(() => {
    apply(preference);
    if (preference !== "system") return;
    const query = window.matchMedia?.("(prefers-color-scheme: light)");
    const follow = () => apply("system");
    query?.addEventListener("change", follow);
    return () => query?.removeEventListener("change", follow);
  }, [preference]);

  return { preference, setPreference: setThemePreference };
}
