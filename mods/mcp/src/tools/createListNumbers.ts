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
import { ListNumbersSchema } from "../schemas";

/**
 * Lists numbers from Fonoster
 * @param client The Fonoster client
 * @returns A function that lists numbers
 */
export function createListNumbers(client: SDK.Client) {
  return async function listNumbers(params: z.infer<typeof ListNumbersSchema>) {
    const numbers = new SDK.Numbers(client);

    const response = await numbers.listNumbers({
      pageSize: params.page_size,
      pageToken: params.page_token
    });

    return {
      content: response.items.map((app) => ({
        type: "text" as const,
        text: JSON.stringify({
          ref: app.ref,
          name: app.name,
          telUrl: app.telUrl
        })
      }))
    };
  };
}
