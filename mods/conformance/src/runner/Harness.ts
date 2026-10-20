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
import {
  CallerAction,
  ControlAction,
  Providers,
  Setup,
  StripeAction
} from "../scenario/types";

/**
 * What a runner needs from the fakes around the implementation under test. Every member is
 * optional: a scenario that uses a capability the harness lacks fails with a clear reason
 * instead of passing silently.
 */
export interface Harness {
  /** Applies `setup` before the first step. */
  setup?(setup: Setup): Promise<void>;
  /** Changes fake provider behaviour (`inject` steps). */
  inject?(providers: Providers): Promise<void>;
  /**
   * Total fake-provider delay, in ms, that overlaps [from, to]. Used by `budget_ms` to measure
   * the implementation's own added time.
   */
  providerDelayBetween?(from: number, to: number): number;
  /**
   * Measures a named assertion (`assert` steps). `since` is the end of the previous step.
   * Returns undefined when the harness does not know the name.
   */
  measure?(name: string, since: number): Promise<unknown> | unknown;
  /** Acts as the caller (`caller` steps): keypresses, speech, hangup. */
  caller?(action: CallerAction): Promise<void> | void;
  /** Acts on the implementation's management side (`control` steps), e.g. enroll a region. */
  control?(action: ControlAction): Promise<void> | void;
  /** Sets the Stripe fake's state and failures (`stripe` steps, billing). */
  stripe?(action: StripeAction): Promise<void> | void;
  /** Extra variables available to every scenario, such as `media` (base URL of test media). */
  vars?(): Record<string, unknown>;
}
