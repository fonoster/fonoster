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
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        bg: {
          app: "#FFFFFF",
          surface: "#FFFFFF",
          muted: "#F4F4F4"
        },
        base: {
          "08": "#FFFFFF",
          "07": "#F4F4F4",
          "06": "#E8E8E8",
          "05": "#C2C2C2",
          "04": "#8D8D8D",
          "03": "#555555",
          "02": "#333333",
          "01": "#252525",
          main: "#8D8D8D"
        },
        brand: {
          "01": "#FFFFFF",
          "02": "#E8EEFF",
          "03": "#C5D2FF",
          "04": "#4C6FFF",
          "05": "#2F4FD6",
          "06": "#1A2A6B",
          "07": "#0C1018",
          main: "#4C6FFF"
        },
        background: {
          default: "#FFFFFF",
          paper: "#FFFFFF"
        }
      }
    },
    dark: {
      palette: {
        bg: {
          app: "#0C1018",
          surface: "#141A24",
          muted: "#1B2330"
        },
        base: {
          "01": "#FFFFFF",
          "02": "#F4F4F4",
          "03": "#E8E8E8",
          "04": "#C2C2C2",
          "05": "#8D8D8D",
          "06": "#555555",
          "07": "#333333",
          "08": "#252525",
          main: "#C2C2C2"
        },
        brand: {
          "07": "#FFFFFF",
          "06": "#E8EEFF",
          "05": "#C5D2FF",
          "04": "#4C6FFF",
          "03": "#2F4FD6",
          "02": "#1A2A6B",
          "01": "#0C1018",
          main: "#6EA8FF"
        },
        background: {
          default: "#0C1018",
          paper: "#141A24"
        }
      }
    }
  }
});
