/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { status } from "@grpc/grpc-js";
import { z } from "zod";
import {
  CallStatus,
  CallStream,
  TrackCallResponse,
  TrackCallSubscriber
} from "./types";

const FINAL_STATUSES = [
  CallStatus.COMPLETED,
  CallStatus.FAILED,
  CallStatus.BUSY,
  CallStatus.NO_ANSWER,
  CallStatus.CANCELED,
  CallStatus.REJECTED,
  CallStatus.TIMEOUT,
  CallStatus.UNKNOWN
];

const logger = getLogger({ service: "apiserver", filePath: __filename });

const TrackCallRequestSchema = z.object({
  ref: z.string()
});

type TrackCallRequest = z.infer<typeof TrackCallRequestSchema>;

function trackCall(subs: TrackCallSubscriber) {
  return (call: { request: TrackCallRequest }) => {
    const stream = call as unknown as CallStream;
    const { events } = subs;
    const { ref } = call.request;

    logger.verbose("call to trackCall", { ref });

    stream.write({ ref, status: CallStatus.QUEUED });

    events.on("status", (data: TrackCallResponse) => {
      logger.verbose("tracked call status change", { ...data });

      if (data instanceof Error) {
        logger.error("tracked call status change error", { ...data });

        stream.write({ code: status.INTERNAL, message: data.message });
        stream.end();

        return;
      }

      if (data.ref === ref) {
        stream.write(data);

        if (FINAL_STATUSES.includes(data.status)) {
          stream.end();
        }
      }
    });
  };
}

export { trackCall };
