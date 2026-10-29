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
import { GraphApiFake } from "./createGraphApiFake";

function headersOf(init?: RequestInit): Record<string, string> {
  const out: Record<string, string> = {};
  const headers = init?.headers;
  if (!headers) return out;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => (out[key] = value));
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) out[key] = value;
  } else {
    Object.assign(out, headers);
  }
  return out;
}

/** The thin adapter: a `fetch` that answers from the fake. */
function graphApiFakeFetch(fake: GraphApiFake): typeof globalThis.fetch {
  return async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const answer = fake.handle({
      method: init?.method ?? "GET",
      url,
      headers: headersOf(init),
      body: typeof init?.body === "string" ? init.body : undefined
    });

    if (answer === "network") {
      throw new TypeError("fetch failed");
    }

    return new Response(JSON.stringify(answer.body), {
      status: answer.status,
      headers: { "content-type": "application/json" }
    });
  };
}

export { graphApiFakeFetch };
