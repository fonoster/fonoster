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
import { getLogger } from "@fonoster/logger";

const logger = getLogger({ service: "billing", filePath: __filename });

/** Things the owner is told about (billing "Top-ups and auto-recharge"). */
export type NoticeKind =
  | "auto_recharge_disabled"
  | "authentication_required"
  | "topup_failed"
  | "payment_failed";

export type Notifier = {
  notify(
    ownerRef: string,
    kind: NoticeKind,
    data?: Record<string, unknown>
  ): void;
};

/** Logs notices; the delivery to the owner (email, dashboard) comes with the Billing page. */
export const logNotifier: Notifier = {
  notify: (ownerRef, kind, data) =>
    logger.info(`notice for ${ownerRef}: ${kind}`, data ?? {})
};
