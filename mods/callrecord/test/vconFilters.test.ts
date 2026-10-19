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

// Audio filter failures in the record (voice-session "Audio filters come from app configuration"):
// the event type stays in `failures`; `filters.failed` carries the name and reason for the badge.

describe("@callrecord/vcon filter failures", function () {
  const at = Date.parse("2026-10-19T10:00:00Z");
  const event = (offset: number, message: Record<string, unknown>) =>
    ({ at: at + offset, source: "event", message }) as RecordEntry;

  it("lists each failed filter with its reason, start-time and mid-call alike", function () {
    const entries = [
      event(0, { type: "call.started", from: "+1", to: "+2", direction: "inbound" }),
      event(10, {
        type: "filter.failed",
        name: "aiCoustics",
        reason: "License key format is invalid or corrupted"
      }),
      event(2000, { type: "filter.failed", name: "test-boom", reason: "kaput" }),
      event(5000, { type: "call.ended", reason: "caller_hangup" })
    ];
    const { vcon } = buildVcon("c1", entries, { region: "us-east" });
    const meta = vcon.fonoster as Record<string, unknown>;
    expect(meta.failures).to.deep.equal(["filter.failed", "filter.failed"]);
    expect(meta.filters).to.deep.equal({
      failed: [
        {
          name: "aiCoustics",
          reason: "License key format is invalid or corrupted"
        },
        { name: "test-boom", reason: "kaput" }
      ]
    });
  });

  it("has no filters entry when nothing failed", function () {
    const entries = [
      event(0, { type: "call.started", from: "+1", to: "+2", direction: "inbound" }),
      event(5000, { type: "call.ended", reason: "caller_hangup" })
    ];
    const { vcon } = buildVcon("c2", entries, { region: "us-east" });
    expect(vcon.fonoster).to.not.have.property("filters");
    expect((vcon.fonoster as { failures: string[] }).failures).to.deep.equal([]);
  });
});
