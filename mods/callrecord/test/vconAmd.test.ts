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

// Who answered (#1066): AppBridge's amd.result event is kept in the record and its index.

describe("@callrecord/vcon answering machine detection", function () {
  const at = Date.parse("2026-10-20T10:00:00Z");
  const event = (offset: number, message: Record<string, unknown>) =>
    ({ at: at + offset, source: "event", message }) as RecordEntry;
  const sealed = {
    version: 1,
    signed: { payload: "", signatures: [] },
    redacted: { payload: "", signatures: [] },
    parts: []
  };
  const started = event(0, {
    type: "call.started",
    from: "+1",
    to: "+2",
    direction: "outbound",
    workspaceRef: "ws-1"
  });

  it("keeps the first verdict, and the index carries its status", function () {
    const { vcon } = buildVcon(
      "c1",
      [
        started,
        event(1_200, {
          type: "amd.result",
          status: "voicemail",
          confidence: 0.94,
          detector: "amd-onnx",
          audioMs: 820
        }),
        event(1_300, { type: "amd.result", status: "human", confidence: 0.5 }),
        event(9_000, { type: "call.ended", reason: "app_hangup" })
      ],
      { region: "us-east" }
    );
    expect((vcon.fonoster as { amd: unknown }).amd).to.deep.equal({
      status: "voicemail",
      confidence: 0.94,
      detector: "amd-onnx",
      audioMs: 820,
      at: "2026-10-20T10:00:01.200Z"
    });
    const entry = indexEntry("c1", sealed, vcon, {
      region: "us-east",
      location: "file:///r"
    });
    expect(entry.amdStatus).to.equal("voicemail");
  });

  it("has no verdict when AMD didn't run", function () {
    const { vcon } = buildVcon("c2", [started], { region: "us-east" });
    expect(vcon.fonoster).to.not.have.property("amd");
    const entry = indexEntry("c2", sealed, vcon, {
      region: "us-east",
      location: "file:///r"
    });
    expect(entry.amdStatus).to.equal(null);
  });
});
