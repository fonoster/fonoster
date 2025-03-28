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
import * as SDK from "@fonoster/sdk";
import { z } from "zod";
import { CreateCallBatchSchema } from "../schemas";

/**
 * Creates multiple calls from Fonoster in a batch with the same from number and application
 * @param client The Fonoster client
 * @returns A function that creates multiple calls in a batch
 */
export function createCreateCallBatch(client: SDK.Client) {
  return async function createCallBatch(
    params: z.infer<typeof CreateCallBatchSchema>
  ) {
    const calls = new SDK.Calls(client);

    const validatedParams = CreateCallBatchSchema.parse(params);
    const { from, to_array, app_ref, timeout, calls_per_minute } =
      validatedParams;
    const batchId = Date.now().toString();

    const createSingleCall = (to: string) =>
      calls.createCall({
        from,
        to,
        appRef: app_ref,
        timeout
      });

    const delayBetweenCalls = Math.ceil(60000 / calls_per_minute);
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    (async () => {
      const destinations = [...to_array];

      while (destinations.length > 0) {
        const to = destinations.shift();

        createSingleCall(to).catch((error) => {
          console.error(`Failed to create call to ${to}: ${error.message}`);
        });

        if (destinations.length > 0) {
          await delay(delayBetweenCalls);
        }
      }
    })();

    return {
      content: [
        {
          type: "text" as const,
          text:
            `Batch of ${to_array.length} calls from ${from} initiated with ID: ${batchId}. ` +
            `Calls are being processed asynchronously at a rate of ${calls_per_minute} calls per minute.`
        }
      ]
    };
  };
}
