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
import { AmdStatus } from "@fonoster/common";
import { expect } from "chai";
import {
  registerPendingClassification,
  resolvePendingClassification,
  unregisterPendingClassification
} from "../../src/agi/sessionRegistry";
import { ProbeResult } from "../../src/probe/runProbe";

const classified = (status: AmdStatus): ProbeResult => ({
  kind: "classified",
  status,
  confidence: 0.9,
  detector: "test-detector",
  latencyMs: 10
});

const unknown = (cause: string): ProbeResult => ({
  kind: "unknown",
  cause,
  latencyMs: 10
});

describe("@agi/sessionRegistry", function () {
  it("resolves the pending promise for the matching session id", async function () {
    const pending = registerPendingClassification("session-1");
    resolvePendingClassification("session-1", classified(AmdStatus.HUMAN));

    expect(await pending).to.deep.equal(classified(AmdStatus.HUMAN));
  });

  it("ignores a resolve for an unknown or already-unregistered session id", function () {
    expect(() =>
      resolvePendingClassification("never-registered", classified(AmdStatus.HUMAN))
    ).to.not.throw();

    registerPendingClassification("session-2");
    unregisterPendingClassification("session-2");
    expect(() =>
      resolvePendingClassification("session-2", classified(AmdStatus.MACHINE))
    ).to.not.throw();
  });

  it("keeps sessions independent", async function () {
    const pendingA = registerPendingClassification("session-a");
    const pendingB = registerPendingClassification("session-b");

    resolvePendingClassification("session-b", unknown("ML-TIMEOUT"));
    resolvePendingClassification("session-a", classified(AmdStatus.HUMAN));

    expect(await pendingA).to.deep.equal(classified(AmdStatus.HUMAN));
    expect(await pendingB).to.deep.equal(unknown("ML-TIMEOUT"));
  });
});
