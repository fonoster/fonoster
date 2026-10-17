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
import { APP_REF_HEADER, ROUTR_DEFAULT_PEER_AOR } from "@fonoster/common";
import { NumbersApi } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import {
  createNumberRouting,
  LEGACY_ASTERISK_PEER_AOR,
  MEDIA_NODE_PEER_AOR
} from "../src/numbers/engineRouting";
import { RoutrNumber, repointNumbers } from "../src/numbers/repointNumbers";
import { TEST_TOKEN } from "./testToken";

function callerMetadata() {
  const metadata = new grpc.Metadata();
  metadata.set("token", TEST_TOKEN);
  metadata.set("accesskeyid", "GRahn02s8tgdfghz72vb0fz538qpb5z35p");
  return metadata;
}

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[numbers/engineRouting]", function () {
  afterEach(() => sandbox.restore());

  it("points every app-linked number at the media nodes", async function () {
    const routing = createNumberRouting();
    expect(ROUTR_DEFAULT_PEER_AOR).to.equal("sip:medianode@default");
    expect(await routing.aorFor({ appRef: "a" })).to.equal(MEDIA_NODE_PEER_AOR);
    expect(await routing.engineFor({ appRef: "b" })).to.equal("rebuild");
    expect(
      await createNumberRouting({ mediaNodeAor: "sip:mn@x" }).aorFor({
        appRef: "a"
      })
    ).to.equal("sip:mn@x");
  });

  it("createNumber points a rebuild app's number at the media-node peer", async function () {
    const { createNumber } = await import("../src/numbers/createNumber");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    metadata.set("accesskeyid", "GRahn02s8tgdfghz72vb0fz538qpb5z35p");
    const numbers = {
      createNumber: sandbox.stub().resolves({ ref: "n1" })
    } as unknown as NumbersApi;
    const callback = sandbox.stub();

    await createNumber(
      numbers,
      sandbox.stub(),
      createNumberRouting()
    )(
      {
        metadata,
        request: {
          name: "Rebuild number",
          telUrl: "+1234567890",
          city: "New York",
          country: "USA",
          countryIsoCode: "US",
          appRef: "app-1",
          trunkRef: "t1"
        }
      } as never,
      callback
    );

    expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "n1" });
    expect(numbers.createNumber).to.have.been.calledWithMatch({
      aorLink: MEDIA_NODE_PEER_AOR,
      extraHeaders: [{ name: APP_REF_HEADER, value: "app-1" }]
    });
  });

  it("updateNumber resolves the engine with the stored number's telUrl", async function () {
    const { updateNumber } = await import("../src/numbers/updateNumber");
    const numbers = {
      getNumber: sandbox.stub().resolves({ ref: "n1", telUrl: "+15550000001" }),
      updateNumber: sandbox.stub().resolves({ ref: "n1" })
    } as unknown as NumbersApi;

    await updateNumber(
      numbers,
      sandbox.stub(),
      createNumberRouting()
    )(
      {
        metadata: callerMetadata(),
        request: { ref: "n1", appRef: "app-2" }
      } as never,
      sandbox.stub()
    );

    expect(numbers.updateNumber).to.have.been.calledWithMatch({
      ref: "n1",
      aorLink: MEDIA_NODE_PEER_AOR
    });
  });

  it("without routing, create and update use the media-node peer", async function () {
    const { updateNumber } = await import("../src/numbers/updateNumber");
    const numbers = {
      getNumber: sandbox.stub().resolves({
        ref: "n1",
        extended: { accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p" }
      }),
      updateNumber: sandbox.stub().resolves({ ref: "n1" })
    } as unknown as NumbersApi;
    await updateNumber(numbers, sandbox.stub())(
      {
        metadata: callerMetadata(),
        request: { ref: "n1", appRef: "app-2" }
      } as never,
      sandbox.stub()
    );
    // Read once, for the ownership check only (not for routing).
    expect(numbers.getNumber).to.have.been.calledOnce;
    expect(numbers.updateNumber).to.have.been.calledWithMatch({
      aorLink: ROUTR_DEFAULT_PEER_AOR
    });
  });

  describe("repointNumbers", function () {
    const header = (appRef: string) => [
      { name: APP_REF_HEADER, value: appRef }
    ];
    const store = (): RoutrNumber[] => [
      {
        ref: "1",
        name: "one",
        telUrl: "tel:+15550000001",
        aorLink: LEGACY_ASTERISK_PEER_AOR,
        extraHeaders: header("app-a")
      },
      {
        ref: "2",
        name: "two",
        telUrl: "tel:+15550000002",
        aorLink: LEGACY_ASTERISK_PEER_AOR,
        // Written by hand with another header case.
        extraHeaders: [{ name: "X-App-Ref", value: "app-b" }]
      },
      {
        ref: "3",
        name: "agent",
        telUrl: "tel:+15550000003",
        aorLink: "sip:1001@sip.local"
      },
      {
        ref: "4",
        name: "four",
        telUrl: "tel:+15550000004",
        aorLink: MEDIA_NODE_PEER_AOR,
        extraHeaders: header("app-a")
      }
    ];
    const client = (items: RoutrNumber[]) => ({
      // Two pages, to cover paging.
      listNumbers: sandbox
        .stub()
        .callsFake(async (r: { pageToken?: string }) =>
          r.pageToken
            ? { items: items.slice(2) }
            : { items: items.slice(0, 2), nextPageToken: "p2" }
        ),
      updateNumber: sandbox.stub().resolves({})
    });

    it("moves pre-rebuild numbers to the media nodes and skips agent numbers", async function () {
      const c = client(store());
      const changes = await repointNumbers(c, createNumberRouting());
      expect(changes.map((x) => x.ref)).to.deep.equal(["1", "2"]);
      expect(c.updateNumber).to.have.been.calledWithExactly({
        ref: "1",
        name: "one",
        aorLink: MEDIA_NODE_PEER_AOR,
        extraHeaders: header("app-a")
      });
    });

    it("supports dry runs and app filters", async function () {
      const c = client(store());
      const dry = await repointNumbers(c, createNumberRouting(), {
        dryRun: true,
        appRefs: ["app-b"]
      });
      expect(dry.map((x) => [x.ref, x.from, x.to])).to.deep.equal([
        ["2", LEGACY_ASTERISK_PEER_AOR, MEDIA_NODE_PEER_AOR]
      ]);
      expect(c.updateNumber).to.not.have.been.called;
    });
  });
});
