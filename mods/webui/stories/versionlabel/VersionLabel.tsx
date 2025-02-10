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
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export const VersionLabel = ({ children }: { children: string }) => {
  const theme = useTheme();

  return (
    <Typography
      sx={{
        color: theme.palette.grey[500],
        fontFamily: "Roboto Mono",
        fontSize: "10px",
        fontStyle: "normal",
        fontWeight: 500,
        lineHeight: "21px",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        fontFeatureSettings: "'liga' off, 'clig' off"
      }}
    >
      {children}
    </Typography>
  );
};
