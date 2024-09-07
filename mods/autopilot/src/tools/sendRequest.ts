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
import { z } from "zod";
import { AllowedOperations } from "./ToolSchema";

const responseSchema = z.object({
  result: z.string()
});

async function sendRequest(input: {
  method: AllowedOperations;
  url: string;
  waitForResponse: boolean;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}): Promise<{ result: string }> {
  const { url, method, body, headers, waitForResponse } = input;

  const options = {
    method,
    headers,
    body: method === AllowedOperations.POST ? JSON.stringify(body) : undefined
  };

  if (waitForResponse && method === AllowedOperations.POST) {
    setTimeout(() => fetch(url, options), 0);
    return { result: "request sent" };
  } else {
    const response = await fetch(url, options);
    const data = await response.json();

    return responseSchema.parse(data);
  }
}

export { sendRequest };
