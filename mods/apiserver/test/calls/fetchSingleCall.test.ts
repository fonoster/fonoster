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

    const callId = "DGoldhnEZ6enSoxJ2JmzNZBoGiDytSAI";
    const collectRows = sandbox.stub();
    collectRows.onFirstCall().resolves([{ callId }]);
    collectRows.onSecondCall().resolves([item]);
    const influxdb = { collectRows } as InfluxDBClient;

    const fetchSingleCall = createFetchSingleCall(influxdb);

    // Act
    const result = await fetchSingleCall(accessKeyId, ref);

    // Assert
    expect(result).to.deep.equal(item);

    // The ref only resolves the callId; it is not what the record is
    // filtered on. See #885.
    const refQuery = collectRows.getCall(0).args[0].toString();
    expect(refQuery).to.include(`r.ref == "${ref}"`);
    expect(refQuery).to.include("distinct(column: \"callId\")");

    const queryStr = collectRows.getCall(1).args[0].toString();
    expect(queryStr).to.include("from(bucket: \"calls\")");
    expect(queryStr).to.include("range(start: -30d)");
    // The callId filter must run before pivot so it can be pushed down.
    const callIdFilterIndex = queryStr.indexOf(`r.callId == "${callId}"`);
    const pivotIndex = queryStr.indexOf("pivot(");
    expect(callIdFilterIndex).to.be.greaterThan(-1);
    expect(pivotIndex).to.be.greaterThan(-1);
    expect(callIdFilterIndex).to.be.lessThan(pivotIndex);
    expect(queryStr).to.include(`r.accessKeyId == "${accessKeyId}"`);
    expect(queryStr).to.include("limit(n: 1)");
  });

  it("should return the call when only the start event carried the ref", async function () {
    // Regression test for #885: the apiserver restarted between the call's
    // start and end events, so the end point was written with a callId but
    // no ref tag. Filtering the record on ref hid it and the CDR was stuck
    // with no status and a zero duration.
    const { createFetchSingleCall } = await import(
      "../../src/calls/createFetchSingleCall"
    );
    const accessKeyId = "accessKeyId";
    const ref = "222c6f81-d69a-432e-bb41-551d407ce70f";
    const callId = "DGoldhnEZ6enSoxJ2JmzNZBoGiDytSAI";

    // Only the start point is tagged with the ref, but pivoting on callId
    // merges the untagged end point's status and endedAt into the record.
    const merged = {
      ref,
      callId,
      accessKeyId,
      startedAt: 1788113333674,
      endedAt: 1788113403488,
      status: CallStatus.NO_ANSWER,
      type: CallType.API_ORIGINATED
    };

    const collectRows = sandbox.stub();
    collectRows.onFirstCall().resolves([{ callId }]);
    collectRows.onSecondCall().resolves([merged]);
    const influxdb = { collectRows } as InfluxDBClient;

    const result = await createFetchSingleCall(influxdb)(accessKeyId, ref);

    expect(result).to.deep.equal(merged);

    const queryStr = collectRows.getCall(1).args[0].toString();
    expect(queryStr).to.include(`r.callId == "${callId}"`);
    expect(queryStr).to.not.include(`r.ref == "${ref}"`);
  });

  it("should accept a distinct() row that reports the callId as _value", async function () {
    const { createFetchSingleCall } = await import(
      "../../src/calls/createFetchSingleCall"
    );
    const callId = "DGoldhnEZ6enSoxJ2JmzNZBoGiDytSAI";
    const collectRows = sandbox.stub();
    collectRows.onFirstCall().resolves([{ _value: callId }]);
    collectRows.onSecondCall().resolves([{ callId }]);
    const influxdb = { collectRows } as InfluxDBClient;

    await createFetchSingleCall(influxdb)("accessKeyId", "01");

    expect(collectRows.getCall(1).args[0].toString()).to.include(
      `r.callId == "${callId}"`
    );
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
    // The record query is never issued when the ref resolves to nothing.
    expect(collectRows).to.have.been.calledOnce;
  });

  it("should return null when the record query finds nothing", async function () {
    const { createFetchSingleCall } = await import(
      "../../src/calls/createFetchSingleCall"
    );
    const collectRows = sandbox.stub();
    collectRows.onFirstCall().resolves([{ callId: "abc" }]);
    collectRows.onSecondCall().resolves([]);
    const influxdb = { collectRows } as InfluxDBClient;

    const result = await createFetchSingleCall(influxdb)("accessKeyId", "01");

    expect(result).to.equal(null);
  });
});
