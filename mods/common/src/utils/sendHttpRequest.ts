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
import { URLSearchParams } from "url";
import { getLogger } from "@fonoster/logger";
import { z } from "zod";

const responseSchema = z.object({
  result: z.string()
});

const logger = getLogger({ service: "common", filePath: __filename });

enum AllowedHttpMethod {
  GET = "get",
  POST = "post"
}

async function sendHttpRequest(request: {
  method: AllowedHttpMethod;
  url: string;
  waitForResponse: boolean;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}): Promise<{ result: string }> {
  const { url, method, params, headers, waitForResponse } = request;
  const effectiveMethod = method.toLowerCase() as AllowedHttpMethod;

  let effectiveUrl = url;
  if (effectiveMethod === AllowedHttpMethod.GET && params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    effectiveUrl = `${url}${url.includes("?") ? "&" : "?"}${queryParams.toString()}`;
  }

  const options = {
    method: effectiveMethod,
    headers: {
      ...headers,
      accept: "application/json",
      "content-type": "application/json"
    },
    body:
      effectiveMethod === AllowedHttpMethod.POST
        ? JSON.stringify(params)
        : undefined
  };

  logger.silly(`sending request to ${effectiveUrl}`, {
    params,
    method: effectiveMethod
  });

  if (!waitForResponse && effectiveMethod === AllowedHttpMethod.POST) {
    setTimeout(() => fetch(effectiveUrl, options), 0);
    return { result: "success" };
  } else {
    const response = await fetch(effectiveUrl, options);
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
