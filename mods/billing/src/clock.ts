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

/** Where the billing service reads time from (add-billing-service D10). */
export type Clock = { now(): Date };

export const systemClock: Clock = { now: () => new Date() };

/** A clock that only moves when told to (tests). */
export class ManualClock implements Clock {
  constructor(private at: Date) {}
  now() {
    return new Date(this.at);
  }
  set(at: Date) {
    this.at = at;
  }
}
