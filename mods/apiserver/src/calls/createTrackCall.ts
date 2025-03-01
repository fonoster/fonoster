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
  DialStatus,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject } from "@fonoster/types";
import { NatsConnection } from "nats";
import { CALLS_TRACK_CALL_SUBJECT } from "../envs";
import { CallStream, TrackCallResponse } from "./types";

const FINAL_STATUSES = [
  DialStatus.BUSY,
  DialStatus.FAILED,
  DialStatus.NOANSWER
];

const logger = getLogger({ service: "apiserver", filePath: __filename });

function createTrackCall(nc: NatsConnection) {
  const trackingCallsMap = new Map<string, CallStream>();
  const subscription = nc.subscribe(CALLS_TRACK_CALL_SUBJECT);

  subscription.callback = (err, msg) => {
    // We can't do much more than log the error
    if (err) {
      logger.error("call to subscription.callback", { err });
      return;
    }

    const { ref, status } = msg?.json() as TrackCallResponse;

    logger.verbose("call to subscription.callback", { ref, status });

    const stream = trackingCallsMap.get(ref);

    if (!stream) {
      // There is not request to track this call
      return;
    }

    if (FINAL_STATUSES.includes(status)) {
      stream.write({ ref, status });

      setTimeout(() => stream.end(), 500);

      trackingCallsMap.delete(ref);
    } else {
      stream.write({ ref, status });
    }
  };

  const trackCall = (call: { request: BaseApiObject }) => {
    const stream = call as unknown as CallStream;
    const { ref } = call.request;

    logger.verbose("call to trackCall", { ref });

    trackingCallsMap.set(ref, stream);
  };

  return withErrorHandlingAndValidation(trackCall, V.baseApiObjectSchema);
}

export { createTrackCall };
