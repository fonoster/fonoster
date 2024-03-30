/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
export const APISERVER_AUTOPILOT_PORT = process.env.APISERVER_AUTOPILOT_PORT
  ? parseInt(process.env.APISERVER_AUTOPILOT_PORT)
  : 6445;
export const APISERVER_AUTOPILOT_DEFAULT_LANGUAGE_CODE =
  process.env.APISERVER_AUTOPILOT_DEFAULT_LANGUAGE_CODE || "en-US";
export const APISERVER_AUTOPILOT_MEDIA_BUSY_MESSAGE =
  process.env.APISERVER_AUTOPILOT_MEDIA_BUSY_MESSAGE;
export const APISERVER_AUTOPILOT_MEDIA_NOANSWER_MESSAGE =
  process.env.APISERVER_AUTOPILOT_MEDIA_NOANSWER_MESSAGE;
