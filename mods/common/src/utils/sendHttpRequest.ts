/*
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
import { z } from "zod";

const responseSchema = z.object({
  result: z.string()
});

const logger = getLogger({ service: "autopilot", filePath: __filename });

enum AllowedHttpMethod {
  GET = "get",
  POST = "post"
}

async function sendHttpRequest(params: {
  method: AllowedHttpMethod;
  url: string;
  waitForResponse: boolean;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}): Promise<{ result: string }> {
  const { url, method, body, headers, waitForResponse } = params;
  const effectiveMethod = method.toLowerCase() as "get" | "post";

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: effectiveMethod === "post" ? JSON.stringify(body) : undefined
  };

  logger.verbose(`sending request to ${url}`, {
    body,
    method: effectiveMethod
  });

  if (waitForResponse && effectiveMethod === "post") {
    setTimeout(() => fetch(url, options), 0);
    return { result: "request sent" };
  } else {
    const response = await fetch(url, options);
    const data = await response.json();

    try {
      return responseSchema.parse(data) as { result: string };
    } catch (error) {
      throw new Error(
        `Invalid response: expected ${JSON.stringify(responseSchema, null, 2)}, got ${JSON.stringify(data, null, 2)}`
      );
    }
  }
}

export { sendHttpRequest, AllowedHttpMethod };
