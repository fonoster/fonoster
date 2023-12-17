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
export const APISERVER_ASTERISK_ARI_INTERNAL_URL =
  process.env.APISERVER_ASTERISK_ARI_INTERNAL_URL || "http://asterisk:8088";
export const APISERVER_ASTERISK_ARI_USERNAME =
  process.env.APISERVER_ASTERISK_ARI_USERNAME;
export const APISERVER_ASTERISK_ARI_SECRET =
  process.env.APISERVER_ASTERISK_ARI_SECRET;
export const APISERVER_ASTERISK_TRUNK =
  process.env.APISERVER_ASTERISK_TRUNK || "routr";
export const APISERVER_ASTERISK_CONTEXT =
  process.env.APISERVER_ASTERISK_CONTEXT || "local-ctx";
export const APISERVER_ASTERISK_EXTENSION =
  process.env.APISERVER_ASTERISK_EXTENSION || "s";
