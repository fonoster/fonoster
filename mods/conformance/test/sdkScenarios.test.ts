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
import { expect } from "chai";
import { AddressInfo } from "net";
import WebSocket from "ws";
import { FakeAppBridge, loadScenarios, runScenario, verify } from "../src";

// A deliberately tiny app that implements the voice-sdk fixtures on the raw protocol, the way an
// SDK would. It proves the scenario files and the runner agree with each other; the real SDK
// suites (task 3.2) run the same files against each SDK's own fixtures.

const SECRET = "fixture-secret";

type Json = Record<string, unknown>;

function session(socket: WebSocket) {
  // Frames no waiter has claimed yet: events can arrive before the handler awaits them (e.g.
  // DTMF right after session.start), and an SDK must not lose them.
  const backlog: Json[] = [];
  const listeners = new Set<(m: Json) => boolean>();
  // Outputs this app sent, so it can cut off interruptible ones on barge-in (appbridge B22).
  const outputs = new Map<
    string,
    { interruptible: boolean; started: boolean }
  >();
  socket.on("message", (raw, isBinary) => {
    if (isBinary) return;
    const msg = JSON.parse(raw.toString());
    const output = outputs.get(msg.id as string);
    if (msg.type === "output.started" && output) output.started = true;
    if (msg.type === "output.done" || msg.type === "output.interrupted")
      outputs.delete(msg.id as string);
    if (msg.type === "turn.user_started") {
      const playing = [...outputs.values()].filter((o) => o.started);
      if (playing.length && playing.every((o) => o.interruptible))
        send({ type: "clear" });
    }
    if (![...listeners].some((l) => l(msg))) backlog.push(msg);
  });
  const next = (pred: (m: Json) => boolean) =>
    new Promise<Json>((resolve) => {
      while (backlog.length) {
        const m = backlog.shift()!;
        if (pred(m)) return resolve(m);
      }
      const l = (m: Json) => {
        if (!pred(m)) return false;
        listeners.delete(l);
        resolve(m);
        return true;
      };
      listeners.add(l);
    });
  let seq = 0;
  const send = (m: Json) => socket.send(JSON.stringify(m));

  return {
    started: next((m) => m.type === "session.start"),
    async say(text: string, options: { interruptible?: boolean } = {}) {
      const id = `say-${++seq}`;
      const interruptible = options.interruptible ?? true;
      outputs.set(id, { interruptible, started: false });
      send({
        type: "speak",
        id,
        text,
        last: true,
        ...(interruptible ? {} : { interruptible: false })
      });
      const end = await next(
        (m) =>
          m.id === id &&
          (m.type === "output.done" || m.type === "output.interrupted")
      );
      return {
        interrupted: end.type === "output.interrupted",
        heardText: end.heardText as string | undefined
      };
    },
    async gather(finishOnKey: string) {
      let digits = "";
      const m = await next((msg) => {
        // First input wins: once digits started, speech is ignored.
        if (msg.type === "turn.ended") return digits === "";
        if (msg.type !== "dtmf") return false;
        if (msg.digit === finishOnKey) return true;
        digits += msg.digit;
        return false;
      });
      return m.type === "turn.ended"
        ? { speech: m.text as string }
        : { digits };
    },
    hangup: () => send({ type: "hangup" })
  };
}

const FIXTURES: Record<
  string,
  (s: ReturnType<typeof session>) => Promise<void>
> = {
  "say-hello": async (s) => {
    await s.say("Hello from the SDK.");
    s.hangup();
  },
  "answer-then-say": async (s) => {
    // answer() sends nothing: AppBridge answered on connect.
    await s.say("Hello from the SDK.");
    s.hangup();
  },
  "say-reports-interruption": async (s) => {
    const r = await s.say("Your balance is forty two dollars.");
    if (r.interrupted) await s.say(`You heard: ${r.heardText}`);
  },
  "say-kept": async (s) => {
    await s.say("Please hold.", { interruptible: false });
  },
  "gather-echo": async (s) => {
    const r = await s.gather("#");
    await s.say(
      r.speech !== undefined
        ? `You said: ${r.speech}`
        : `You pressed: ${r.digits}`
    );
  }
};

function startFixtureServer(
  fixture: string
): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const server = new WebSocket.Server(
      {
        host: "127.0.0.1",
        port: 0,
        verifyClient: (info, done) =>
          done(
            verify(
              `ws://${info.req.headers.host}${info.req.url}`,
              info.req.headers,
              SECRET
            ).ok,
            401
          )
      },
      () => {
        const { port } = server.address() as AddressInfo;
        resolve({
          url: `ws://127.0.0.1:${port}/`,
          close: () => server.close()
        });
      }
    );
    server.on("connection", async (socket) => {
      const s = session(socket);
      await s.started;
      await FIXTURES[fixture](s).catch(() => undefined);
    });
  });
}

describe("@conformance/voice-sdk scenarios against the reference fixtures", function () {
  // Only the fixtures implemented here; the SDK suites run every voice-sdk scenario.
  loadScenarios("voice-sdk")
    .filter((scenario) => scenario.fixture! in FIXTURES)
    .forEach((scenario) => {
      it(scenario.name, async function () {
        const server = await startFixtureServer(scenario.fixture!);
        try {
          const appbridge = new FakeAppBridge({ signingSecret: SECRET });
          const result = await runScenario(scenario, {
            connect: () => appbridge.dial(server.url)
          });
          expect(result.status, result.reason).to.equal("passed");
        } finally {
          server.close();
        }
      });
    });
});
