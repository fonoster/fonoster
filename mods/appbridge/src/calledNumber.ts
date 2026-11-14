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
import { headerValue } from "./testCalls";
import type { Roomr } from "@fonoster/common";

/**
 * The called number of an inbound call. On a call from a Trunk, Routr (2.34, fonoster/routr#704)
 * names the matched Number in X-DID-Number and sets X-Call-Direction to from-pstn, replacing any
 * copy the caller sent; To stays as the carrier wrote it (01685, sales, 02079460018). An Agent or
 * Peer keeps the headers it sends, so X-DID-Number counts only on a from-pstn call.
 */
export function calledNumber(start: Roomr.SessionStart): string {
  const headers = start.headers ?? {};
  const did = headerValue(headers, "X-DID-Number");
  return did && headerValue(headers, "X-Call-Direction") === "from-pstn"
    ? did
    : (start.to ?? "");
}
