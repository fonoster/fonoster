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
import { indexEntry } from "../src/indexEntry";
import { RecordEntry } from "../src/types";
import { buildVcon } from "../src/vcon";

// A call's usage in its record (add-usage-metering D1): AppBridge appends usage snapshots, each
// holding all usage so far, so the last one is the call's usage, also when the call was cut short.

describe("@callrecord/vcon usage", function () {
  const at = Date.parse("2026-10-20T10:00:00Z");
  const event = (offset: number, message: Record<string, unknown>) =>
    ({ at: at + offset, source: "event", message }) as RecordEntry;
  const started = event(0, {
    type: "call.started",
    from: "+1",
    to: "+2",
    direction: "inbound",
    workspaceRef: "ws-1",
    origin: "browser_test"
  });

  it("keeps the last usage snapshot and the origin, and the index carries both", function () {
    const entries = [
      started,
      event(60_000, {
        type: "usage.snapshot",
        lines: [{ meter: "call.seconds", quantity: 60 }]
      }),
      event(90_000, {
        type: "usage.snapshot",
        lines: [
          { meter: "call.seconds", quantity: 90 },
          {
            meter: "tts.characters",
            quantity: 42,
            provider: "fake",
            keySource: "platform"
          }
        ]
      }),
      event(90_001, { type: "call.ended", reason: "caller_hangup" })
    ];
    const { vcon } = buildVcon("c1", entries, { region: "us-east" });
    const usage = [
      { meter: "call.seconds", quantity: 90 },
      {
        meter: "tts.characters",
        quantity: 42,
        provider: "fake",
        keySource: "platform"
      }
    ];
    expect(vcon.fonoster).to.deep.include({ origin: "browser_test", usage });
    const sealed = {
      version: 1,
      signed: { payload: "", signatures: [] },
      redacted: { payload: "", signatures: [] },
      parts: []
    };
    const entry = indexEntry("c1", sealed, vcon, {
      region: "us-east",
      location: "file:///r"
    });
    expect(entry).to.deep.include({ origin: "browser_test", usage });
  });

  it("keeps the last flush when the call never ended (recovered seal)", function () {
    const entries = [
      started,
      event(60_000, {
        type: "usage.snapshot",
        lines: [{ meter: "call.seconds", quantity: 60 }]
      })
    ];
    const { vcon } = buildVcon("c2", entries, { region: "us-east" });
    expect((vcon.fonoster as { usage: unknown }).usage).to.deep.equal([
      { meter: "call.seconds", quantity: 60 }
    ]);
  });

  it("has no usage when nothing was consumed", function () {
    const { vcon } = buildVcon("c3", [started], { region: "us-east" });
    expect(vcon.fonoster).to.not.have.property("usage");
  });
});
