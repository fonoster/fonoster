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
import { toCallDetailRecord } from "../../src/records/createSearchRecords";
import { CallRecordRow } from "../../src/records/types";

// calls.proto carries started_at and ended_at as int32 epoch seconds and the SDK reads them with
// `new Date(value * 1000)`: milliseconds overflow the field and put every call in the wrong year.
describe("@apiserver toCallDetailRecord times", () => {
  const row = {
    callRef: "call-1",
    status: "completed",
    direction: "inbound",
    startedAt: new Date("2026-10-22T04:31:26.481Z"),
    endedAt: new Date("2026-10-22T04:32:25.017Z"),
    durationSeconds: 59
  } as unknown as CallRecordRow;

  it("sends start and end as epoch seconds that fit an int32", () => {
    const record = toCallDetailRecord(row) as unknown as {
      startedAt: number;
      endedAt: number;
    };
    expect(record.startedAt).to.equal(1792643486);
    expect(record.endedAt).to.equal(1792643545);
    expect(record.startedAt).to.be.lessThan(2 ** 31);
  });

  it("ends a call that has no end time at its start", () => {
    const record = toCallDetailRecord({
      ...row,
      endedAt: null
    } as unknown as CallRecordRow) as unknown as {
      startedAt: number;
      endedAt: number;
    };
    expect(record.endedAt).to.equal(record.startedAt);
  });
});
