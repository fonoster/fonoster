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
import { z } from "zod";
import { CallStatus } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const CallRequestSchema = z.object({
  from: z.string(),
  to: z.string(),
  appUrl: z.string()
});

type CallRequest = z.infer<typeof CallRequestSchema>;

type CallResponse = {
  ref: string;
  status: CallStatus;
};

type CallStream = {
  write: (data: CallResponse) => void;
  end: () => void;
};

function makeCall() {
  return async (call: { request: CallRequest }) => {
    const stream = call as unknown as CallStream;
    const { from, to, appUrl } = call.request;

    logger.verbose("call makeCall method", { from, to, appUrl });

    stream.write({ ref: "123", status: CallStatus.USER_BUSY });
    stream.write({ ref: "123", status: CallStatus.NO_ANSWER });

    stream.end();
  };
}

export { makeCall };
