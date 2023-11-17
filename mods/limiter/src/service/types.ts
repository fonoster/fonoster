/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { UserStatus } from "@fonoster/users/dist/service/types";

export enum TimeUnit {
  DAY = "day",
  MONTH = "month"
}

export interface Limit {
  path: string;
  resource: string;
  limit: number;
  timeUnit?: TimeUnit;
}

export interface Limiter {
  name: string;
  allowedStatus: UserStatus;
  limits: Limit[];
}

export interface RedisClient {
  get(key: string): Promise<string>;
  smembers(key: string): Promise<string[]>;
}

export interface RoutrClient {
  connect: () => Promise<RoutrClient>;
  resourceType: (resourceType: string) => RoutrClient;
  list: (
    { itemsPerPage: number },
    id: string
  ) => Promise<{ meta: { totalItems: number } }>;
}

export enum RESOURCE {
  PROVIDER = "provider",
  PROVIDER_ALIAS = "gateways",
  AGENT = "agent",
  DOMAIN = "domain",
  PROJECT = "project",
  NUMBER = "number"
}

export const ROUTR_RESOURCES = [
  RESOURCE.AGENT,
  RESOURCE.DOMAIN,
  RESOURCE.NUMBER,
  RESOURCE.PROVIDER
];
