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
import { AmdStatus, CallType, CallStatus } from "@fonoster/types";
import * as chai from "chai"; import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { InfluxDBClient } from "@fonoster/common";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@calls/fetchSingleCall", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should filter by the ref tag before pivot and return the call", async function () {
    // Arrange
    const { createFetchSingleCall } = await import(
      "../../src/calls/createFetchSingleCall"
    );
    const accessKeyId = "accessKeyId";
    const ref = "01";
    const item = {
      ref,
      startedAt: 1715869342759,
      endedAt: 1715869342759,
      from: "+1234567890",
      to: "+1234567891",
      status: CallStatus.NORMAL_CLEARING,
      type: CallType.API_ORIGINATED,
      accessKeyId,
      amdStatus: AmdStatus.HUMAN,
      amdConfidence: 1,
      amdDetector: "asterisk-amd@1",
      amdLatencyMs: 0,
      amdCause: ""
    };

    const collectRows = sandbox.stub().resolves([item]);
    const influxdb = { collectRows } as InfluxDBClient;

    const fetchSingleCall = createFetchSingleCall(influxdb);

    // Act
    const result = await fetchSingleCall(accessKeyId, ref);

    // Assert
    expect(result).to.deep.equal(item);

    const queryStr = collectRows.getCall(0).args[0].toString();
    expect(queryStr).to.include("from(bucket: \"calls\")");
    expect(queryStr).to.include("range(start: -30d)");
    // The ref filter must run before pivot so it can be pushed down.
    const refFilterIndex = queryStr.indexOf(`r.ref == "${ref}"`);
    const pivotIndex = queryStr.indexOf("pivot(");
    expect(refFilterIndex).to.be.greaterThan(-1);
    expect(pivotIndex).to.be.greaterThan(-1);
    expect(refFilterIndex).to.be.lessThan(pivotIndex);
    expect(queryStr).to.include(`r.accessKeyId == "${accessKeyId}"`);
    expect(queryStr).to.include("limit(n: 1)");
  });

  it("should return null when no call matches", async function () {
    // Arrange
    const { createFetchSingleCall } = await import(
      "../../src/calls/createFetchSingleCall"
    );
    const collectRows = sandbox.stub().resolves([]);
    const influxdb = { collectRows } as InfluxDBClient;

    const fetchSingleCall = createFetchSingleCall(influxdb);

    // Act
    const result = await fetchSingleCall("accessKeyId", "missing-ref");

    // Assert
    expect(result).to.equal(null);
  });
});
