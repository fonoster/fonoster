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
// voice-session, "Connection requests are bound to the app": a server several apps share one
// secret with (the hosted Autopilot) accepts only the gateway's app-bound signature, over its
// configured URL, and only for the app session.start names.
import * as net from "net";
import { expect } from "chai";
import { FakeGateway, WebSocketPeer } from "@fonoster/conformance";
import { Session, VoiceServer } from "../src";

const SECRET = "shared-secret";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const VICTIM = { appRef: "app-victim", workspaceRef: "WS-VICTIM" };
const TENANT = { appRef: "app-tenant", workspaceRef: "WS-TENANT" };

const start = (appRef: string) => ({
  type: "session.start",
  protocol: "fonoster.session.v1",
  sessionRef: "s1",
  callRef: "c1",
  appRef,
  direction: "inbound",
  from: "+1",
  to: "+2",
  metadata: {},
  handoff: null,
  audio: { codec: "pcm16", rate: 16000 },
  tracks: [{ id: 1, side: "inbound", kind: "audio", codec: "pcm16" }],
  speech: { voice: "fake/default", language: "en-US" }
});

const closed = (peer: WebSocketPeer) =>
  new Promise<number>((resolve) =>
    peer.socket.once("close", (code: number) => resolve(code))
  );

describe("@voice VoiceServer app-bound signatures", function () {
  let server: VoiceServer | undefined;
  let sessions: Session[] = [];
  afterEach(async () => {
    await server?.close();
    server = undefined;
    sessions = [];
  });

  /** A free local port. */
  const freePort = () =>
    new Promise<number>((resolve) => {
      const probe = net.createServer().listen(0, "127.0.0.1", () => {
        const { port } = probe.address() as net.AddressInfo;
        probe.close(() => resolve(port));
      });
    });

  /** A shared server (like the hosted Autopilot) with its URL configured; returns that URL. */
  async function shared() {
    const port = await freePort();
    const url = `ws://127.0.0.1:${port}/`;
    server = await new VoiceServer({
      port,
      host: "127.0.0.1",
      signingSecret: SECRET,
      requireAppBinding: true,
      publicUrl: url
    }).listen(async (s) => {
      sessions.push(s);
    });
    return url;
  }

  it("opens a session for the app the signature names and exposes the binding", async function () {
    const url = await shared();
    const peer = await new FakeGateway({
      signingSecret: SECRET,
      app: VICTIM
    }).dial(url);
    peer.sendJson(start(VICTIM.appRef));
    await sleep(50);
    expect(sessions).to.have.length(1);
    expect(sessions[0].signedFor).to.deep.equal(VICTIM);
  });

  it("refuses a URL-only signature when the binding is required", async function () {
    const url = await shared();
    const error = await new FakeGateway({ signingSecret: SECRET })
      .dial(url)
      .then(
        () => undefined,
        (e: Error) => e
      );
    expect(error?.message).to.contain("401");
    expect(sessions).to.have.length(0);
  });

  it("refuses a session.start for another app than the one signed", async function () {
    const url = await shared();
    const peer = await new FakeGateway({
      signingSecret: SECRET,
      app: TENANT
    }).dial(url);
    const code = closed(peer);
    peer.sendJson(start(VICTIM.appRef));
    expect(await code).to.equal(1008);
    expect(sessions).to.have.length(0);
  });

  it("refuses app or workspace headers changed after signing", async function () {
    const url = await shared();
    for (const headers of [
      { "x-fonoster-app-ref": VICTIM.appRef },
      { "x-fonoster-workspace-ref": VICTIM.workspaceRef }
    ]) {
      const error = await new FakeGateway({
        signingSecret: SECRET,
        app: TENANT,
        headers
      })
        .dial(url)
        .then(
          () => undefined,
          (e: Error) => e
        );
      expect(error?.message, JSON.stringify(headers)).to.contain("401");
    }
    expect(sessions).to.have.length(0);
  });

  it("checks the configured URL, never one built from the Host header", async function () {
    const url = await shared();
    // A genuine signature the gateway made for another URL (a tenant's own listener), replayed
    // with a Host header naming that URL's host.
    const error = await new FakeGateway({
      signingSecret: SECRET,
      app: VICTIM,
      signedUrl: "ws://tenant.example/",
      headers: { host: "tenant.example" }
    })
      .dial(url)
      .then(
        () => undefined,
        (e: Error) => e
      );
    expect(error?.message).to.contain("401");
    expect(sessions).to.have.length(0);
  });

  it("refuses a bad app-bound signature even where the URL-only one is optional", async function () {
    server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: SECRET
    }).listen(async (s) => {
      sessions.push(s);
    });
    const url = `ws://127.0.0.1:${server.port}/`;
    // Without the binding, a URL-only signature still works (apps with their own secret).
    const plain = await new FakeGateway({ signingSecret: SECRET }).dial(url);
    plain.sendJson(start("a1"));
    await sleep(50);
    expect(sessions).to.have.length(1);
    expect(sessions[0].signedFor).to.equal(undefined);
    // A forged binding is refused.
    const error = await new FakeGateway({
      signingSecret: SECRET,
      app: TENANT,
      headers: { "x-fonoster-app-ref": VICTIM.appRef }
    })
      .dial(url)
      .then(
        () => undefined,
        (e: Error) => e
      );
    expect(error?.message).to.contain("401");
  });
});
