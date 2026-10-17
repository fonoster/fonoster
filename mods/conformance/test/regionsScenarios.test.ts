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
import { randomBytes } from "crypto";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import {
  ControlAction,
  Harness,
  loadScenarios,
  NatsRegionCellPeer,
  runScenario
} from "../src";
import {
  accessToken,
  ControlPlane,
  startControlPlane,
  WS
} from "./regions/controlPlane";

// The regions scenarios (harden-conformance 3.1, scenarios/regions): the runner plays a region's
// cell against the real control plane (apiserver regions, its routers and the records relay) over
// NATS. `control` steps act on the control plane's side: enroll, re-issue, disconnect, and a
// member reading a private recording through the relay. Needs CONFORMANCE_NATS_URL and
// PERSISTENCE_TEST_DATABASE_URL; skips otherwise.

const NATS_URL = process.env.CONFORMANCE_NATS_URL;

class RegionsHarness implements Harness {
  readonly peer = new NatsRegionCellPeer();
  private conns: NatsConnection[] = [];
  private reissued?: string;

  constructor(
    private readonly cp: ControlPlane,
    private readonly id: string,
    private readonly ref: string,
    private readonly token: string
  ) {}

  vars() {
    return { region: this.ref, workspace: WS };
  }

  async control(action: ControlAction) {
    switch (action.op) {
      case "enroll": {
        const token =
          action.token === "expired"
            ? this.cp.expiredToken(this.ref, this.id)
            : action.token === "reissued"
              ? this.reissued!
              : action.token === "invalid"
                ? "not-a-jwt"
                : this.token;
        const r = await this.cp.enroll(
          token,
          randomBytes(32).toString("base64url")
        );
        if (r.status === 200) {
          const nc = await connect({
            servers: NATS_URL,
            inboxPrefix: `region.${this.ref}._INBOX`
          });
          this.conns.push(nc);
          await this.peer.attach(nc, this.ref);
        }
        this.peer.push({
          type: "region.enrollment",
          status: r.status,
          ...r.body
        });
        return;
      }
      case "reissue":
        this.reissued = await this.cp.reissue(this.id);
        return;
      case "disconnect": {
        const r = await this.cp.disconnect(this.id);
        this.peer.push({ type: "region.disconnected", status: r.status });
        return;
      }
      case "relay": {
        const callRef = String(action.callRef);
        await this.cp.db.prisma.callRecord.create({
          data: {
            callRef,
            accessKeyId: WS,
            status: "completed",
            startedAt: new Date(),
            region: this.ref,
            location: "cell://local",
            version: 1
          }
        });
        // A member's browser: the answer becomes a frame when it completes.
        void fetch(`${this.cp.base}/api/records/${callRef}/recording`, {
          headers: {
            authorization: `Bearer ${accessToken("WORKSPACE_ADMIN")}`,
            "x-accesskey-id": WS
          }
        }).then(async (res) => {
          const text = await res.text();
          let error: string | undefined;
          try {
            error = JSON.parse(text).error;
          } catch {
            error = undefined;
          }
          this.peer.push({
            type: "relay.result",
            status: res.status,
            contentType: res.headers.get("content-type"),
            ...(error ? { error } : { body: text })
          });
        });
        return;
      }
      default:
        throw new Error(`unknown control op ${action.op}`);
    }
  }

  async measure(name: string) {
    const credentials = (revoked: boolean) =>
      this.cp.db.prisma.regionCredential.count({
        where: {
          regionRef: this.ref,
          revokedAt: revoked ? { not: null } : null
        }
      });
    switch (name) {
      case "regionStatus":
        return this.cp.status(this.ref);
      case "liveCredentials":
        return credentials(false);
      case "revokedCredentials":
        return credentials(true);
      default:
        return undefined;
    }
  }

  async close() {
    this.peer.close();
    for (const nc of this.conns) await nc.close().catch(() => undefined);
  }
}

describe("@conformance regions scenarios (runner plays the cell)", function () {
  this.timeout(60_000);
  let cpNc: NatsConnection;
  let cp: ControlPlane | undefined;

  before(async function () {
    if (!NATS_URL) return this.skip();
    cpNc = await connect({ servers: NATS_URL });
    cp = await startControlPlane({
      nc: cpNc,
      leafUrl: "tls://leaf.example.com:7422"
    });
    if (!cp) return this.skip();
  });

  after(async function () {
    await cp?.close();
    await cpNc?.close();
  });

  for (const scenario of loadScenarios("regions")) {
    it(`${scenario.name}`, async function () {
      if (!cp) return this.skip();
      // One fresh region per scenario, owned by the test user and serving WS.
      const id = `sc-${scenario.name}`.slice(0, 30).replace(/-$/, "");
      const { ref, token } = await cp.createRegion(id);
      const harness = new RegionsHarness(cp, id, ref, token);
      const result = await runScenario(scenario, {
        connect: () => harness.peer,
        harness,
        keepOpen: true
      });
      await harness.close();
      expect(result.status, result.reason).to.equal("passed");
    });
  }
});
