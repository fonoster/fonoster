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
  MEDIA_NODE_PEER_AOR
} from "../src/numbers/engineRouting";
import { RoutrNumber, repointNumbers } from "../src/numbers/repointNumbers";
import { TEST_TOKEN } from "./testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[numbers/engineRouting]", function () {
  afterEach(() => sandbox.restore());

  it("keeps every app on Asterisk without configuration", async function () {
    const routing = createNumberRouting();
    expect(await routing.aorFor({ appRef: "a" })).to.equal(
      ROUTR_DEFAULT_PEER_AOR
    );
  });

  it("resolves number pin, then lookup, then lists, then the default", async function () {
    const routing = createNumberRouting({
      defaultEngine: "asterisk",
      rebuildApps: ["new-app", "both"],
      asteriskApps: ["both"],
      numbers: { "+15550000001": "rebuild" },
      engineOf: (appRef) => (appRef === "db-app" ? "rebuild" : undefined)
    });
    expect(await routing.engineFor({ appRef: "new-app" })).to.equal("rebuild");
    expect(await routing.engineFor({ appRef: "both" })).to.equal("asterisk");
    expect(await routing.engineFor({ appRef: "db-app" })).to.equal("rebuild");
    expect(await routing.engineFor({ appRef: "other" })).to.equal("asterisk");
    expect(
      await routing.engineFor({ appRef: "other", telUrl: "tel:+15550000001" })
    ).to.equal("rebuild");
    expect(await routing.aorFor({ appRef: "new-app" })).to.equal(
      MEDIA_NODE_PEER_AOR
    );
  });

  it("honors custom AORs and a rebuild default", async function () {
    const routing = createNumberRouting({
      defaultEngine: "rebuild",
      mediaNodeAor: "sip:medianode@cell-1",
      asteriskApps: ["legacy"]
    });
    expect(await routing.aorFor({ appRef: "x" })).to.equal(
      "sip:medianode@cell-1"
    );
    expect(await routing.aorFor({ appRef: "legacy" })).to.equal(
      ROUTR_DEFAULT_PEER_AOR
    );
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
      createNumberRouting({ rebuildApps: ["app-1"] })
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
      createNumberRouting({ numbers: { "+15550000001": "rebuild" } })
    )({ request: { ref: "n1", appRef: "app-2" } } as never, sandbox.stub());

    expect(numbers.updateNumber).to.have.been.calledWithMatch({
      ref: "n1",
      aorLink: MEDIA_NODE_PEER_AOR
    });
  });

  it("without routing, create and update keep the Asterisk peer", async function () {
    const { updateNumber } = await import("../src/numbers/updateNumber");
    const numbers = {
      getNumber: sandbox.stub(),
      updateNumber: sandbox.stub().resolves({ ref: "n1" })
    } as unknown as NumbersApi;
    await updateNumber(numbers, sandbox.stub())(
      { request: { ref: "n1", appRef: "app-2" } } as never,
      sandbox.stub()
    );
    expect(numbers.getNumber).to.not.have.been.called;
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
        aorLink: ROUTR_DEFAULT_PEER_AOR,
        extraHeaders: header("app-a")
      },
      {
        ref: "2",
        name: "two",
        telUrl: "tel:+15550000002",
        aorLink: ROUTR_DEFAULT_PEER_AOR,
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

    it("moves only the numbers of apps whose engine changed and skips agent numbers", async function () {
      const c = client(store());
      const changes = await repointNumbers(
        c,
        createNumberRouting({ rebuildApps: ["app-a"] })
      );
      expect(changes.map((x) => x.ref)).to.deep.equal(["1"]);
      expect(c.updateNumber).to.have.been.calledOnceWithExactly({
        ref: "1",
        name: "one",
        aorLink: MEDIA_NODE_PEER_AOR,
        extraHeaders: header("app-a")
      });
    });

    it("rolls back to Asterisk and supports dry runs and app filters", async function () {
      const c = client(store());
      const dry = await repointNumbers(c, createNumberRouting(), {
        dryRun: true
      });
      expect(dry.map((x) => [x.ref, x.to])).to.deep.equal([
        ["4", ROUTR_DEFAULT_PEER_AOR]
      ]);
      expect(c.updateNumber).to.not.have.been.called;

      const filtered = await repointNumbers(
        c,
        createNumberRouting({ defaultEngine: "rebuild" }),
        { appRefs: ["app-b"] }
      );
      expect(filtered.map((x) => x.ref)).to.deep.equal(["2"]);
    });
  });
});
