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
import { APP_REF_HEADER } from "@fonoster/common";
import { NumberRouting, VoiceEngine } from "./engineRouting";

/** The slice of Routr's Numbers API that repointing needs (`new SDK.Numbers(...)` fits). */
export type RoutrNumbersClient = {
  listNumbers(request: { pageSize: number; pageToken?: string }): Promise<{
    items: RoutrNumber[];
    nextPageToken?: string;
  }>;
  updateNumber(request: {
    ref: string;
    name: string;
    aorLink: string;
    extraHeaders?: { name: string; value: string }[];
  }): Promise<unknown>;
};

export type RoutrNumber = {
  ref: string;
  name: string;
  telUrl: string;
  aorLink?: string;
  extraHeaders?: { name: string; value: string }[];
};

export type RepointChange = {
  ref: string;
  telUrl: string;
  appRef: string;
  engine: VoiceEngine;
  from?: string;
  to: string;
};

/**
 * Moves app-linked Numbers to the peer routing says (the media nodes). Routr stores `aorLink` on
 * each Number, so numbers created for Asterisk keep pointing at it until they are rewritten;
 * agent-linked Numbers are never touched. Returns what changed (or would,
 * with `dryRun`).
 */
export async function repointNumbers(
  client: RoutrNumbersClient,
  routing: NumberRouting,
  options: { appRefs?: string[]; dryRun?: boolean; pageSize?: number } = {}
): Promise<RepointChange[]> {
  const changes: RepointChange[] = [];
  let pageToken: string | undefined;
  const numbers: RoutrNumber[] = [];
  do {
    const page = await client.listNumbers({
      pageSize: options.pageSize ?? 100,
      pageToken
    });
    numbers.push(...page.items);
    pageToken = page.nextPageToken || undefined;
  } while (pageToken);

  for (const n of numbers) {
    // Header names are case-insensitive (sipnet writes x-app-ref; operators may write X-App-Ref).
    const appRef = n.extraHeaders?.find(
      (h) => h.name.toLowerCase() === APP_REF_HEADER.toLowerCase()
    )?.value;
    if (!appRef) continue;
    if (options.appRefs && !options.appRefs.includes(appRef)) continue;
    const engine = await routing.engineFor({ appRef, telUrl: n.telUrl });
    const to = routing.aorOf(engine);
    if (n.aorLink === to) continue;
    changes.push({
      ref: n.ref,
      telUrl: n.telUrl,
      appRef,
      engine,
      from: n.aorLink,
      to
    });
    if (!options.dryRun) {
      // Routr's update needs the name; extra headers are kept as they are.
      await client.updateNumber({
        ref: n.ref,
        name: n.name,
        aorLink: to,
        extraHeaders: n.extraHeaders
      });
    }
  }
  return changes;
}
