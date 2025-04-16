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
  cssVariables: {
    cssVarPrefix: "fonoster"
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          "50": "#FFFFFF",
          "100": "#E6FFF5",
          "200": "#CCEFE1",
          "500": "#39E19E",
          "700": "#008751",
          "800": "#053204",
          "900": "#011900"
        },
        background: {
          default: "#FFFFFF",
          paper: "#FFFFFF"
        }
      }
    },
    dark: {
      palette: {
        primary: {
          "50": "#0A1F15",
          "100": "#0F2E20",
          "200": "#164A35",
          "500": "#39E19E",
          "700": "#2AAA78",
          "800": "#1D7D57",
          "900": "#0F4A33"
        },
        background: {
          default: "#0A1F15",
          paper: "#0A1F15"
        }
      }
    }
  }
});
