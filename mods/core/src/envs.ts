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
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = process.env.REDIS_PORT || "6379";
export const REDIS_SECRET = process.env.REDIS_SECRET;
export const APISERVER_ROUTR_API_HOST = process.env.APISERVER_ROUTR_API_HOST;
export const APISERVER_ROUTR_API_PORT =
  process.env.APISERVER_ROUTR_API_PORT || "4567";
export const APISERVER_ROUTR_API_USERNAME =
  process.env.APISERVER_ROUTR_API_USERNAME;
export const APISERVER_ROUTR_API_SECRET =
  process.env.APISERVER_ROUTR_API_SECRET;
