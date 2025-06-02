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
  palette: {
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
      "02": "#E6FFF5",
      "03": "#CCEFE1",
      "04": "#39E19E",
      "05": "#008751",
      "06": "#053204",
      "07": "#011900",
      main: "#39E19E"
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF"
    }
  }
});
