/*
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
import React, { useCallback, useMemo } from "react";
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "@emotion/cache";
import { ThemeProvider as MaterialThemeProvider } from "@mui/material/styles";
import { theme as DEFAULT_THEME } from "./mui.theme";
import { CssBaseline, useColorScheme, type Theme } from "@mui/material";

const MODE_STORAGE_KEY = "fonoster:theme";
const DEFAULT_MODE = "light";
const cache = createEmotionCache({
  key: "fonoster-styles-cache",
  prepend: true
});

export interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: Theme;
}

export const ThemeProvider = ({ children, theme }: ThemeProviderProps) => {
  return (
    <CacheProvider value={cache}>
      <MaterialThemeProvider
        theme={theme || DEFAULT_THEME}
        defaultMode={DEFAULT_MODE}
        modeStorageKey={MODE_STORAGE_KEY}
      >
        <CssBaseline enableColorScheme />
        {children}
      </MaterialThemeProvider>
    </CacheProvider>
  );
};

export const useThemeMode = () => {
  const { mode, setMode } = useColorScheme();

  const isDarkMode = useMemo(() => mode === "dark", [mode]);

  const changeTheme = useCallback(
    (newMode: "light" | "dark") => {
      setMode(newMode);
    },
    [setMode]
  );

  return { isDarkMode, changeTheme, mode: mode || DEFAULT_MODE };
};
