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
import { describe, expect, it } from "vitest";
import {
  answeredByWord,
  callCount,
  clock,
  endedText,
  median,
  recordParties,
  recordStatus,
  recordsToCsv,
  responseTimes,
  usageRow
} from "./records";

describe("call records", () => {
  it("names a failed call by its reason", () => {
    expect(recordStatus({ status: "completed" }).label).toBe("Completed");
    expect(recordStatus({ status: "failed", failureReason: "busy" })).toEqual({
      label: "Busy",
      tone: "warning"
    });
    expect(
      recordStatus({ status: "failed", failureReason: "app_unreachable" }).label
    ).toBe("Failed");
  });

  it("puts the customer on the outside of the call", () => {
    const inbound = { from: "+18095550142", to: "+18295550199", appRef: "a" };
    expect(recordParties({ ...inbound, direction: "inbound" })).toEqual({
      customer: "+1 809 555 0142",
      fonosterNumber: "+1 829 555 0199"
    });
    expect(recordParties({ ...inbound, direction: "outbound" }).customer).toBe(
      "+1 829 555 0199"
    );
    // A browser test call goes to the agent itself: no Fonoster number.
    expect(
      recordParties({
        from: "ada@acme.test",
        to: "app-1",
        appRef: "app-1",
        direction: "internal"
      })
    ).toEqual({ customer: "ada@acme.test", fonosterNumber: "" });
  });

  it("reads times as a clock", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(24_400)).toBe("0:24");
    expect(clock(125_000)).toBe("2:05");
    expect(clock(3_729_000)).toBe("1:02:09");
  });

  it("takes the response time of agent turns that answered the caller", () => {
    const turn = (side: "caller" | "agent", firstAudioMs?: number) => ({
      index: 0,
      side,
      text: "",
      startMs: 0,
      endMs: 0,
      ...(firstAudioMs !== undefined ? { firstAudioMs } : {})
    });
    const times = responseTimes([
      turn("agent"),
      turn("caller"),
      turn("agent", 610),
      turn("caller"),
      turn("agent", 780),
      turn("caller"),
      turn("agent", 650)
    ]);
    expect(times).toEqual([
      { turn: 1, ms: 610 },
      { turn: 2, ms: 780 },
      { turn: 3, ms: 650 }
    ]);
    expect(median(times.map((t) => t.ms))).toBe(650);
    expect(median([])).toBeUndefined();
  });

  it("states usage without prices", () => {
    expect(
      usageRow({ meter: "stt.seconds", quantity: 42, provider: "deepgram" })
    ).toEqual({ label: "Speech-to-text · deepgram", amount: "0:42" });
    expect(
      usageRow({ meter: "llm.tokens.in", quantity: 1900, model: "gpt-4o-mini" })
    ).toEqual({ label: "LLM input · gpt-4o-mini", amount: "1.9K tokens" });
  });

  it("names who answered, by AMD, only when it could tell", () => {
    expect(answeredByWord("voicemail")).toBe("Voicemail");
    expect(answeredByWord("ivr")).toBe("IVR");
    expect(answeredByWord("unknown")).toBeUndefined();
    expect(answeredByWord(undefined)).toBeUndefined();
  });

  it("counts the calls: the query's total, else the loaded ones and a plus", () => {
    expect(callCount(50, true, 1207)).toBe("1,207 calls");
    expect(callCount(1, false, 1)).toBe("1 call");
    expect(callCount(0, false, 0)).toBe("0 calls");
    expect(callCount(50, true)).toBe("50+ calls");
    expect(callCount(1, false)).toBe("1 call");
  });

  it("says how a call ended", () => {
    expect(endedText("caller_hangup")).toBe("The caller hung up");
    expect(endedText("busy", 486)).toBe("The line was busy (SIP 486)");
  });

  it("exports the listed calls as CSV", () => {
    const csv = recordsToCsv(
      [
        {
          callRef: "call-1",
          appRef: "app-1",
          from: "+18095550142",
          to: "+18295550199",
          direction: "inbound",
          startedAt: "2026-10-20T14:05:00.000Z",
          durationMs: 24_000,
          status: "failed",
          failureReason: "busy",
          sipStatus: 486,
          version: 1
        }
      ],
      (ref) => (ref === "app-1" ? "Front desk, ES" : undefined)
    );
    expect(csv.split("\n")[1]).toBe(
      'call-1,2026-10-20T14:05:00.000Z,inbound,"Front desk, ES",app-1,+18095550142,+18295550199,24,failed,busy,486,,'
    );
  });
});
