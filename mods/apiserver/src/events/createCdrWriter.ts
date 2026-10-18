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
import { CALL_DETAIL_RECORD_MEASUREMENT } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Point } from "@influxdata/influxdb-client";
import { CallRefStore } from "./callRefs";
import { transformEvent } from "./transformEvent";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type FonosterEvent = {
  name: "cdr" | "error";
  tag: string;
  data: Record<string, unknown>;
};

/**
 * Builds the InfluxDB point of one call event. A call's fields arrive across several events and
 * not every one carries "ref" (e.g. an update with just endedAt/status). Every point of a call must
 * share the same tag set for pivot to merge them into one record, so the call's ref is kept in a
 * store shared by the replicas (CallRefStore) and reapplied to every later point.
 */
function createCdrWriter(deps: {
  refs: CallRefStore;
  write(point: Point): void;
  /** How long an event without a ref waits for the call's first event (another replica). */
  missRetryMs?: number;
}) {
  const retryMs = deps.missRetryMs ?? 200;
  return async (event: FonosterEvent) => {
    const point = new Point(event.name).tag("callId", event.tag);

    let ref = event.data.ref ? String(event.data.ref) : undefined;
    try {
      if (ref) await deps.refs.set(event.tag, ref);
      else {
        // The call's first event may still be in flight on another replica: retry briefly.
        for (let i = 0; i < 3 && !ref; i++) {
          if (i) await new Promise((r) => setTimeout(r, retryMs));
          ref = await deps.refs.get(event.tag);
        }
      }
    } catch (e) {
      logger.warn(`call refs: ${(e as Error).message}`);
    }

    if (ref) point.tag("ref", ref);

    Object.entries(event.data).forEach(([key, value]) => {
      if (key === "ref" || value === undefined || value === null) {
        return;
      } else if (typeof value === "number") {
        point.intField(key, value); // Or floatField for floating-point numbers
      } else if (typeof value === "boolean") {
        point.booleanField(key, value);
      } else if (key === "startedAt" || key === "endedAt") {
        point.stringField(key, new Date(String(value)).getTime());
      } else {
        point.stringField(key, String(value));
      }
    });

    deps.write(point);
    return point;
  };
}

/** The CDR handler for one Routr call event (`routr.call.*`). */
function createCallEventHandler(deps: {
  refs: CallRefStore;
  write(point: Point): void;
}) {
  const writeCdr = createCdrWriter(deps);
  return (event: Record<string, unknown>) =>
    writeCdr({
      name: CALL_DETAIL_RECORD_MEASUREMENT as "cdr",
      tag: event.callId as string,
      data: transformEvent(event)
    });
}

export { createCallEventHandler, createCdrWriter, FonosterEvent };
