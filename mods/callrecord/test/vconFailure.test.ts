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
import { expect } from "chai";
import { buildVcon } from "../src/vcon";
import { RecordEntry } from "../src/types";

// A call that a provider failed after answer (a rejected key, #1146): the record says failed,
// with the reason and the provider, not completed.

describe("@callrecord/vcon provider failures", function () {
  const at = Date.parse("2026-10-26T10:00:00Z");
  const event = (offset: number, message: Record<string, unknown>) =>
    ({ at: at + offset, source: "event", message }) as RecordEntry;

  it("is failed, naming the provider whose key was rejected", function () {
    const entries = [
      event(0, {
        type: "call.started",
        from: "+1",
        to: "+2",
        direction: "inbound"
      }),
      event(900, {
        type: "call.failed",
        reason: "provider_auth_failed",
        provider: "deepgram",
        kind: "stt"
      }),
      event(950, { type: "call.ended", reason: "error" })
    ];
    const { vcon } = buildVcon("c1", entries, { region: "us-east" });
    expect(vcon.fonoster).to.deep.include({
      status: "failed",
      failure: { reason: "provider_auth_failed", provider: "deepgram" }
    });
  });
});
