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
import { create } from "@storybook/theming/create";

export default create({
  base: "light",
  brandTitle: "Fonoster Design System",
  brandUrl: "https://fonoster.com",
  brandTarget: "_self",

  colorPrimary: "#39E19E",
  colorSecondary: "#053204",

  // UI
  appBg: "#ffffff",
  appContentBg: "#ffffff",
  appBorderColor: "#E5E5E5",
  appBorderRadius: 8,

  // Typography
  fontBase: '"Inter", sans-serif',
  fontCode: "monospace",

  // Text colors
  textColor: "#1A1A1A",
  textInverseColor: "#ffffff",

  // Toolbar default and active colors
  barTextColor: "#1A1A1A",
  barSelectedColor: "#39E19E",
  barBg: "#ffffff",

  // Form colors
  inputBg: "#ffffff",
  inputBorder: "#E5E5E5",
  inputTextColor: "#1A1A1A",
  inputBorderRadius: 8,
});


