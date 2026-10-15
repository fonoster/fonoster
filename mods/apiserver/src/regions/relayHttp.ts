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
import { getLogger } from "@fonoster/logger";
import { Response } from "express";
import { RelayClient, RelayError, RelayRequest } from "./relay";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const STATUS: Record<string, number> = {
  region_offline: 503,
  not_found: 404,
  contents_deleted: 410,
  erased: 410,
  permission_denied: 403,
  too_large: 413,
  rate_limited: 429
};

/**
 * Streams relayed content into an HTTP response: headers once the first chunk is in, then each
 * chunk as it arrives. Nothing is written to disk or storage (contract §5).
 */
export async function relayToResponse(
  client: RelayClient,
  regionRef: string,
  request: RelayRequest,
  res: Response,
  headers: Record<string, string> = {}
) {
  let opened;
  try {
    opened = await client.open(regionRef, request);
  } catch (e) {
    const code = e instanceof RelayError ? e.code : "relay_failed";
    return res.status(STATUS[code] ?? 502).json({
      error: code,
      message:
        code === "region_offline"
          ? "Your region is offline; the call's content stays in your region"
          : (e as Error).message
    });
  }
  res.status(200);
  res.setHeader("content-type", opened.contentType);
  res.setHeader("cache-control", "no-store");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  // The browser went away: stop the relay and free its slot.
  res.once("close", () => opened.close());
  try {
    for await (const chunk of opened.chunks) {
      if (res.destroyed) break;
      if (!res.write(chunk))
        await new Promise<void>((resolve) => {
          res.once("drain", resolve);
          res.once("close", resolve);
        });
    }
    res.end();
  } catch (e) {
    logger.warn(`relay from ${regionRef} broke off: ${(e as Error).message}`);
    res.destroy(e as Error);
  }
}
