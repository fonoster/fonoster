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
import {
  CreateNumberRequest,
  ListNumbersResponse,
  Number as NumberPB,
  UpdateNumberRequest
} from "../src/generated/node/numbers_pb";
import { Numbers } from "../src/Numbers";

function numberPB(aliases: string[]) {
  const n = new NumberPB();
  n.setRef("number-1");
  n.setName("Main line");
  n.setTelUrl("tel:+442079460018");
  n.setAliasesList(aliases);
  return NumberPB.deserializeBinary(n.serializeBinary());
}

type Sent = { create?: CreateNumberRequest; update?: UpdateNumberRequest };

function fakeClient(sent: Sent, aliases: string[] = ["01234", "5678"]) {
  const ok = (callback: (e: null, r: unknown) => void) =>
    callback(null, { getRef: () => "number-1", toObject: () => ({}) });
  return {
    getMetadata: () => ({}),
    getNumbersClient: () => ({
      createNumber: (req: CreateNumberRequest, _m: unknown, cb: never) => {
        sent.create = CreateNumberRequest.deserializeBinary(
          req.serializeBinary()
        );
        ok(cb);
      },
      updateNumber: (req: UpdateNumberRequest, _m: unknown, cb: never) => {
        sent.update = UpdateNumberRequest.deserializeBinary(
          req.serializeBinary()
        );
        ok(cb);
      },
      getNumber: (
        _req: unknown,
        _m: unknown,
        cb: (e: null, r: NumberPB) => void
      ) => cb(null, numberPB(aliases)),
      listNumbers: (
        _req: unknown,
        _m: unknown,
        cb: (e: null, r: ListNumbersResponse) => void
      ) => {
        const response = new ListNumbersResponse();
        response.setItemsList([numberPB(aliases)]);
        cb(null, response);
      }
    })
  } as unknown as FonosterClient;
}

describe("@sdk[numbers/aliases]", function () {
  it("sends aliases on createNumber", async function () {
    const sent: Sent = {};
    await new Numbers(fakeClient(sent)).createNumber({
      name: "Main line",
      telUrl: "tel:+442079460018",
      city: "London",
      country: "United Kingdom",
      countryIsoCode: "GB",
      trunkRef: "trunk-1",
      aliases: ["01234"]
    });
    expect(sent.create!.getAliasesList()).to.deep.equal(["01234"]);
  });

  it("sends aliases and clearAliases on updateNumber", async function () {
    const sent: Sent = {};
    const numbers = new Numbers(fakeClient(sent));
    await numbers.updateNumber({ ref: "number-1", aliases: ["01234", "5678"] });
    expect(sent.update!.getAliasesList()).to.deep.equal(["01234", "5678"]);
    expect(sent.update!.getClearAliases()).to.equal(false);
    await numbers.updateNumber({ ref: "number-1", clearAliases: true });
    expect(sent.update!.getClearAliases()).to.equal(true);
  });

  it("returns them under aliases from getNumber and listNumbers", async function () {
    const numbers = new Numbers(fakeClient({}));
    const one = await numbers.getNumber("number-1");
    expect(one.aliases).to.deep.equal(["01234", "5678"]);
    expect(one).to.not.have.property("aliasesList");
    const list = await numbers.listNumbers({ pageSize: 10 });
    expect(list.items[0].aliases).to.deep.equal(["01234", "5678"]);
    expect(list.items[0]).to.not.have.property("aliasesList");
  });

  it("returns [] for a Number without aliases", async function () {
    const one = await new Numbers(fakeClient({}, [])).getNumber("number-1");
    expect(one.aliases).to.deep.equal([]);
  });
});
