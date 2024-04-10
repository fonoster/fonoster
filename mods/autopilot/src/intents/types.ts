/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
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
import { Effect } from "../cerebro/types";

export interface Intent {
  ref: string;
  effects: Effect[];
  confidence: number;
}

export interface IntentsEngine {
  setProjectId: (id: string) => void;
  findIntent: (
    text: string,
    payload?: Record<string, unknown>
  ) => Promise<Intent>;
  findIntentWithEvent?: (
    name: string,
    payload?: Record<string, unknown>
  ) => Promise<Intent>;
}

export interface DialogFlowESConfig {
  projectId: string;
  languageCode: string;
  platform: string;
  credentials: Record<string, string>;
}

export interface DialogFlowCXConfig {
  projectId: string;
  languageCode: string;
  location: string;
  agent: string;
  platform: string;
  credentials: Record<string, string>;
}
