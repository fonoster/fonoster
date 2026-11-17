/*
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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
import { Metadata } from "@grpc/grpc-js";
import SDK from "@routr/sdk";
import { expect } from "chai";
import { buildService } from "../../../sipnet/src/agents/buildService";
import {
  RoutrApplier,
  sdkRoutrPort
} from "../../../region-agent/src/apply/RoutrApplier";
import { getWorld, World } from "./world";

// Fonoster's clients against Routr 3's Data API key (#1423): sipnet refuses to report success on
// a key Routr doesn't hold (API-083), the API server's Roomr Peer setup is a no-op on a second
// start (API-081), and the region agent's apply sends the key (API-082).

const endpoint = () => process.env.ROUTR_API_ENDPOINT as string;
const key = () => process.env.ROUTR_API_KEY as string;
const WRONG_KEY = "not-the-routr-key";

describe("@api Routr 3 API key (#1423)", function () {
  this.timeout(60_000);
  let world: World;

  before(async function () {
    world = await getWorld();
  });

  it("[API-083] a wrong key makes CreateAgent return an error and stores nothing", async function () {
    const username = `wrongkey${world.unique()}`;
    const { createAgent } = buildService({
      endpoint: endpoint(),
      insecure: true,
      apiKey: WRONG_KEY
    }).handlers;
    const metadata = new Metadata();
    metadata.set("accessKeyId", world.wsA.accessKeyId);
    const outcome = await new Promise<{ error?: unknown; response?: unknown }>(
      (done) =>
        createAgent(
          { request: { name: "Wrong key", username }, metadata } as never,
          (error, response) => done({ error, response })
        )
    );
    expect(outcome.error, "an error, never OK").to.exist;
    expect(outcome.response).to.equal(undefined);

    // Nothing was stored: the username (unique in Routr) is still free with the right key.
    const agents = new SDK.Agents({
      endpoint: endpoint(),
      insecure: true,
      apiKey: key()
    });
    const created = await agents.createAgent({ name: "Right key", username });
    await agents.deleteAgent(created.ref);
  });

  it("[API-081] the Roomr Peer setup on a second start changes nothing", async function () {
    const { upsertRoomrPeer } =
      await import("../../../apiserver/src/core/upsertRoomrPeer");
    await upsertRoomrPeer();
    await upsertRoomrPeer();

    const options = { endpoint: endpoint(), insecure: true, apiKey: key() };
    const peers = (
      await new SDK.Peers(options).listPeers({ pageSize: 1000, pageToken: "" })
    ).items.filter((p) => p.username === "roomr");
    const credentials = (
      await new SDK.Credentials(options).listCredentials({
        pageSize: 1000,
        pageToken: ""
      })
    ).items.filter((c) => c.username === "roomr");
    expect(peers, "one Peer").to.have.length(1);
    expect(credentials, "one set of Credentials").to.have.length(1);
    // Routr returns the linked Credentials expanded, not credentialsRef.
    expect(
      (peers[0] as unknown as { credentials?: { ref: string } }).credentials
        ?.ref
    ).to.equal(credentials[0].ref);
  });

  it("[API-082] the region agent's apply sends the key: everything is created with it, nothing without it", async function () {
    const acl = (ref: string) => ({
      type: "region.config",
      configVersion: 1,
      full: false,
      workspaces: {
        WOapicases: {
          kinds: {
            routr: {
              acls: [
                {
                  ref,
                  name: `Office ${ref}`,
                  allow: ["10.0.0.0/8"],
                  deny: ["0.0.0.0/0"]
                }
              ]
            }
          }
        }
      }
    });
    const u = world.unique();
    const right = new RoutrApplier(
      sdkRoutrPort({ endpoint: endpoint(), apiKey: key() })
    );
    expect(await right.apply(acl(`cp-acl-${u}`) as never)).to.deep.equal({
      created: 1,
      updated: 0,
      deleted: 0,
      failed: 0
    });
    await new SDK.Acls({
      endpoint: endpoint(),
      insecure: true,
      apiKey: key()
    }).deleteAcl(right.refs.acls![`cp-acl-${u}`]);

    const wrong = new RoutrApplier(
      sdkRoutrPort({ endpoint: endpoint(), apiKey: WRONG_KEY })
    );
    expect(await wrong.apply(acl(`cp-acl-w${u}`) as never)).to.include({
      created: 0,
      failed: 1
    });
  });
});
