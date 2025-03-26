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
import { BaseModelParams } from "../types";

enum GoogleModel {
  GEMINI_2_0_FLASH = "gemini-2.0-flash",
  GEMINI_2_0_FLASH_LITE = "gemini-2.0-flash-lite",
  GEMINI_2_0_PRO_EXP_02_05 = "gemini-2.0-pro-exp-02-05"
}

type GoogleParams = BaseModelParams & {
  model: GoogleModel;
  apiKey: string;
  maxTokens: number;
  temperature: number;
};

export { GoogleModel, GoogleParams };
