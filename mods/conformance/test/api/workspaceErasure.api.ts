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
import { randomUUID } from "crypto";
import { expect } from "chai";
import { connect, NatsConnection, StringCodec } from "nats";
import { Account, getWorld, Workspace, World } from "./world";

// identity "Deleting a workspace erases its call records after 30 days" (API-074 in
// mods/conformance/catalog/areas/api.md, #1318). A workspace deleted through the API, directly or
// with its owner, leaves a deletion record in Identity's database (a trigger, so the cascade from
// a deleted user counts). Once that record is older than 30 days, the control plane's sweep asks
// the record's region to erase each of its call records; the region's record writer is a stand-in
// on its maintenance subject.

const sc = StringCodec();

describe("@api identity: a deleted workspace's call records", function () {
  this.timeout(60_000);
  let world: World;
  let nc: NatsConnection;
  const region = `public-${randomUUID().slice(0, 8)}`;
  const requests: Record<string, unknown>[] = [];

  before(async function () {
    world = await getWorld();
    nc = await connect({ servers: world.stack.natsUrl });
    // The region's record writer: erases and answers with the audit entry it wrote.
    nc.subscribe(`callrecord.${region}.maintenance`, {
      callback: (_e, msg) => {
        const req = JSON.parse(sc.decode(msg.data));
        requests.push(req);
        msg.respond(
          sc.encode(
            JSON.stringify({
              type: "ack",
              version: 2,
              audit: [
                {
                  callRef: req.callRef,
                  workspaceRef: req.workspaceRef,
                  action: "erase",
                  part: "all",
                  reason: req.reason,
                  actor: req.actor,
                  at: new Date().toISOString(),
                  version: 2
                }
              ]
            })
          )
        );
      }
    });
    await nc.flush();
  });

  after(async () => nc?.close());

  const index = (callRef: string, accessKeyId: string) =>
    world.stack.apiDb.prisma.callRecord.create({
      data: {
        callRef,
        accessKeyId,
        appRef: null,
        fromNumber: "+15550001111",
        toNumber: "+15550002222",
        direction: "inbound",
        status: "completed",
        startedAt: new Date(),
        endedAt: new Date(),
        durationSeconds: 30,
        region,
        location: region,
        version: 1,
        parts: ["messages", "recording"]
      }
    });

  const deletion = async (ws: Workspace) =>
    (await world.stack.identitySql(
      `SELECT access_key_id FROM workspace_deletions WHERE access_key_id = $1`,
      ws.accessKeyId
    )) as { access_key_id: string }[];

  /** Runs one tick of the sweep, as the apiserver's retention timer does. */
  async function sweep() {
    const { runWorkspaceErasure, natsMaintenanceClient } =
      await import("../../../apiserver/src/records/maintenance");
    const { createWorkspaceDirectory } = await import("@fonoster/identity");
    return runWorkspaceErasure(
      world.stack.apiDb.prisma as never,
      natsMaintenanceClient(nc, 5000),
      createWorkspaceDirectory(world.stack.identityPrisma as never)
    );
  }

  /** A workspace with two call records, deleted by `remove`, and a live workspace's record. */
  async function check(
    remove: (owner: Account, ws: Workspace) => Promise<void>
  ) {
    const owner = await world.signUp("Leaving");
    const ws = await world.createWorkspace(owner, `Gone ${world.unique()}`);
    const refs: string[] = [randomUUID(), randomUUID()];
    for (const ref of refs) await index(ref, ws.accessKeyId);
    const live = randomUUID();
    await index(live, world.wsA.accessKeyId);

    await remove(owner, ws);
    expect(await deletion(ws)).to.have.length(1);
    const row = (ref: string) =>
      world.stack.apiDb.prisma.callRecord.findUnique({
        where: { callRef: ref }
      });

    // Within the grace nothing is erased.
    await sweep();
    expect(
      requests.filter((r) => refs.includes(r.callRef as string))
    ).to.deep.equal([]);
    expect((await row(refs[0]))?.erasedAt).to.equal(null);

    await world.stack.identitySql(
      `UPDATE workspace_deletions SET deleted_at = now() - interval '31 days' WHERE access_key_id = $1`,
      ws.accessKeyId
    );
    const erased = await sweep();
    expect(erased).to.include.members(refs);
    expect(erased).to.not.include(live);
    for (const ref of refs) {
      expect(requests.find((r) => r.callRef === ref)).to.deep.include({
        op: "erase",
        workspaceRef: ws.accessKeyId,
        reason: "workspace deleted",
        actor: "system:workspace-deleted"
      });
      expect(await row(ref)).to.deep.include({
        status: "erased",
        fromNumber: null,
        toNumber: null,
        parts: []
      });
      const audit = await world.stack.apiDb.prisma.callRecordAudit.findMany({
        where: { callRef: ref }
      });
      expect(
        audit.map((a: { action: string; actor: string }) => [a.action, a.actor])
      ).to.deep.equal([["erase", "system:workspace-deleted"]]);
    }
    expect((await row(live))?.erasedAt).to.equal(null);
  }

  it("[API-074] erases the call records of a workspace deleted 31 days ago", async function () {
    await check(async (owner, ws) => {
      await world.raw.call(
        await world.as(owner, ws),
        "Workspaces",
        "deleteWorkspace",
        { ref: ws.ref }
      );
    });
  });

  it("[API-074] counts a re-created workspace as live, and restarts the grace when it is deleted again", async function () {
    const { createWorkspaceDirectory } = await import("@fonoster/identity");
    const directory = createWorkspaceDirectory(
      world.stack.identityPrisma as never
    );
    const owner = await world.signUp("Returning");
    const ws = await world.createWorkspace(owner, `Back ${world.unique()}`);
    const callRef = randomUUID();
    await index(callRef, ws.accessKeyId);
    await world.raw.call(
      await world.as(owner, ws),
      "Workspaces",
      "deleteWorkspace",
      { ref: ws.ref }
    );
    expect(await directory.isDeleted(ws.accessKeyId)).to.equal(true);
    await world.stack.identitySql(
      `UPDATE workspace_deletions SET deleted_at = now() - interval '31 days' WHERE access_key_id = $1`,
      ws.accessKeyId
    );

    // The row comes back with the same access key (an operator restore, or `fonoster-owner
    // create` after the first user was deleted); the deletion record is still there.
    await world.stack.identitySql(
      `INSERT INTO workspaces (ref, access_key_id, name, owner_ref, region) VALUES ($1, $2, 'Back', $3, 'default')`,
      ws.ref,
      ws.accessKeyId,
      owner.userRef
    );
    expect(await deletion(ws)).to.have.length(1);
    expect(await directory.isDeleted(ws.accessKeyId)).to.equal(false);
    expect(await sweep()).to.not.include(callRef);

    // Deleted again: the 30 days start over.
    await world.stack.identitySql(
      `DELETE FROM workspaces WHERE ref = $1`,
      ws.ref
    );
    const [{ recent }] = (await world.stack.identitySql(
      `SELECT deleted_at > now() - interval '1 minute' AS recent FROM workspace_deletions WHERE access_key_id = $1`,
      ws.accessKeyId
    )) as { recent: boolean }[];
    expect(recent).to.equal(true);
    expect(await directory.isDeleted(ws.accessKeyId)).to.equal(true);
    expect(await sweep()).to.not.include(callRef);
    const row = await world.stack.apiDb.prisma.callRecord.findUnique({
      where: { callRef }
    });
    expect(row?.erasedAt).to.equal(null);
    expect(requests.filter((r) => r.callRef === callRef)).to.deep.equal([]);
  });

  it("[API-074] erases the call records of a workspace deleted with its owner", async function () {
    await check(async (owner) => {
      await world.raw.call(owner.user, "Users", "deleteUser", {
        ref: owner.userRef
      });
    });
  });
});
