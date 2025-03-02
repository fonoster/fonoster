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
import { homedir } from "os";
import { join } from "path";

export const BASE_DIR = join(homedir(), ".fonoster");
export const CONFIG_FILE = join(homedir(), ".fonoster", "config.json");
export const FONOSTER_ACCESS_CONTROL_LIST = ["165.22.7.155/32"]; // TODO: We will need to allow passing this as a parameter
export const FONOSTER_ORIGINATION_URI_BASE = "pstn.fonoster.com";
export const TWILIO_PSTN_URI_BASE = "pstn.twilio.com";
export const WORKSPACE_ENDPOINT = "api.fonoster.com";
