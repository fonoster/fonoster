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
import { IconButton, Tooltip } from "@mui/material";
import { Icon } from "../../design-system/icons/icons";
import { useThemeMode } from "~/core/providers/styling/mui.provider";

export const ThemeToggle = () => {
  const { isDarkMode, changeTheme } = useThemeMode();

  return (
    <Tooltip title={isDarkMode ? "Switch to light" : "Switch to dark"}>
      <IconButton
        onClick={() => changeTheme(isDarkMode ? "light" : "dark")}
        sx={{ fontSize: 18, color: "base.02" }}
        aria-label="Toggle color scheme"
      >
        <Icon name={isDarkMode ? "LightMode" : "DarkMode"} fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
};

ThemeToggle.displayName = "ThemeToggle";
