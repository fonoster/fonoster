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
import { Box } from "@mui/material";
import { Typography } from "../../design-system/ui/typography/typography";
import { Switch } from "../../design-system/ui/switch/switch";
import { useThemeMode } from "~/core/providers/styling/mui.provider";

export const ThemeSwitch = () => {
  const { isDarkMode, changeTheme } = useThemeMode();

  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    changeTheme(event.target.checked ? "dark" : "light");
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%"
      }}
    >
      <Box>
        <Typography variant="body-medium" sx={{ fontWeight: 600 }}>
          Dark Mode
        </Typography>
        <Typography variant="body-small" color="text.secondary">
          Switch between light and dark theme
        </Typography>
      </Box>
      <Switch value={isDarkMode} onChange={handleThemeChange} />
    </Box>
  );
};

ThemeSwitch.displayName = "ThemeSwitch";
