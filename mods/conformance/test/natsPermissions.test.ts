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
// ops/rebuild/config/nats.conf (main stack: apiserver, appbridge, roomr, routr) and
// ops/bundle/config/region/nats.conf (a private region: appbridge, roomr, routr, region-agent) in Docker
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
import {
  AckPolicy,
  connect,
  NatsConnection,
  RetentionPolicy,
  StorageType,
  StringCodec
} from "nats";
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
      path.join(ROOT, "ops", "bundle", "config", "region", "nats.conf"),
      path.join(cellDir, "nats.conf")
    );
    fs.cpSync(perms, path.join(cellDir, "nats-permissions"), {
      recursive: true
    });
    fs.writeFileSync(path.join(cellDir, "region", "leaf.conf"), "# none\n");
    fs.chmodSync(work, 0o755);
    main = startServer("main", PORT, mainDir, [
      "apiserver",
      "appbridge",
      "roomr",
      "routr"
    ]);
    cell = startServer("cell", PORT + 1, cellDir, [
      "appbridge",
      "roomr",
      "routr",
      "region-agent"
    ]);
    api = await as(main, "apiserver");
    gw = await as(main, "appbridge");
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
      user: "appbridge",
      pass: "wrong",
      reconnect: false
    }).then(
      (c) => (c.close(), expect.fail("wrong password accepted")),
      (e) => expect(String(e.message ?? e)).to.match(/auth/i)
    );
  });

  it("carries each service's own traffic", async function () {
    // Call control between AppBridge replicas (the hang-up endpoint): one asks, the call's
    // owner answers (allow_responses). Roomr nodes reach AppBridge over gRPC, not NATS.
    const owner = await as(main!, "appbridge");
    conns.push(owner);
    const control = owner.subscribe("appbridge.calls.c1", {
      callback: (_e, m) => m.respond(sc.encode('{"type":"ack"}'))
    });
    await owner.flush();
    const reply = await gw.request("appbridge.calls.c1", sc.encode("{}"), {
      timeout: 2000
    });
    expect(sc.decode(reply.data)).to.equal('{"type":"ack"}');
    control.unsubscribe();
    const nodeId = "n1";
    expect(
      await delivered(node, api, `roomr.nodes.${nodeId}.heartbeat`)
    ).to.equal(true);
    // Events keyed by call and by room, for any controller replica.
    expect(await delivered(node, api, "roomr.events.c1")).to.equal(true);
    expect(await delivered(node, api, "roomr.events.room.r1")).to.equal(true);
    expect(await delivered(gw, api, "callrecord.sealed")).to.equal(true);
    expect(await delivered(gw, api, "registry.used")).to.equal(true);
    expect(await delivered(gw, api, "webhooks.events")).to.equal(true);
    expect(await delivered(api, api, "calls.create")).to.equal(true);
    // TrackCall: the placing replica reports its part of a call's status per ref.
    expect(await delivered(api, api, "calls.r1.events")).to.equal(true);
    expect(await delivered(api, gw, "callrecord.local.maintenance")).to.equal(
      true
    );
  });

  it("refuses publishing outside a service's subjects", async function () {
    // Nobody but the node speaks for a node; nobody but an AppBridge files index entries.
    expect(await delivered(gw, api, "roomr.nodes.n1.heartbeat")).to.equal(
      false
    );
    expect(await delivered(gw, api, "roomr.events.c1")).to.equal(false);
    expect(await delivered(api, api, "roomr.events.c1")).to.equal(false);
    expect(await delivered(api, gw, "media.n1.events.r1")).to.equal(false);
    expect(await delivered(node, api, "callrecord.sealed")).to.equal(false);
    expect(await delivered(routr, api, "callrecord.sealed")).to.equal(false);
    // The API server no longer reads Routr's call events (call history is the record index).
    expect(await delivered(routr, api, "routr.call.started")).to.equal(false);
    // Calls are created by the control plane only.
    expect(await delivered(gw, api, "calls.create")).to.equal(false);
    expect(await delivered(node, api, "calls.create")).to.equal(false);
    expect(await delivered(gw, api, "calls.r1.events")).to.equal(false);
    expect(await delivered(node, api, "calls.r1.events")).to.equal(false);
    // Record maintenance is asked by the control plane only.
    expect(await delivered(node, gw, "callrecord.local.maintenance")).to.equal(
      false
    );
    // No media commands, call offers or AppBridge heartbeats on NATS any more (redesign-roomr):
    // nodes take commands over gRPC and open a control stream per call to AppBridge.
    expect(await delivered(gw, node, "media.n1.commands")).to.equal(false);
    expect(await delivered(api, node, "media.n1.commands")).to.equal(false);
    expect(await delivered(node, gw, "appbridge.incoming")).to.equal(false);
    expect(await delivered(api, gw, "appbridge.outbound")).to.equal(false);
    expect(await delivered(gw, api, "appbridge.heartbeat")).to.equal(false);
    expect(await delivered(node, api, "media.n1.events.r1")).to.equal(false);
    // Routr's events are Routr's.
    expect(await delivered(gw, api, "routr.call.started")).to.equal(false);
    // Catalog use comes from AppBridge replicas.
    expect(await delivered(node, api, "registry.used")).to.equal(false);
    // A node cannot speak for a workspace on the webhook bus (M6).
    expect(await delivered(node, api, "webhooks.events")).to.equal(false);
  });

  it("refuses subscriptions outside a service's subjects", async function () {
    expect(await canSubscribe(routr, gw, "appbridge.calls.c1")).to.equal(false);
    // AppBridge no longer follows node heartbeats (the stream's keepalive tells it).
    expect(await canSubscribe(gw, node, "roomr.nodes.n1.heartbeat")).to.equal(
      false
    );
    expect(await canSubscribe(node, gw, "callrecord.sealed")).to.equal(false);
    expect(await canSubscribe(gw, api, "calls.create")).to.equal(false);
    expect(await canSubscribe(node, routr, "routr.call.started")).to.equal(
      false
    );
  });

  it("keeps each service's replies to itself (per-user inbox prefixes)", async function () {
    // A call's owning AppBridge answers another replica's call-control request privately.
    const owner = await as(main!, "appbridge");
    conns.push(owner);
    const control = owner.subscribe("appbridge.calls.c9", {
      callback: (_e, m) => m.respond(sc.encode('{"secret":"reply"}'))
    });
    await owner.flush();
    // Another service, a second Roomr node and Routr try every inbox they could read.
    const otherNode = await as(main!, "roomr");
    conns.push(otherNode);
    const inboxes = ["_INBOX.>", `${natsInboxPrefix("appbridge")}.>`];
    for (const eavesdropper of [api, otherNode, routr]) {
      let answered = "";
      const heard = await overheard(eavesdropper, inboxes, async () => {
        const reply = await gw.request("appbridge.calls.c9", sc.encode("{}"), {
          timeout: 2000
        });
        answered = sc.decode(reply.data);
      });
      expect(answered).to.equal('{"secret":"reply"}');
      expect(heard).to.equal(false);
    }
    control.unsubscribe();
    // ...and the control plane's replies stay its own too (AppBridge's answer to a record
    // maintenance request, overheard by a node).
    const maintenance = gw.subscribe("callrecord.local.maintenance", {
      callback: (_e, m) => m.respond(sc.encode('{"type":"ack"}'))
    });
    await gw.flush();
    const nodeHeard = await overheard(
      otherNode,
      ["_INBOX.>", `${natsInboxPrefix("apiserver")}.>`],
      () =>
        api.request("callrecord.local.maintenance", sc.encode("{}"), {
          timeout: 2000
        })
    );
    expect(nodeHeard).to.equal(false);
    maintenance.unsubscribe();
  });

  it("refuses replies to a client that keeps the shared _INBOX prefix", async function () {
    const owner = await as(main!, "appbridge");
    conns.push(owner);
    const cmds = owner.subscribe("appbridge.calls.c8", {
      callback: (_e, m) => m.respond(sc.encode('{"type":"ack"}'))
    });
    await owner.flush();
    const shared = await as(main!, "appbridge", { inboxPrefix: null });
    conns.push(shared);
    const ok = await shared
      .request("appbridge.calls.c8", sc.encode("{}"), { timeout: 1000 })
      .then(
        () => true,
        () => false
      );
    expect(ok).to.equal(false);
    // A prefix of another user is refused the same way.
    const borrowed = await as(main!, "appbridge", {
      inboxPrefix: natsInboxPrefix("apiserver")
    });
    conns.push(borrowed);
    const ok2 = await borrowed
      .request("appbridge.calls.c8", sc.encode("{}"), { timeout: 1000 })
      .then(
        () => true,
        () => false
      );
    expect(ok2).to.equal(false);
    cmds.unsubscribe();
  });

  it("lets AppBridge and the control plane write only their own session-registry entries", async function () {
    const gwKv = await Sessions.openSessions(gw);
    const apiKv = await Sessions.openSessions(api);
    // AppBridge writes calls.* only: it keeps no membership entry (redesign-roomr 15.3).
    await gwKv.put("calls.c1", sc.encode('{"callRef":"c1"}'));
    // The control plane writes placements.* (outbound calls being placed) and deletes them.
    await apiKv.put("placements.p1", sc.encode('{"callRef":"p1"}'));
    await apiKv.delete("placements.p1");
    // Everything else is refused; the Roomr node writes nothing to the registry any more.
    const refused = async (kv: typeof gwKv, key: string) => {
      const ok = await kv.put(key, sc.encode("{}"), { timeout: 1000 }).then(
        () => true,
        () => false
      );
      expect(ok, key).to.equal(false);
    };
    await refused(apiKv, "nodes.forged");
    await refused(gwKv, "nodes.forged");
    await refused(gwKv, "rooms.forged");
    await refused(apiKv, "calls.forged");
    await refused(gwKv, "placements.forged");
    await refused(gwKv, "appbridges.g1");
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

  it("lets the control plane store usage from its own FONOSTER_USAGE stream", async function () {
    // The apiserver's usage consumer (add-usage-metering D5): creates the work-queue stream and
    // its durable consumer, publishes usage outside a call and takes it back to store it.
    const jsm = await api.jetstreamManager({ checkAPI: false });
    await jsm.streams.add({
      name: "FONOSTER_USAGE",
      subjects: ["usage.>"],
      retention: RetentionPolicy.Workqueue,
      storage: StorageType.Memory
    });
    await jsm.consumers.add("FONOSTER_USAGE", {
      durable_name: "apiserver-usage",
      ack_policy: AckPolicy.Explicit,
      filter_subject: "usage.>"
    });
    api.publish("usage.WO1.tts.characters", sc.encode('{"id":"usg_1"}'));
    await api.flush();
    const consumer = await api
      .jetstream()
      .consumers.get("FONOSTER_USAGE", "apiserver-usage");
    const m = await consumer.next({ expires: 5000 });
    expect(m && sc.decode(m.data)).to.equal('{"id":"usg_1"}');
    m!.ack();
    // AppBridge reports call usage in the sealed record, not here.
    const gwJsm = await gw.jetstreamManager({ checkAPI: false });
    const seen = await gwJsm.streams.info("FONOSTER_USAGE").then(
      () => true,
      () => false
    );
    expect(seen).to.equal(false);
  });

  it("gives the Roomr node core NATS only: no session registry and no JetStream", async function () {
    // It can't open the bucket, write any entry, or reach the JetStream API.
    const opened = await Sessions.openSessions(node).then(
      () => true,
      () => false
    );
    expect(opened).to.equal(false);
    const answered = (conn: NatsConnection, subject: string, body: unknown) =>
      conn
        .request(subject, sc.encode(JSON.stringify(body)), { timeout: 1000 })
        .then(
          (m) => !sc.decode(m.data).includes('"error"'),
          () => false
        );
    expect(await answered(node, "$JS.API.INFO", {})).to.equal(false);
    expect(
      await answered(node, "$JS.API.STREAM.INFO.KV_fonoster_sessions", {})
    ).to.equal(false);
    expect(
      await answered(node, "$JS.API.DIRECT.GET.KV_fonoster_sessions", {
        last_by_subj: "$KV.fonoster_sessions.nodes.n7"
      })
    ).to.equal(false);
    // The heartbeat still gets through to the control plane (core NATS).
    expect(await delivered(node, api, "roomr.nodes.n7.heartbeat")).to.equal(
      true
    );
  });

  it("limits a cell's region agent to region.> and its local subjects", async function () {
    const agent = await as(cell!, "region-agent");
    const cgw = await as(cell!, "appbridge");
    const cnode = await as(cell!, "roomr");
    conns.push(agent, cgw, cnode);
    // Bring-your-own key requests: AppBridge asks, the agent answers.
    const keys = agent.subscribe("cell.workspacekeys.get", {
      callback: (_e, m) => m.respond(sc.encode('{"value":"k"}'))
    });
    await agent.flush();
    await cgw.request("cell.workspacekeys.get", sc.encode("{}"), {
      timeout: 2000
    });
    // The key in the reply reaches AppBridge only: the Roomr node cannot read its inbox.
    const heard = await overheard(
      cnode,
      ["_INBOX.>", `${natsInboxPrefix("appbridge")}.>`],
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
    expect(await delivered(agent, cnode, "roomr.nodes.n1.heartbeat")).to.equal(
      false
    );
    expect(await delivered(agent, agent, "callrecord.sealed")).to.equal(false);
    // Only the agent talks over the link.
    expect(await delivered(cgw, agent, "region.r1.index")).to.equal(false);
  });
});
