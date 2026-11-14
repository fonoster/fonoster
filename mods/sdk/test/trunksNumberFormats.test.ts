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
import { FonosterClient } from "../src/client/types";
import * as Node from "../src/generated/node/trunks_pb";
import * as Web from "../src/generated/web/trunks_pb";
import { Trunks } from "../src/Trunks";

const NAMES = [
  "NUMBER_FORMAT_UNSPECIFIED",
  "E164",
  "E164_WITHOUT_PLUS",
  "NATIONAL",
  "INTERNATIONAL"
];

type Sent = { update?: Node.UpdateTrunkRequest };

function trunkPB(called: number, prefix: string) {
  const t = new Node.Trunk();
  t.setRef("trunk-1");
  t.setName("Acme");
  t.setCalledNumberFormat(called);
  t.setCalledNumberPrefix(prefix);
  return Node.Trunk.deserializeBinary(t.serializeBinary());
}

function fakeClient(sent: Sent, stored = trunkPB(4, "9#")) {
  return {
    getMetadata: () => ({}),
    getTrunksClient: () => ({
      updateTrunk: (
        req: Node.UpdateTrunkRequest,
        _m: unknown,
        cb: (e: null, r: unknown) => void
      ) => {
        sent.update = Node.UpdateTrunkRequest.deserializeBinary(
          req.serializeBinary()
        );
        cb(null, { toObject: () => ({ ref: "trunk-1" }) });
      },
      getTrunk: (_r: unknown, _m: unknown, cb: (e: null, r: unknown) => void) =>
        cb(null, stored),
      listTrunks: (
        _r: unknown,
        _m: unknown,
        cb: (e: null, r: Node.ListTrunksResponse) => void
      ) => {
        const response = new Node.ListTrunksResponse();
        response.setItemsList([stored]);
        cb(null, response);
      }
    })
  } as unknown as FonosterClient;
}

describe("@sdk[trunks/numberFormats]", function () {
  it("sends each format name as its value and reads it back by name", async function () {
    for (const [value, name] of NAMES.entries()) {
      const sent: Sent = {};
      const trunks = new Trunks(fakeClient(sent, trunkPB(value, "")));
      await trunks.updateTrunk({
        ref: "trunk-1",
        calledNumberFormat: name as never
      });
      expect(sent.update!.getCalledNumberFormat()).to.equal(value);
      expect((await trunks.getTrunk("trunk-1")).calledNumberFormat).to.equal(
        name
      );
    }
  });

  it("returns names and prefixes from getTrunk and listTrunks", async function () {
    const trunks = new Trunks(fakeClient({}));
    expect(await trunks.getTrunk("trunk-1")).to.deep.include({
      calledNumberFormat: "INTERNATIONAL",
      calledNumberPrefix: "9#",
      callerNumberFormat: "NUMBER_FORMAT_UNSPECIFIED"
    });
    const list = await trunks.listTrunks({ pageSize: 10 });
    expect(list.items[0]).to.deep.include({
      calledNumberFormat: "INTERNATIONAL",
      calledNumberPrefix: "9#"
    });
  });

  it("keeps presence for a reset (UNSPECIFIED and \"\") and none for an absent field", async function () {
    const sent: Sent = {};
    await new Trunks(fakeClient(sent)).updateTrunk({
      ref: "trunk-1",
      calledNumberFormat: "NUMBER_FORMAT_UNSPECIFIED" as never,
      calledNumberPrefix: ""
    });
    const request = sent.update!;
    expect(request.hasCalledNumberFormat()).to.equal(true);
    expect(request.hasCalledNumberPrefix()).to.equal(true);
    expect(request.getCalledNumberPrefix()).to.equal("");
    expect(request.hasCallerNumberFormat()).to.equal(false);
    expect(request.hasCallerNumberPrefix()).to.equal(false);
  });

  it("keeps presence the same way in the web classes", function () {
    const request = new Web.UpdateTrunkRequest();
    request.setCalledNumberFormat(Web.NumberFormat.NUMBER_FORMAT_UNSPECIFIED);
    request.setCalledNumberPrefix("");
    const read = Web.UpdateTrunkRequest.deserializeBinary(
      request.serializeBinary()
    );
    expect(read.hasCalledNumberFormat()).to.equal(true);
    expect(read.hasCalledNumberPrefix()).to.equal(true);
    expect(read.hasCallerNumberFormat()).to.equal(false);
    expect(Object.keys(Web.NumberFormat)).to.deep.equal(NAMES);
  });
});
