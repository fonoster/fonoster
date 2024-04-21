/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
export const ROUTR_API_ENDPOINT =
  process.env.ROUTR_API_ENDPOINT || "localhost:51908";
export const ROUTR_DEFAULT_PEER_NAME =
  process.env.ROUTR_DEFAULT_PEER_NAME || "Voice Autopilot";
export const ROUTR_DEFAULT_PEER_USERNAME =
  process.env.ROUTR_DEFAULT_PEER_USERNAME || "voice";
export const ROUTR_DEFAULT_PEER_AOR =
  process.env.ROUTR_DEFAULT_PEER_AOR || "sip:voice@default";
export const ROUTR_DEFAULT_PEER_PASSWORD =
  process.env.ROUTR_DEFAULT_PEER_PASSWORD || "changeme";
