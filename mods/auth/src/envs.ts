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
export const APISERVER_JWT_PRIVATE_KEY = process.env.APISERVER_JWT_PRIVATE_KEY;
export const APISERVER_JWT_AUTH_ISS = process.env.APISERVER_JWT_AUTH_ISS;
export const APISERVER_ENDPOINT = process.env.APISERVER_ENDPOINT;
export const APISERVER_RBAC_CONFIG =
  process.env.APISERVER_RBAC_CONFIG || "/home/fonoster/rbac.json";
