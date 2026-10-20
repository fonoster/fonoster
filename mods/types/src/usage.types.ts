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
/** A dimension usage totals can be grouped by (usage.proto). */
type UsageGroupBy =
  | "day"
  | "workspace"
  | "meter"
  | "provider"
  | "model"
  | "key_source"
  | "origin";

type GetUsageRequest = {
  /** YYYY-MM-DD (UTC), inclusive. */
  fromDay: string;
  /** YYYY-MM-DD (UTC), inclusive. */
  toDay: string;
  /** Totals are always split by meter. */
  groupBy?: UsageGroupBy[];
  /** Owners only: every workspace the caller owns. */
  allOwned?: boolean;
};

/** One usage total: quantities only, never money. Unrequested dimensions are empty. */
type UsageRow = {
  day: string;
  workspaceRef: string;
  meter: string;
  /** second, character, token, count or byte */
  unit: string;
  provider: string;
  model: string;
  /** platform or workspace; empty for meters that call no vendor */
  keySource: string;
  /** call, browser_test, eval or api */
  origin: string;
  quantity: number;
};

type GetUsageResponse = {
  rows: UsageRow[];
};

export { GetUsageRequest, GetUsageResponse, UsageGroupBy, UsageRow };
