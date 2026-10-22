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
import { NatsConnection, connect } from "nats";
import { FakesHarness } from "@fonoster/conformance";
import { AppBridge, MemoryCallRecordSink } from "@fonoster/appbridge";
import { VoiceServer } from "@fonoster/voice";
import { Agent, createAutopilotHandler } from "../../src/session";

// The whole rebuilt call path with fakes at the edges: caller audio from the fake Roomr node,
// the real AppBridge (STT, turn detection, TTS, output queue), Autopilot over the session protocol,
// and the fake LLM. Needs NATS: CONFORMANCE_NATS_URL=nats://127.0.0.1:4222.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;
const SECRET = "fullstack";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor<T>(
  fn: () => T | undefined | false | Promise<T | undefined | false>,
  ms: number,
  what: string
): Promise<T> {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(25);
  }
}

describe("@autopilot full stack: Roomr node → appbridge → Autopilot → LLM → speech", function () {
  this.timeout(20000);
  let nc: NatsConnection;

  // A nightly case (catalog APT-020): without its bus it fails, it never skips.
  before(async function () {
    if (!NATS_URL)
      throw new Error(
        "CONFORMANCE_NATS_URL is not set: the full-stack case needs NATS"
      );
    nc = await connect({ servers: NATS_URL });
  });

  after(async () => nc?.close());

  it("[APT-020] answers a caller's question with spoken audio", async function () {
    const harness = await new FakesHarness().start();
    harness.stt.configure({
      script: [{ atMs: 600, text: "What are your hours?" }]
    });
    harness.llm.configure({
      script: [{ content: "We open at nine. We close at five." }]
    });

    const autopilot = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: SECRET
    }).listen(
      createAutopilotHandler({
        agent: {
          conversationSettings: {
            firstMessage: "Hello, this is the clinic.",
            systemPrompt: "You are the receptionist of a dental clinic.",
            goodbyeMessage: "Goodbye!",
            systemErrorMessage: "Sorry, something went wrong."
          },
          languageModel: { model: "fake/llm" }
        },
        providers: { fake: { baseUrl: harness.llm.url } }
      })
    );

    const record = new MemoryCallRecordSink();
    const urls = harness.providerUrls;
    const appbridge = await new AppBridge({
      nats: nc,
      record,
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        apps: [
          {
            ref: "autopilot",
            url: `ws://127.0.0.1:${autopilot.port}/`,
            protocol: "fonoster",
            signingSecret: SECRET,
            speech: {
              voice: "fake/default",
              language: "en-US",
              silenceTimeoutMs: 400
            }
          }
        ],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        }
      }
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });

    try {
      const start = Date.now();
      await harness.roomrNode.offerCall({
        from: "+15550001111",
        to: "+15550002222"
      });

      // The greeting is spoken, then the caller's question reaches the LLM as a user message.
      await waitFor(
        () => harness.tts.synthesized.find((s) => s.text.includes("clinic")),
        5000,
        "the greeting"
      );
      await waitFor(
        () =>
          harness.llm.conversations.find((c) =>
            c.messages.some((m) => m.content === "What are your hours?")
          ),
        8000,
        "the question at the LLM"
      );
      // The reply is synthesized and played to the caller as audio.
      await waitFor(
        () =>
          harness.tts.synthesized.find((s) =>
            s.text.includes("We open at nine")
          ),
        5000,
        "the reply TTS"
      );
      await waitFor(
        async () => (await harness.roomrNode.outputAudioMs(start)) > 2500,
        8000,
        "the reply audio at the caller"
      );

      const entries = [...record.records.values()][0];
      const types = entries.map((e) => `${e.source}:${e.message.type}`);
      expect(types).to.include.members([
        "appbridge:session.start",
        "appbridge:turn.user_started",
        "appbridge:turn.ended",
        "app:speak",
        "appbridge:output.started"
      ]);
      const ended = entries.find((e) => e.message.type === "turn.ended");
      expect(ended?.message).to.include({ text: "What are your hours?" });
    } finally {
      await appbridge.stop();
      await autopilot.close();
      await harness.stop();
    }
  });

  it("[APT-020] stops its reply when the caller cuts in (app-owned interruption)", async function () {
    const harness = await new FakesHarness().start();
    harness.stt.configure({
      script: [{ atMs: 600, text: "What are your hours?" }]
    });
    const reply =
      "We open at nine in the morning. We close at five in the afternoon. On Saturdays we open at ten and close at two. On Sundays and holidays the clinic stays closed.";
    harness.llm.configure({ script: [{ content: reply }] });

    let agent: Agent | undefined;
    const autopilot = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: SECRET
    }).listen(
      createAutopilotHandler({
        agent: {
          conversationSettings: {
            systemPrompt: "You are the receptionist of a dental clinic.",
            goodbyeMessage: "Goodbye!",
            systemErrorMessage: "Sorry, something went wrong."
          },
          languageModel: { model: "fake/llm" }
        },
        providers: { fake: { baseUrl: harness.llm.url } },
        onAgent: (a) => (agent = a)
      })
    );

    const record = new MemoryCallRecordSink();
    const urls = harness.providerUrls;
    const appbridge = await new AppBridge({
      nats: nc,
      record,
      config: {
        nats: { url: NATS_URL! },
        session: { listen: "127.0.0.1:0" },
        apps: [
          {
            ref: "autopilot",
            url: `ws://127.0.0.1:${autopilot.port}/`,
            protocol: "fonoster",
            signingSecret: SECRET,
            speech: {
              voice: "fake/default",
              language: "en-US",
              silenceTimeoutMs: 400
            }
          }
        ],
        providers: {
          fake: {
            adapter: "fake",
            capabilities: ["tts", "stt"],
            tts: { url: urls.tts },
            stt: { url: urls.stt }
          }
        }
      }
    }).start();
    harness.roomrNode.configure({ endpoint: appbridge.sessionEndpoint });

    try {
      await harness.roomrNode.offerCall({
        from: "+15550001111",
        to: "+15550002222"
      });
      // The caller's question; Autopilot speaks without a greeting (none configured).
      harness.caller({ audio: { kind: "tone", ms: 700 } });
      const entries = () => [...record.records.values()][0] ?? [];
      await waitFor(
        () => entries().find((e) => e.message.type === "output.started"),
        8000,
        "the reply to start playing"
      );
      await sleep(800);
      // The caller cuts in over the reply.
      harness.caller({ audio: { kind: "tone", ms: 900 } });
      const interrupted = await waitFor(
        () => entries().find((e) => e.message.type === "output.interrupted"),
        5000,
        "output.interrupted"
      );
      const types = entries().map((e) => `${e.source}:${e.message.type}`);
      const startedAt = types.lastIndexOf("appbridge:turn.user_started");
      const clearAt = types.indexOf("app:clear");
      // AppBridge only reported the interruption; Autopilot (the app) stopped the output.
      expect(startedAt).to.be.greaterThan(-1);
      expect(clearAt).to.be.greaterThan(startedAt);
      const heard = String(interrupted.message.heardText ?? "");
      expect(heard.length).to.be.lessThan(reply.length);
      // Honest history: what the caller heard of the reply, not the whole reply.
      await waitFor(
        () => agent?.history.find((m) => m.role === "assistant"),
        3000,
        "the reply in the history"
      );
      const said = agent!.history.find((m) => m.role === "assistant")!;
      expect(said.content).to.equal(heard);
    } finally {
      await appbridge.stop();
      await autopilot.close();
      await harness.stop();
    }
  });
});
