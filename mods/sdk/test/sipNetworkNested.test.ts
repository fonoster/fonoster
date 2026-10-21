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
import { Agent, ListAgentsResponse } from "../src/generated/node/agents_pb";
import { Number as NumberPB } from "../src/generated/node/numbers_pb";

type Callback = (err: Error | null, response: unknown) => void;

/** A Fonoster client whose RPCs answer with the given message. */
function clientAnswering(method: string, response: unknown) {
  const rpc = {
    [method]: (_req: unknown, _metadata: unknown, callback: Callback) =>
      callback(null, response)
  };
  return {
    getAgentsClient: () => rpc,
    getNumbersClient: () => rpc,
    getMetadata: () => ({})
  };
}

function sipAgent() {
  const agent = new Agent();
  agent.setRef("ag-1");
  agent.setName("Maria");
  agent.setUsername("maria");
  const domain = new Agent.Domain();
  domain.setRef("dm-1");
  domain.setName("Acme HQ");
  domain.setDomainUri("acme.sip.fonoster.local");
  agent.setDomain(domain);
  const credentials = new Agent.Credentials();
  credentials.setRef("cr-1");
  credentials.setName("Maria's phone");
  credentials.setUsername("maria");
  agent.setCredentials(credentials);
  return agent;
}

describe("@sdk[SIP network nested objects]", function () {
  // Regression: these methods called toObject() on objects objectToJson had already
  // made plain, so any SIP agent with a domain broke the SIP agents screen.
  it("lists SIP agents with their domain and credentials", async function () {
    const { Agents } = await import("../src/Agents");
    const list = new ListAgentsResponse();
    list.setItemsList([sipAgent()]);

    const response = await new Agents(
      clientAnswering("listAgents", list) as never
    ).listAgents({ pageSize: 10 });

    expect(response.items[0].domain).to.deep.equal({
      ref: "dm-1",
      name: "Acme HQ",
      domainUri: "acme.sip.fonoster.local"
    });
    expect(response.items[0].credentials).to.deep.equal({
      ref: "cr-1",
      name: "Maria's phone",
      username: "maria"
    });
  });

  it("gets a SIP agent with its domain and credentials", async function () {
    const { Agents } = await import("../src/Agents");

    const agent = await new Agents(
      clientAnswering("getAgent", sipAgent()) as never
    ).getAgent("ag-1");

    expect(agent.domain).to.deep.include({
      domainUri: "acme.sip.fonoster.local"
    });
    expect(agent.credentials).to.deep.include({ username: "maria" });
  });

  it("gets a number with its trunk", async function () {
    const { Numbers } = await import("../src/Numbers");
    const number = new NumberPB();
    number.setRef("nm-1");
    number.setTelUrl("tel:+18095550100");
    const trunk = new NumberPB.Trunk();
    trunk.setRef("tr-1");
    trunk.setName("Acme");
    number.setTrunk(trunk);

    const response = await new Numbers(
      clientAnswering("getNumber", number) as never
    ).getNumber("nm-1");

    expect(response.trunk).to.deep.equal({ ref: "tr-1", name: "Acme" });
  });
});
