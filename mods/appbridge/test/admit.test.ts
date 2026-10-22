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
import { admit, Admission, AdmissionDecision } from "../src";

// The admission rule on its own (add-billing-service D7): the service's answer passes through, and
// a late or failed answer admits the call and says why. A unit test; the calls themselves are
// APB-036 (admission.test.ts).
const request = {
  callRef: "call-1",
  appRef: "agent-a",
  workspaceRef: "WO-A",
  direction: "inbound" as const,
  origin: "call" as const,
  from: "+15551230000",
  to: "+15559870000"
};

const answerAfter =
  (ms: number, decision: AdmissionDecision): Admission =>
  () =>
    new Promise((r) => setTimeout(() => r(decision), ms));

describe("@appbridge admit", function () {
  it("passes the service's answer through", async function () {
    const refusal = { authorized: false, reason: "insufficient_balance" };
    expect(await admit(answerAfter(0, refusal), request)).to.deep.equal(
      refusal
    );
  });

  it("admits when the answer is late, and says so", async function () {
    const decision = await admit(
      answerAfter(200, { authorized: false }),
      request,
      30
    );
    expect(decision.authorized).to.equal(true);
    expect(decision.failed).to.match(/no answer in 30 ms/);
  });

  it("admits when the service fails", async function () {
    const decision = await admit(
      () => Promise.reject(new Error("unavailable")),
      request
    );
    expect(decision).to.deep.equal({
      authorized: true,
      failed: "unavailable"
    });
  });
});
