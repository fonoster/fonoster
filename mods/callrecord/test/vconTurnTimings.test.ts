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
import { expect } from "chai";
import { buildVcon } from "../src/vcon";
import { RecordEntry } from "../src/types";

// call-record "The record contains ... the transcript per turn and per side, with timings": each
// spoken turn starts when that side began speaking and carries its duration.

describe("@callrecord/vcon turn timings", function () {
  const at = Date.parse("2026-10-20T14:05:00Z");
  const entry = (
    offset: number,
    source: RecordEntry["source"],
    message: Record<string, unknown>
  ) => ({ at: at + offset, source, message }) as RecordEntry;

  it("times caller turns from when the caller began and agent turns from when speech started", function () {
    const { vcon } = buildVcon(
      "call-1",
      [
        entry(0, "event", {
          type: "call.started",
          from: "+1",
          to: "+2",
          direction: "inbound"
        }),
        entry(100, "appbridge", {
          type: "session.start",
          callRef: "call-1",
          appRef: "app-1"
        }),
        entry(450, "app", {
          type: "speak",
          id: "g1",
          text: "Hi, how can I help?"
        }),
        entry(500, "appbridge", { type: "output.started", id: "g1" }),
        entry(1500, "appbridge", { type: "output.done", id: "g1" }),
        entry(1900, "appbridge", { type: "turn.user_started" }),
        entry(3700, "appbridge", {
          type: "turn.ended",
          text: "When are you open?"
        }),
        entry(5000, "event", { type: "call.ended", reason: "caller_hangup" })
      ],
      { region: "default" }
    );

    const text = (vcon.dialog as Record<string, unknown>[]).filter(
      (d) => d.type === "text"
    );
    expect(text.map((d) => [d.body, d.start, d.duration])).to.deep.equal([
      ["Hi, how can I help?", new Date(at + 500).toISOString(), 1],
      ["When are you open?", new Date(at + 1900).toISOString(), 1.8]
    ]);
  });
});
