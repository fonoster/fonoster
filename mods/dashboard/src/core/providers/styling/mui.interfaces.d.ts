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
import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface PaletteOptions {
    base: {
      "01": string;
      "02": string;
      "03": string;
      "04": string;
      "05": string;
      "06": string;
      "07": string;
      "08": string;
      main: string;
    };
    brand: {
      "01": string;
      "02": string;
      "03": string;
      "04": string;
      "05": string;
      "06": string;
      "07": string;
      main: string;
    };
  }
  interface Palette {
    base: {
      "01": string;
      "02": string;
      "03": string;
      "04": string;
      "05": string;
      "06": string;
      "07": string;
      "08": string;
      main: string;
    };
    brand: {
      "01": string;
      "02": string;
      "03": string;
      "04": string;
      "05": string;
      "06": string;
      "07": string;
      main: string;
    };
  }
}
