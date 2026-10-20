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
import {
  answeredBy,
  callParties,
  callStatus,
  callsToCsv,
  formatDuration,
  formatStarted,
  rangeStart
} from "./format";

describe("call formatting", () => {
  it("names hangup causes the way people say them", () => {
    expect(callStatus("NORMAL_CLEARING")).toEqual({
      label: "Completed",
      tone: "success"
    });
    expect(callStatus("NO_USER_RESPONSE").label).toBe("No answer");
    expect(callStatus("USER_BUSY").label).toBe("Busy");
    expect(callStatus("CALL_REJECTED").label).toBe("Rejected");
    expect(callStatus("SERVICE_UNAVAILABLE")).toEqual({
      label: "Failed",
      tone: "error"
    });
  });

  it("puts the customer first whichever way the call went", () => {
    expect(
      callParties({
        direction: "FROM_PSTN",
        from: "+18095550142",
        to: "+34910555211"
      } as never)
    ).toEqual({
      customer: "+1 809 555 0142",
      fonosterNumber: "+34 910 555 211"
    });
    expect(
      callParties({
        direction: "TO_PSTN",
        from: "+18295550199",
        to: "+18295550110"
      } as never)
    ).toEqual({
      customer: "+1 829 555 0110",
      fonosterNumber: "+1 829 555 0199"
    });
  });

  it("only reports AMD when it ran", () => {
    expect(answeredBy("HUMAN")).toBe("Human");
    expect(answeredBy("AMD_STATUS_UNSPECIFIED")).toBeUndefined();
    expect(answeredBy(undefined)).toBeUndefined();
  });

  it("formats durations as a clock and dashes calls that never connected", () => {
    expect(formatDuration(24)).toBe("0:24");
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(3729)).toBe("1:02:09");
    expect(formatDuration(0)).toBe("—");
  });

  it("says today and yesterday instead of dates", () => {
    const now = new Date(2026, 9, 14, 16, 0);
    expect(formatStarted(new Date(2026, 9, 14, 14, 31), now)).toBe(
      "Today 14:31"
    );
    expect(formatStarted(new Date(2026, 9, 13, 9, 2), now)).toBe(
      "Yesterday 09:02"
    );
    expect(formatStarted(new Date(2026, 9, 2, 18, 40), now)).toBe(
      "Oct 2 18:40"
    );
    expect(formatStarted(new Date(2025, 11, 30, 8, 15), now)).toBe(
      "Dec 30, 2025 08:15"
    );
    expect(formatStarted(undefined, now)).toBe("—");
  });

  it("turns a range into the API's after bound", () => {
    expect(rangeStart("7", new Date("2026-10-14T12:00:00Z"))).toBe(
      "2026-10-07T12:00:00.000Z"
    );
  });

  it("exports raw values as CSV, quoting when needed", () => {
    const csv = callsToCsv([
      {
        ref: "c-1",
        startedAt: new Date("2026-10-14T14:31:00Z"),
        endedAt: new Date("2026-10-14T14:31:24Z"),
        direction: "TO_PSTN",
        from: "+18295550199",
        to: "+18295550110",
        duration: 24,
        status: "NORMAL_CLEARING",
        type: "API_ORIGINATED",
        amdStatus: "AMD_STATUS_UNSPECIFIED"
      } as never
    ]);
    expect(csv).toBe(
      "ref,startedAt,endedAt,direction,from,to,duration,status,type,amdStatus\n" +
        "c-1,2026-10-14T14:31:00.000Z,2026-10-14T14:31:24.000Z,TO_PSTN,+18295550199,+18295550110,24,NORMAL_CLEARING,API_ORIGINATED,\n"
    );
  });
});
