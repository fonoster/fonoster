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
import { FonosterClient } from "../src/client/types";
import {
  GetUsageRequest,
  GetUsageResponse,
  UsageRow
} from "../src/generated/node/usage_pb";
import { Usage } from "../src/Usage";

describe("@sdk[usage]", function () {
  it("sends the range and grouping and returns the rows", async function () {
    let sent: GetUsageRequest | undefined;
    const row = new UsageRow();
    row.setMeter("stt.seconds");
    row.setUnit("second");
    row.setProvider("deepgram");
    row.setKeySource("workspace");
    row.setQuantity(500);
    const response = new GetUsageResponse();
    response.setRowsList([row]);
    const client = {
      getMetadata: () => ({}),
      getUsageClient: () => ({
        getUsage: (
          req: GetUsageRequest,
          _metadata: unknown,
          callback: (e: Error | null, r: GetUsageResponse) => void
        ) => {
          sent = req;
          callback(
            null,
            GetUsageResponse.deserializeBinary(response.serializeBinary())
          );
        }
      })
    } as unknown as FonosterClient;

    const { rows } = await new Usage(client).getUsage({
      fromDay: "2026-10-01",
      toDay: "2026-10-31",
      groupBy: ["key_source"],
      allOwned: true
    });
    expect(sent!.getFromDay()).to.equal("2026-10-01");
    expect(sent!.getToDay()).to.equal("2026-10-31");
    expect(sent!.getGroupByList()).to.deep.equal(["key_source"]);
    expect(sent!.getAllOwned()).to.equal(true);
    expect(rows).to.have.length(1);
    expect(rows[0]).to.deep.include({
      meter: "stt.seconds",
      unit: "second",
      provider: "deepgram",
      keySource: "workspace",
      quantity: 500
    });
  });
});
