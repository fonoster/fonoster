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
import { Usage } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { NatsConnection, StringCodec } from "nats";
import { usageSubject } from "./runUsageConsumer";

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

let bus: NatsConnection | undefined;

/** The apiserver's bus connection, once connected: usage outside a call is published on it. */
export function attachUsagePublisher(nc: NatsConnection) {
  bus = nc;
}

/** Publishes usage events on `usage.<workspace>.<meter>`, where the USAGE stream keeps them (D5). */
export function publishUsage(events: Usage.UsageEvent[]) {
  if (!bus) {
    logger.warn(`${events.length} usage events dropped: no bus connection yet`);
    return;
  }
  events.forEach((e) =>
    bus!.publish(
      usageSubject(e.workspaceRef, e.meter),
      sc.encode(JSON.stringify(e))
    )
  );
}

/**
 * An eval's model usage (origin eval). Evals run in the control plane, so they are attributed to
 * the public default region; each line's id comes from the eval run and request.
 */
export function reportEvalUsage(
  workspaceRef: string,
  lines: Usage.UsageLine[],
  scope: string
) {
  const occurredAt = new Date().toISOString();
  publishUsage(
    lines.map((line) => ({
      ...line,
      id: Usage.usageId(scope, line),
      workspaceRef,
      region: "default",
      regionKind: "public",
      origin: "eval",
      occurredAt
    }))
  );
}
