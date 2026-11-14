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
import { TrunkApi } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { createSandbox, SinonStub } from "sinon";
import {
  getTrunk,
  mergeTrunkUpdate,
  updateTrunk
} from "../src/trunks/operations";
import { TEST_TOKEN } from "./testToken";

const sandbox = createSandbox();
const ACCESS_KEY_ID = "GRahn02s8tgdfghz72vb0fz538qpb5z35p";

describe("@sipnet[trunks/updateTrunk]", function () {
  const current = {
    ref: "t-1",
    name: "Carrier",
    inboundUri: "carrier.example.com",
    sendRegister: true,
    outboundCredentialsRef: "c-1",
    uris: [
      {
        host: "sip.example.com",
        port: 5060,
        transport: "UDP",
        weight: 1,
        priority: 1
      }
    ]
  };

  it("keeps the current values of fields a partial update leaves blank", function () {
    const merged = mergeTrunkUpdate(
      { ref: "t-1", name: "Renamed", inboundUri: "", uris: [] } as never,
      current as never
    );
    expect(merged).to.deep.include({
      ref: "t-1",
      name: "Renamed",
      inboundUri: "carrier.example.com",
      outboundCredentialsRef: "c-1"
    });
    expect(merged.uris).to.deep.equal(current.uris);
  });

  it("uses the values the request sets", function () {
    const merged = mergeTrunkUpdate(
      {
        ref: "t-1",
        inboundUri: "new.example.com",
        sendRegister: false
      } as never,
      current as never
    );
    expect(merged).to.deep.include({
      name: "Carrier",
      inboundUri: "new.example.com",
      sendRegister: false
    });
  });

  describe("number formats", function () {
    afterEach(() => sandbox.restore());

    // Routr's Trunk API, as @routr/sdk returns it: Routr's format names
    function routr(stored: Record<string, unknown> = {}) {
      return {
        getTrunk: sandbox.stub().resolves({
          ...current,
          extended: { accessKeyId: ACCESS_KEY_ID },
          ...stored
        }),
        updateTrunk: sandbox.stub().resolves({ ref: "t-1" })
      } as unknown as TrunkApi;
    }

    async function update(trunks: TrunkApi, request: Record<string, unknown>) {
      const metadata = new grpc.Metadata();
      metadata.set("token", TEST_TOKEN);
      metadata.set("accessKeyId", ACCESS_KEY_ID);
      const callback = sandbox.stub();
      await updateTrunk(trunks)(
        { metadata, request: { ref: "t-1", ...request } } as never,
        callback
      );
      return (trunks.updateTrunk as SinonStub).firstCall?.args[0];
    }

    it("sends every format by name, Routr's UNSPECIFIED for leave as is", async function () {
      for (const name of [
        "E164",
        "E164_WITHOUT_PLUS",
        "NATIONAL",
        "INTERNATIONAL"
      ]) {
        const sent = await update(routr(), { calledNumberFormat: name });
        expect(sent.calledNumberFormat).to.equal(name);
        sandbox.restore();
      }
      const sent = await update(routr(), {
        calledNumberFormat: "NUMBER_FORMAT_UNSPECIFIED",
        calledNumberPrefix: ""
      });
      expect(sent).to.deep.include({
        calledNumberFormat: "UNSPECIFIED",
        calledNumberPrefix: ""
      });
    });

    it("leaves an absent format or prefix absent, so Routr keeps it", async function () {
      const sent = await update(
        routr({ calledNumberFormat: "NATIONAL", calledNumberPrefix: "9" }),
        { name: "Renamed" }
      );
      expect(sent).to.not.have.property("calledNumberFormat");
      expect(sent).to.not.have.property("calledNumberPrefix");
      expect(sent).to.not.have.property("callerNumberFormat");
    });

    it("never fills an empty prefix with the stored one", function () {
      const merged = mergeTrunkUpdate(
        {
          ref: "t-1",
          calledNumberFormat: "NUMBER_FORMAT_UNSPECIFIED",
          calledNumberPrefix: ""
        } as never,
        { ...current, calledNumberPrefix: "9" } as never
      );
      expect(merged).to.deep.include({ calledNumberPrefix: "" });
    });

    it("reads Routr's names back as Fonoster's", async function () {
      const trunks = routr({
        calledNumberFormat: "INTERNATIONAL",
        calledNumberPrefix: "9#",
        callerNumberFormat: "UNSPECIFIED"
      });
      const metadata = new grpc.Metadata();
      metadata.set("token", TEST_TOKEN);
      metadata.set("accessKeyId", ACCESS_KEY_ID);
      const callback = sandbox.stub();
      await getTrunk(trunks)(
        { metadata, request: { ref: "t-1" } } as never,
        callback
      );
      expect(callback.firstCall.args[1]).to.deep.include({
        calledNumberFormat: "INTERNATIONAL",
        calledNumberPrefix: "9#",
        callerNumberFormat: "NUMBER_FORMAT_UNSPECIFIED"
      });
    });
  });
});
