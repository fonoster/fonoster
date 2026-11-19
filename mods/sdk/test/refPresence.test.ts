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
import { jsonToObject } from "../src/client/jsonToObject";
import { FonosterClient } from "../src/client/types";
import * as NodeAgents from "../src/generated/node/agents_pb";
import * as NodeDomains from "../src/generated/node/domains_pb";
import * as NodeNumbers from "../src/generated/node/numbers_pb";
import * as NodeTrunks from "../src/generated/node/trunks_pb";
import * as WebAgents from "../src/generated/web/agents_pb";
import * as WebDomains from "../src/generated/web/domains_pb";
import * as WebNumbers from "../src/generated/web/numbers_pb";
import * as WebTrunks from "../src/generated/web/trunks_pb";
import { Numbers } from "../src/Numbers";
import { Trunks } from "../src/Trunks";
import { clearRefs } from "../src/utils";

type Message = { serializeBinary(): Uint8Array };
type MessageClass<T extends Message> = (new () => T) & {
  deserializeBinary(bytes: Uint8Array): T;
};

/** Builds the request the way the SDK does, then reads it back off the wire. */
function overTheWire<T extends Message>(
  constructor: MessageClass<T>,
  json: Record<string, unknown>
): T {
  const built = jsonToObject({ json, objectConstructor: constructor });
  return constructor.deserializeBinary(built.serializeBinary());
}

// Each update request and the refs that "" clears.
const CASES = [
  {
    name: "UpdateNumberRequest",
    classes: [NodeNumbers.UpdateNumberRequest, WebNumbers.UpdateNumberRequest],
    refs: ["trunkRef"]
  },
  {
    name: "UpdateAgentRequest",
    classes: [NodeAgents.UpdateAgentRequest, WebAgents.UpdateAgentRequest],
    refs: ["domainRef", "credentialsRef"]
  },
  {
    name: "UpdateDomainRequest",
    classes: [NodeDomains.UpdateDomainRequest, WebDomains.UpdateDomainRequest],
    refs: ["accessControlListRef"]
  },
  {
    name: "UpdateTrunkRequest",
    classes: [NodeTrunks.UpdateTrunkRequest, WebTrunks.UpdateTrunkRequest],
    refs: [
      "accessControlListRef",
      "inboundCredentialsRef",
      "outboundCredentialsRef"
    ]
  }
];

const has = (message: unknown, ref: string) =>
  (message as Record<string, () => boolean>)[
    `has${ref.charAt(0).toUpperCase()}${ref.slice(1)}`
  ]();

describe("@sdk[refPresence] an empty ref clears, an absent one keeps", function () {
  for (const { name, classes, refs } of CASES) {
    for (const [build, constructor] of [
      ["node", classes[0]],
      ["web", classes[1]]
    ] as const) {
      it(`${name} (${build}) sends "" and leaves out an absent ref`, function () {
        for (const ref of refs) {
          const cleared = overTheWire(
            constructor as unknown as MessageClass<Message>,
            { ref: "r-1", [ref]: "" }
          );
          expect(has(cleared, ref), `${ref} ""`).to.equal(true);

          const renamed = overTheWire(
            constructor as unknown as MessageClass<Message>,
            { ref: "r-1", name: "Renamed" }
          );
          expect(has(renamed, ref), `${ref} absent`).to.equal(false);
        }
      });
    }
  }

  it('updateTrunk sends "" refs and leaves out absent ones', async function () {
    let sent: NodeTrunks.UpdateTrunkRequest | undefined;
    const client = {
      getMetadata: () => ({}),
      getTrunksClient: () => ({
        updateTrunk: (
          req: NodeTrunks.UpdateTrunkRequest,
          _m: unknown,
          cb: (e: null, r: unknown) => void
        ) => {
          sent = NodeTrunks.UpdateTrunkRequest.deserializeBinary(
            req.serializeBinary()
          );
          cb(null, { toObject: () => ({ ref: "trunk-1" }) });
        }
      })
    } as unknown as FonosterClient;

    await new Trunks(client).updateTrunk({
      ref: "trunk-1",
      accessControlListRef: ""
    });

    expect(sent!.hasAccessControlListRef()).to.equal(true);
    expect(sent!.getAccessControlListRef()).to.equal("");
    expect(sent!.hasInboundCredentialsRef()).to.equal(false);
    expect(sent!.hasOutboundCredentialsRef()).to.equal(false);
  });

  it('updateNumber sends null refs as "" and leaves out absent ones', async function () {
    let sent: NodeNumbers.UpdateNumberRequest | undefined;
    const client = {
      getMetadata: () => ({}),
      getNumbersClient: () => ({
        updateNumber: (
          req: NodeNumbers.UpdateNumberRequest,
          _m: unknown,
          cb: (e: null, r: unknown) => void
        ) => {
          sent = NodeNumbers.UpdateNumberRequest.deserializeBinary(
            req.serializeBinary()
          );
          cb(null, new NodeNumbers.UpdateNumberResponse());
        }
      })
    } as unknown as FonosterClient;

    await new Numbers(client).updateNumber({
      ref: "number-1",
      trunkRef: null,
      appRef: null
    });

    expect(sent!.hasTrunkRef()).to.equal(true);
    expect(sent!.getTrunkRef()).to.equal("");
    expect(sent!.hasAppRef()).to.equal(true);
    expect(sent!.getAppRef()).to.equal("");
    expect(sent!.hasAgentAor()).to.equal(false);
  });

  it('updateTrunk sends null refs as ""', async function () {
    let sent: NodeTrunks.UpdateTrunkRequest | undefined;
    const client = {
      getMetadata: () => ({}),
      getTrunksClient: () => ({
        updateTrunk: (
          req: NodeTrunks.UpdateTrunkRequest,
          _m: unknown,
          cb: (e: null, r: unknown) => void
        ) => {
          sent = NodeTrunks.UpdateTrunkRequest.deserializeBinary(
            req.serializeBinary()
          );
          cb(null, { toObject: () => ({ ref: "trunk-1" }) });
        }
      })
    } as unknown as FonosterClient;

    await new Trunks(client).updateTrunk({
      ref: "trunk-1",
      inboundCredentialsRef: null
    });

    expect(sent!.hasInboundCredentialsRef()).to.equal(true);
    expect(sent!.getInboundCredentialsRef()).to.equal("");
    expect(sent!.hasAccessControlListRef()).to.equal(false);
  });

  it('clearRefs turns only the listed null fields into ""', function () {
    expect(
      clearRefs(
        { ref: "r", domainRef: null, name: null, credentialsRef: "c" },
        ["domainRef", "credentialsRef"]
      )
    ).to.deep.equal({
      ref: "r",
      domainRef: "",
      name: null,
      credentialsRef: "c"
    });
  });

  it("createNumber and createTrunk send no ref for null", async function () {
    let number: NodeNumbers.CreateNumberRequest | undefined;
    let trunk: NodeTrunks.CreateTrunkRequest | undefined;
    const client = {
      getMetadata: () => ({}),
      getNumbersClient: () => ({
        createNumber: (
          req: NodeNumbers.CreateNumberRequest,
          _m: unknown,
          cb: (e: null, r: unknown) => void
        ) => {
          number = NodeNumbers.CreateNumberRequest.deserializeBinary(
            req.serializeBinary()
          );
          cb(null, new NodeNumbers.CreateNumberResponse());
        }
      }),
      getTrunksClient: () => ({
        createTrunk: (
          req: NodeTrunks.CreateTrunkRequest,
          _m: unknown,
          cb: (e: null, r: unknown) => void
        ) => {
          trunk = NodeTrunks.CreateTrunkRequest.deserializeBinary(
            req.serializeBinary()
          );
          cb(null, { toObject: () => ({ ref: "trunk-1" }) });
        }
      })
    } as unknown as FonosterClient;

    await new Numbers(client).createNumber({
      name: "Outbound",
      telUrl: "tel:+18095550111",
      city: "Santiago",
      country: "Dominican Republic",
      countryIsoCode: "DO",
      trunkRef: null,
      appRef: null
    });
    await new Trunks(client).createTrunk({
      name: "Carrier",
      inboundUri: "carrier.pstn.fonoster.local",
      accessControlListRef: null,
      inboundCredentialsRef: null,
      outboundCredentialsRef: null
    });

    expect(number!.getName()).to.equal("Outbound");
    expect(number!.getTrunkRef()).to.equal("");
    expect(number!.getAppRef()).to.equal("");
    expect(number!.getIngressHandlerCase()).to.equal(0);
    expect(trunk!.getName()).to.equal("Carrier");
    expect(trunk!.getAccessControlListRef()).to.equal("");
    expect(trunk!.getInboundCredentialsRef()).to.equal("");
    expect(trunk!.getOutboundCredentialsRef()).to.equal("");
  });
});
