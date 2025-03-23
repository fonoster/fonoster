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
import { CreateCallSchema } from "../schemas";

/**
 * Creates a call from Fonoster
 * @param client The Fonoster client
 * @returns A function that creates a call
 */
export function createCreateCall(client: SDK.Client) {
  return async function createCall(params: z.infer<typeof CreateCallSchema>) {
    const calls = new SDK.Calls(client);
    const call = await calls.createCall({
      from: params.from,
      to: params.to,
      appRef: params.app_ref,
      timeout: params.timeout
    });

    return {
      content: [
        { type: "text" as const, text: `Call created with REF: ${call.ref}` }
      ]
    };
  };
}
