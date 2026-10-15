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
import { FakeGateway, loadScenarios, runScenario } from "@fonoster/conformance";
import { Handler, Session, SessionError, VoiceServer } from "../../src/session";
import { LegacyRequest, LegacyResponse } from "../../src/session/legacy";

// The voice-sdk conformance scenarios, run against this SDK. Each fixture is the app described
// in mods/conformance/scenarios/voice-sdk/FIXTURES.md, written with the SDK.
const SECRET = "sdk-conformance";

async function* tokens(pieces: string[]) {
  for (const p of pieces) yield p;
}

async function* failingTokens(): AsyncGenerator<string> {
  yield "Hello";
  throw new Error("the model stopped");
}

const FIXTURES: Record<string, Handler> = {
  "say-hello": async (session: Session) => {
    await session.say("Hello from the SDK.");
    await session.hangup();
  },
  "say-hello-legacy": async (_req: LegacyRequest, res: LegacyResponse) => {
    await res.answer();
    await res.say("Hello from the SDK.");
    await res.hangup();
  },
  "say-reports-interruption": async (session: Session) => {
    const r = await session.say("Your balance is forty two dollars.");
    if (r.interrupted) await session.say(`You heard: ${r.heardText}`);
  },
  "session-info": async (s: Session) => {
    await s.say(
      `Call ${s.callRef} to ${s.to} from ${s.from} (${s.direction}, app ${s.appRef})`
    );
  },
  "say-voice-override": async (s: Session) => {
    await s.say("Hola", { voice: "elevenlabs/rachel", language: "es" });
  },
  "say-stream": async (s: Session) => {
    await s.say(tokens(["Hello", " there", "!"]));
    await s.hangup();
  },
  "say-stream-fails": async (s: Session) => {
    try {
      await s.say(failingTokens());
    } catch {
      await s.say("The stream failed.");
    }
  },
  "stop-say": async (s: Session) => {
    s.on("dtmf", () => void s.stopSay());
    const r = await s.say("This is a long message.");
    if (r.interrupted) await s.say(`Stopped after: ${r.heardText}`);
  },
  "gather-max-digits": async (s: Session) => {
    const r = await s.gather({ maxDigits: 4 });
    await s.say(`You pressed: ${r.digits}`);
  },
  "gather-timeout": async (s: Session) => {
    const r = await s.gather({ timeout: 300 });
    await s.say(
      r.speech === undefined && r.digits === undefined
        ? "No input."
        : "Got input."
    );
  },
  "dtmf-listener": async (s: Session) => {
    s.on("dtmf", (d) => void s.say(`Key ${d.digit}`).catch(() => undefined));
    await s.say("Welcome to the menu.");
  },
  partials: async (s: Session) => {
    await s.subscribe(["transcript.partial"]);
    s.on(
      "transcript.partial",
      (p) => void s.say(`Heard ${p.text}`).catch(() => undefined)
    );
  },
  "transfer-cold": async (s: Session) => {
    await s.transfer("+15551234567");
  },
  "transfer-warm": async (s: Session) => {
    const t = s.transfer("+15551234567", { mode: "warm" });
    await s.say("Connecting you now.");
    await s.completeTransfer();
    await t;
  },
  handoff: async (s: Session) => {
    await s.handoff("app-escalation", { reason: "angry caller" });
  },
  "legacy-dial": async (_req: LegacyRequest, res: LegacyResponse) => {
    await res.dial("+15551234567");
  },
  "audio-mark": async (s: Session) => {
    s.on("dtmf", () => s.audio.clear());
    for (let i = 0; i < 3; i++) s.audio.send(Buffer.alloc(640));
    const m = await s.audio.mark("r1");
    await s.say(m.cleared ? "Cleared." : "Heard.");
  },
  "say-error": async (s: Session) => {
    try {
      await s.say("Hi");
    } catch (e) {
      if (e instanceof SessionError) await s.say(`Error: ${e.code}`);
    }
  },
  "say-then-gather": async (s: Session) => {
    const r = await s.say("Please enter your PIN.");
    const g = await s.gather({ maxDigits: 4 });
    await s.say(`PIN ${g.digits} (heard: ${r.heardText})`);
  },
  "gather-echo": async (session: Session) => {
    const r = await session.gather({ finishOnKey: "#" });
    if (r.speech !== undefined) await session.say(`You said: ${r.speech}`);
    else await session.say(`You pressed: ${r.digits}`);
  }
};

describe("@voice/session conformance (voice-sdk scenarios)", function () {
  for (const scenario of loadScenarios("voice-sdk")) {
    it(scenario.name, async function () {
      const fixture = FIXTURES[scenario.fixture!];
      expect(fixture, `fixture ${scenario.fixture} is not implemented`).to
        .exist;
      const server = await new VoiceServer({
        port: 0,
        host: "127.0.0.1",
        signingSecret: SECRET
      }).listen(fixture);
      try {
        const gateway = new FakeGateway({ signingSecret: SECRET });
        const result = await runScenario(scenario, {
          connect: () => gateway.dial(`ws://127.0.0.1:${server.port}/`)
        });
        expect(result.status, result.reason).to.equal("passed");
      } finally {
        await server.close();
      }
    });
  }
});
