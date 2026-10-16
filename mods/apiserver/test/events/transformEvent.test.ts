/* eslint-disable prettier/prettier */
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

describe("@events/transformEvent", function () {
  it("should reuse the same synthetic ref across multiple events for the same SIP call", async function () {
    // Arrange
    const { transformEvent } = await import("../../src/events/transformEvent");
    const callId = "sip-call-1";
    const extraHeaders = { "X-Access-Key-Id": "accessKeyId" };

    // Act
    const first = transformEvent({ callId, extraHeaders });
    const second = transformEvent({ callId, extraHeaders });
    const third = transformEvent({
      callId,
      extraHeaders,
      hangupCause: "NORMAL_CLEARING"
    });

    // Assert
    expect(first.ref).to.be.a("string").and.not.empty;
    expect(second.ref).to.equal(first.ref);
    expect(third.ref).to.equal(first.ref);
  });

  it("should mint different refs for different SIP calls", async function () {
    // Arrange
    const { transformEvent } = await import("../../src/events/transformEvent");
    const extraHeaders = { "X-Access-Key-Id": "accessKeyId" };

    // Act
    const callA = transformEvent({ callId: "sip-call-a", extraHeaders });
    const callB = transformEvent({ callId: "sip-call-b", extraHeaders });

    // Assert
    expect(callA.ref).to.not.equal(callB.ref);
  });

  it("should use the X-Call-Ref header when present instead of a synthetic ref", async function () {
    // Arrange
    const { transformEvent } = await import("../../src/events/transformEvent");
    const callId = "api-originated-call";

    // Act
    const result = transformEvent({
      callId,
      extraHeaders: {
        "X-Access-Key-Id": "accessKeyId",
        "X-Call-Ref": "client-supplied-ref"
      }
    });

    // Assert
    expect(result.ref).to.equal("client-supplied-ref");
  });
});
