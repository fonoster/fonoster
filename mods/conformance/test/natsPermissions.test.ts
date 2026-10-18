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
// NATS users and subject permissions (add-platform 4.1, build log HD-B1): runs the checked-in
// ops/rebuild/config/nats.conf (main stack: apiserver, gateway, roomr, routr) and
// ops/rebuild/cell/config/nats.conf (a cell: gateway, roomr, routr, region-agent) in Docker
// and proves each service reaches its own subjects and nothing else. Opt-in (starts containers):
//
//   NATS_ACL_TEST=docker [NATS_ACL_CONTAINER_PREFIX=fonoster-acl] [NATS_ACL_PORT=31400] npm test
//
// The second server uses NATS_ACL_PORT + 1.
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { connect, NatsConnection, StringCodec } from "nats";
import { natsInboxPrefix, Sessions } from "@fonoster/common";

const ROOT = path.join(__dirname, "..", "..", "..");
const ENABLED = process.env.NATS_ACL_TEST === "docker";
const PREFIX = process.env.NATS_ACL_CONTAINER_PREFIX ?? "fonoster-acl";
const PORT = Number(process.env.NATS_ACL_PORT ?? 31400);
const IMAGE = "nats:2.11.8-alpine";
const sc = StringCodec();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const password = (user: string) => `test-${user}-0123456789abcdef`;
const envName = (user: string) =>
  `NATS_${user.toUpperCase().replace(/-/g, "_")}_PASSWORD`;

type Server = { name: string; url: string };

function startServer(
  suffix: string,
  port: number,
  dir: string,
  users: string[]
): Server {
  const name = `${PREFIX}-${suffix}-${process.pid}`;
  const env = users.flatMap((u) => ["-e", `${envName(u)}=${password(u)}`]);
  execFileSync("docker", [
    "run",
    "-d",
    "--rm",
    "--name",
    name,
    "-p",
    `127.0.0.1:${port}:4222`,
    "-v",
    `${dir}:/etc/nats:ro`,
    ...env,
    IMAGE,
    "-c",
    "/etc/nats/nats.conf"
  ]);
  return { name, url: `nats://127.0.0.1:${port}` };
}

function stopServer(s?: Server) {
  if (!s) return;
  try {
    execFileSync("docker", ["rm", "-f", s.name], { stdio: "ignore" });
  } catch {
    // already gone
  }
}

/**
 * Connects as `user` the way the services do (natsConnectOptions): replies under the user's own
 * inbox prefix. `inboxPrefix: null` keeps the client's default `_INBOX.` prefix.
 */
async function as(
  server: Server,
  user: string,
  options: { inboxPrefix?: string | null } = {}
): Promise<NatsConnection> {
  const deadline = Date.now() + 10000;
  const inboxPrefix =
    options.inboxPrefix === null
      ? undefined
      : (options.inboxPrefix ?? natsInboxPrefix(user));
  for (;;) {
    try {
      return await connect({
        servers: server.url,
        user,
        pass: password(user),
        name: `acl-${user}`,
        ...(inboxPrefix ? { inboxPrefix } : {})
      });
    } catch (e) {
      if (Date.now() > deadline) throw e;
      await sleep(200);
    }
  }
}

/** Whether `subject` published by `from` reaches a subscriber on `to` (a permitted reader). */
async function delivered(
  from: NatsConnection,
  to: NatsConnection,
  subject: string,
  listen = subject
): Promise<boolean> {
  let got = false;
  // A refused subscription calls back with an error, never with a message.
  const sub = to.subscribe(listen, {
    callback: (err) => {
      if (!err) got = true;
    }
  });
  await to.flush();
  from.publish(subject, sc.encode("{}"));
  await from.flush().catch(() => undefined);
  await sleep(250);
  sub.unsubscribe();
  return got;
}

/**
 * Subscribes `listener` to each subject and reports whether any message arrived while `act` ran
 * (a refused subscription calls back with an error, never with a message).
 */
async function overheard(
  listener: NatsConnection,
  subjects: string[],
  act: () => Promise<unknown>
): Promise<boolean> {
  let got = false;
  const subs = subjects.map((s) =>
    listener.subscribe(s, {
      callback: (err) => {
        if (!err) got = true;
      }
    })
  );
  await listener.flush().catch(() => undefined);
  await act();
  await sleep(250);
  for (const sub of subs) sub.unsubscribe();
  return got;
}

/** Whether `user` may subscribe to `subject` (a denied subscription gets nothing). */
async function canSubscribe(
  listener: NatsConnection,
  publisher: NatsConnection,
  subject: string
): Promise<boolean> {
  return delivered(publisher, listener, subject);
}

describe("@conformance/nats permissions (per-service users)", function () {
  this.timeout(60000);
  let main: Server | undefined;
  let cell: Server | undefined;
  const conns: NatsConnection[] = [];
  let api: NatsConnection;
  let gw: NatsConnection;
  let node: NatsConnection;
  let routr: NatsConnection;

  before(async function () {
    if (!ENABLED) return this.skip();
    const work = fs.mkdtempSync(path.join(os.tmpdir(), "nats-acl-"));
    const perms = path.join(
      ROOT,
      "ops",
      "rebuild",
      "config",
      "nats-permissions"
    );
    // The main stack's NATS: the checked-in nats.conf with its permission files.
    const mainDir = path.join(work, "main");
    fs.mkdirSync(mainDir);
    fs.copyFileSync(
      path.join(ROOT, "ops", "rebuild", "config", "nats.conf"),
      path.join(mainDir, "nats.conf")
    );
    fs.cpSync(perms, path.join(mainDir, "nats-permissions"), {
      recursive: true
    });
    // The cell's NATS: its nats.conf with an empty leaf.conf (not enrolled).
    const cellDir = path.join(work, "cell");
    fs.mkdirSync(path.join(cellDir, "region"), { recursive: true });
    fs.copyFileSync(
      path.join(ROOT, "ops", "rebuild", "cell", "config", "nats.conf"),
      path.join(cellDir, "nats.conf")
    );
    fs.cpSync(perms, path.join(cellDir, "nats-permissions"), {
      recursive: true
    });
    fs.writeFileSync(path.join(cellDir, "region", "leaf.conf"), "# none\n");
    fs.chmodSync(work, 0o755);
    main = startServer("main", PORT, mainDir, [
      "apiserver",
      "gateway",
      "roomr",
      "routr"
    ]);
    cell = startServer("cell", PORT + 1, cellDir, [
      "gateway",
      "roomr",
      "routr",
      "region-agent"
    ]);
    api = await as(main, "apiserver");
    gw = await as(main, "gateway");
    node = await as(main, "roomr");
    routr = await as(main, "routr");
    conns.push(api, gw, node, routr);
  });

  after(async () => {
    await Promise.all(conns.map((c) => c.close().catch(() => undefined)));
    stopServer(main);
    stopServer(cell);
  });

  it("refuses anonymous clients and wrong passwords", async function () {
    await connect({ servers: main!.url, reconnect: false }).then(
      (c) => (c.close(), expect.fail("anonymous client accepted")),
      (e) => expect(String(e.message ?? e)).to.match(/auth/i)
    );
    await connect({
      servers: main!.url,
      user: "gateway",
      pass: "wrong",
      reconnect: false
    }).then(
      (c) => (c.close(), expect.fail("wrong password accepted")),
      (e) => expect(String(e.message ?? e)).to.match(/auth/i)
    );
  });

  it("carries each service's own traffic", async function () {
    // media-control: the gateway asks, the node answers (allow_responses).
    const nodeId = "n1";
    const cmds = node.subscribe(`media.${nodeId}.commands`, {
      callback: (_e, m) => m.respond(sc.encode('{"type":"ack"}'))
    });
    await node.flush();
    const reply = await gw.request(
      `media.${nodeId}.commands`,
      sc.encode("{}"),
      {
        timeout: 2000
      }
    );
    expect(sc.decode(reply.data)).to.equal('{"type":"ack"}');
    // ...and the control plane too (outbound placement).
    await api.request(`media.${nodeId}.commands`, sc.encode("{}"), {
      timeout: 2000
    });
    cmds.unsubscribe();
    // call.incoming: the node asks, a gateway claims.
    const claims = gw.subscribe("gateway.incoming", {
      queue: "gateway",
      callback: (_e, m) => m.respond(sc.encode('{"type":"claimed"}'))
    });
    await gw.flush();
    await node.request("gateway.incoming", sc.encode("{}"), { timeout: 2000 });
    claims.unsubscribe();
    expect(
      await delivered(node, api, `roomr.nodes.${nodeId}.heartbeat`)
    ).to.equal(true);
    expect(
      await delivered(node, gw, `roomr.nodes.${nodeId}.heartbeat`)
    ).to.equal(true);
    // Events keyed by call and by room, for any controller replica.
    expect(await delivered(node, api, "roomr.events.c1")).to.equal(true);
    expect(await delivered(node, api, "roomr.events.room.r1")).to.equal(true);
    expect(await delivered(node, gw, `media.${nodeId}.events.r1`)).to.equal(
      true
    );
    expect(await delivered(gw, api, "callrecord.sealed")).to.equal(true);
    expect(await delivered(gw, api, "registry.used")).to.equal(true);
    // A node reports unclaimed calls on its own subject; the control plane makes the webhook.
    expect(
      await delivered(node, api, `media.${nodeId}.events.call-failed`)
    ).to.equal(true);
    expect(await delivered(gw, api, "webhooks.events")).to.equal(true);
    expect(await delivered(api, api, "calls.create")).to.equal(true);
    // TrackCall: the placing replica reports its part of a call's status per ref.
    expect(await delivered(api, api, "calls.r1.events")).to.equal(true);
    expect(await delivered(routr, api, "routr.call.started")).to.equal(true);
    expect(await delivered(api, gw, "callrecord.local.maintenance")).to.equal(
      true
    );
  });

  it("refuses publishing outside a service's subjects", async function () {
    // Nobody but the node speaks for a node; nobody but a gateway files index entries.
    expect(await delivered(gw, api, "roomr.nodes.n1.heartbeat")).to.equal(
      false
    );
    expect(await delivered(gw, api, "roomr.events.c1")).to.equal(false);
    expect(await delivered(api, api, "roomr.events.c1")).to.equal(false);
    expect(await delivered(api, gw, "media.n1.events.r1")).to.equal(false);
    expect(await delivered(node, api, "callrecord.sealed")).to.equal(false);
    expect(await delivered(routr, api, "callrecord.sealed")).to.equal(false);
    // Calls are created by the control plane only.
    expect(await delivered(gw, api, "calls.create")).to.equal(false);
    expect(await delivered(node, api, "calls.create")).to.equal(false);
    expect(await delivered(gw, api, "calls.r1.events")).to.equal(false);
    expect(await delivered(node, api, "calls.r1.events")).to.equal(false);
    // Record maintenance is asked by the control plane only.
    expect(await delivered(node, gw, "callrecord.local.maintenance")).to.equal(
      false
    );
    // Media-control commands come from gateways and the control plane, never Routr or a node.
    expect(await delivered(routr, node, "media.n1.commands")).to.equal(false);
    expect(await delivered(node, node, "media.n2.commands")).to.equal(false);
    // Routr's events are Routr's.
    expect(await delivered(gw, api, "routr.call.started")).to.equal(false);
    // Catalog use comes from gateways.
    expect(await delivered(node, api, "registry.used")).to.equal(false);
    // A node cannot speak for a workspace on the webhook bus (M6).
    expect(await delivered(node, api, "webhooks.events")).to.equal(false);
  });

  it("refuses subscriptions outside a service's subjects", async function () {
    expect(await canSubscribe(routr, gw, "media.n1.commands")).to.equal(false);
    expect(await canSubscribe(node, gw, "callrecord.sealed")).to.equal(false);
    expect(await canSubscribe(gw, api, "calls.create")).to.equal(false);
    expect(await canSubscribe(node, routr, "routr.call.started")).to.equal(
      false
    );
  });

  it("keeps each service's replies to itself (per-user inbox prefixes)", async function () {
    // The node answers the gateway's media-control request with something private.
    const cmds = node.subscribe("media.n9.commands", {
      callback: (_e, m) => m.respond(sc.encode('{"secret":"reply"}'))
    });
    await node.flush();
    // Another service, a second media node and Routr try every inbox they could read.
    const otherNode = await as(main!, "roomr");
    conns.push(otherNode);
    const inboxes = ["_INBOX.>", `${natsInboxPrefix("gateway")}.>`];
    for (const eavesdropper of [api, otherNode, routr]) {
      let answered = "";
      const heard = await overheard(eavesdropper, inboxes, async () => {
        const reply = await gw.request("media.n9.commands", sc.encode("{}"), {
          timeout: 2000
        });
        answered = sc.decode(reply.data);
      });
      expect(answered).to.equal('{"secret":"reply"}');
      expect(heard).to.equal(false);
    }
    // ...and the control plane's replies stay its own too.
    const gwHeard = await overheard(
      gw,
      ["_INBOX.>", `${natsInboxPrefix("apiserver")}.>`],
      () => api.request("media.n9.commands", sc.encode("{}"), { timeout: 2000 })
    );
    expect(gwHeard).to.equal(false);
    cmds.unsubscribe();
  });

  it("refuses replies to a client that keeps the shared _INBOX prefix", async function () {
    const cmds = node.subscribe("media.n8.commands", {
      callback: (_e, m) => m.respond(sc.encode('{"type":"ack"}'))
    });
    await node.flush();
    const shared = await as(main!, "gateway", { inboxPrefix: null });
    conns.push(shared);
    const ok = await shared
      .request("media.n8.commands", sc.encode("{}"), { timeout: 1000 })
      .then(
        () => true,
        () => false
      );
    expect(ok).to.equal(false);
    // A prefix of another user is refused the same way.
    const borrowed = await as(main!, "gateway", {
      inboxPrefix: natsInboxPrefix("apiserver")
    });
    conns.push(borrowed);
    const ok2 = await borrowed
      .request("media.n8.commands", sc.encode("{}"), { timeout: 1000 })
      .then(
        () => true,
        () => false
      );
    expect(ok2).to.equal(false);
    cmds.unsubscribe();
  });

  it("lets each service write only its own session-registry entries", async function () {
    const nodeKv = await Sessions.openSessions(node);
    const gwKv = await Sessions.openSessions(gw);
    const apiKv = await Sessions.openSessions(api);
    // The node writes nodes.*; the control plane reads it (get and watch).
    await nodeKv.put("nodes.n1", sc.encode('{"nodeId":"n1","rooms":1}'));
    expect(await Sessions.getSession(apiKv, "nodes", "n1")).to.include({
      nodeId: "n1"
    });
    const seen: string[] = [];
    const stop = await Sessions.watchSessions(apiKv, "nodes", (e) =>
      seen.push(e.id)
    );
    await sleep(300);
    stop();
    expect(seen).to.include("n1");
    // The gateway writes calls.* and gateways.*.
    await gwKv.put("calls.c1", sc.encode('{"callRef":"c1"}'));
    await gwKv.put("gateways.g1", sc.encode('{"gatewayRef":"g1"}'));
    // Everything else is refused.
    const refused = async (kv: typeof nodeKv, key: string) => {
      const ok = await kv.put(key, sc.encode("{}"), { timeout: 1000 }).then(
        () => true,
        () => false
      );
      expect(ok, key).to.equal(false);
    };
    await refused(apiKv, "nodes.forged");
    await refused(gwKv, "nodes.forged");
    await refused(nodeKv, "calls.forged");
    await refused(apiKv, "calls.forged");
    expect(await Sessions.getSession(apiKv, "nodes", "forged")).to.equal(
      undefined
    );
    // Nobody may delete the bucket.
    const jsm = await api.jetstreamManager({ checkAPI: false });
    const deleted = await jsm.streams.delete("KV_fonoster_sessions").then(
      () => true,
      () => false
    );
    expect(deleted).to.equal(false);
  });

  it("keeps the media node write-only on the session registry (M7)", async function () {
    const nodeKv = await Sessions.openSessions(node);
    await nodeKv.put("nodes.n7", sc.encode('{"nodeId":"n7"}'));
    await nodeKv.put("rooms.r7", sc.encode('{"roomRef":"r7"}'));
    // A JetStream API request the user may not publish gets no answer.
    const answered = (conn: NatsConnection, subject: string, body: unknown) =>
      conn
        .request(subject, sc.encode(JSON.stringify(body)), { timeout: 1000 })
        .then(
          (m) => !sc.decode(m.data).includes('"error"'),
          () => false
        );
    const getLast = {
      last_by_subj: "$KV.fonoster_sessions.nodes.n7"
    };
    // The control plane reads the entry...
    expect(
      await answered(api, "$JS.API.DIRECT.GET.KV_fonoster_sessions", getLast)
    ).to.equal(true);
    // ...the node can't read any entry (its own, other nodes', calls)...
    expect(
      await answered(node, "$JS.API.DIRECT.GET.KV_fonoster_sessions", getLast)
    ).to.equal(false);
    expect(
      await answered(node, "$JS.API.STREAM.MSG.GET.KV_fonoster_sessions", {
        last_by_subj: "$KV.fonoster_sessions.calls.c1"
      })
    ).to.equal(false);
    // ...watch the registry...
    expect(
      await answered(node, "$JS.API.CONSUMER.CREATE.KV_fonoster_sessions", {
        stream_name: "KV_fonoster_sessions",
        config: { deliver_policy: "last_per_subject", ack_policy: "none" }
      })
    ).to.equal(false);
    // ...or delete another service's watcher.
    expect(
      await answered(
        node,
        "$JS.API.CONSUMER.DELETE.KV_fonoster_sessions.any-watcher",
        {}
      )
    ).to.equal(false);
    // It still can't write outside nodes.* and rooms.*.
    const wrote = await nodeKv
      .put("gateways.g7", sc.encode("{}"), { timeout: 1000 })
      .then(
        () => true,
        () => false
      );
    expect(wrote).to.equal(false);
  });

  it("limits a cell's region agent to region.> and its local subjects", async function () {
    const agent = await as(cell!, "region-agent");
    const cgw = await as(cell!, "gateway");
    const cnode = await as(cell!, "roomr");
    conns.push(agent, cgw, cnode);
    // Bring-your-own key requests: the gateway asks, the agent answers.
    const keys = agent.subscribe("cell.workspacekeys.get", {
      callback: (_e, m) => m.respond(sc.encode('{"value":"k"}'))
    });
    await agent.flush();
    await cgw.request("cell.workspacekeys.get", sc.encode("{}"), {
      timeout: 2000
    });
    // The key in the reply reaches the gateway only: the media node cannot read its inbox.
    const heard = await overheard(
      cnode,
      ["_INBOX.>", `${natsInboxPrefix("gateway")}.>`],
      () =>
        cgw.request("cell.workspacekeys.get", sc.encode("{}"), {
          timeout: 2000
        })
    );
    expect(heard).to.equal(false);
    keys.unsubscribe();
    expect(await delivered(cgw, agent, "callrecord.sealed")).to.equal(true);
    expect(await delivered(cnode, agent, "roomr.nodes.n1.heartbeat")).to.equal(
      true
    );
    expect(await delivered(agent, agent, "region.r1.heartbeat")).to.equal(true);
    // The agent drives nothing in the cell.
    expect(await delivered(agent, cnode, "media.n1.commands")).to.equal(false);
    expect(await delivered(agent, agent, "callrecord.sealed")).to.equal(false);
    // Only the agent talks over the link.
    expect(await delivered(cgw, agent, "region.r1.index")).to.equal(false);
  });
});
