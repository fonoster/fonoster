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
import { GrpcCode } from "~/lib/errors";
import {
  fromNumber,
  fromStreamStatus,
  testCallError,
  toE164
} from "./test-call";

const grpc = (code: number, message: string) =>
  Object.assign(new Error(message), { code });

describe("test call", () => {
  it("maps each TrackCall status the SDK yields", () => {
    expect(
      ["TRYING", "PROGRESS", "ANSWER", "BUSY", "ERROR", "FAILED"].map(
        fromStreamStatus
      )
    ).toEqual(["calling", "ringing", "answered", "busy", "noAnswer", "failed"]);
  });

  it("takes E.164 only, and sends the Number without tel:", () => {
    expect(toE164(" +1 (555) 123-4567 ")).toBe("+15551234567");
    expect(toE164("")).toBeUndefined();
    expect(toE164("555-0100")).toBeUndefined();
    expect(toE164("15551234567")).toBeUndefined();
    expect(fromNumber("tel:+18095550177")).toBe("+18095550177");
  });

  it("says why CreateCall refused the call, never a raw code", () => {
    const refused = (reason: string) =>
      testCallError(
        grpc(GrpcCode.FAILED_PRECONDITION, `The call was refused: ${reason}`)
      );
    expect(refused("trial_ended")).toBe(
      "Your trial has ended. Choose a plan in Billing to make calls."
    );
    expect(refused("insufficient_balance")).toBe(
      "Your balance is too low to make calls. Add credit in Billing."
    );
    expect(refused("concurrency_limit")).toBe(
      "Too many calls at once. Wait for one to end, then try again."
    );
    expect(
      testCallError(grpc(GrpcCode.RESOURCE_EXHAUSTED, "no_capacity"))
    ).toBe("No line is free to place the call. Try again in a minute.");
    expect(testCallError(grpc(GrpcCode.UNAVAILABLE, "fetch failed"))).toBe(
      "Can't reach the Fonoster API. Check your connection and try again."
    );
  });
});
