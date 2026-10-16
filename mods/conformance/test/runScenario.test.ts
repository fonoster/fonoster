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
import { parse } from "yaml";
import { Harness, Peer, Scenario, peerPair, runScenario } from "../src";

const START = {
  type: "session.start",
  protocol: "fonoster.session.v1",
  audio: { codec: "pcm16", rate: 16000 },
  tracks: [{ id: 1, side: "inbound", kind: "audio", codec: "pcm16" }]
};

function scenario(yaml: string): Scenario {
  return parse(
    `format: fonoster.scenario.v1\nname: t\ncontract: voice-session\nrole: app\n${yaml}`
  );
}

/** Runs a scenario where `script` plays the implementation under test on the other peer. */
async function run(
  s: Scenario,
  script: (impl: Peer) => void | Promise<void>,
  harness?: Harness
) {
  const [runnerSide, implSide] = peerPair();
  void script(implSide);
  return runScenario(s, {
    connect: () => runnerSide,
    harness,
    defaultTimeoutMs: 500
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("@conformance/runScenario", function () {
  it("passes when the frames match in order", async function () {
    const s = scenario(`
steps:
  - expect: { type: session.start }
  - send: { type: speak, id: r1, text: hi, last: true }
  - expect: { type: output.started, id: r1 }
  - expect: { type: output.done, id: r1 }
`);
    const result = await run(s, (impl) => {
      impl.sendJson(START);
      setTimeout(() => {
        impl.sendJson({ type: "output.started", id: "r1" });
        impl.sendJson({ type: "output.done", id: "r1" });
      }, 20);
    });
    expect(result.status, result.reason).to.equal("passed");
  });

  it("fails when frames arrive out of order", async function () {
    const s = scenario(`
steps:
  - expect: { type: output.started }
  - expect: { type: output.done }
`);
    const result = await run(s, (impl) => {
      impl.sendJson({ type: "output.done" });
      impl.sendJson({ type: "output.started" });
    });
    expect(result.status).to.equal("failed");
    expect(result.reason).to.contain("step 2");
  });

  it("skips ignored types and reports the closest miss", async function () {
    const s = scenario(`
ignore: [turn.estimate]
steps:
  - expect: { type: error, code: bad_message }
`);
    const result = await run(s, (impl) => {
      impl.sendJson({ type: "turn.estimate", eot: 0.3 });
      impl.sendJson({ type: "error", code: "internal" });
    });
    expect(result.status).to.equal("failed");
    expect(result.reason).to.contain("closest: code");
  });

  it("enforces within_ms and not_before_ms", async function () {
    const late = scenario(`
steps:
  - expect: { type: x }
    within_ms: 50
`);
    const tooLate = await run(late, async (impl) => {
      await sleep(120);
      impl.sendJson({ type: "x" });
    });
    expect(tooLate.status).to.equal("failed");

    const early = scenario(`
steps:
  - expect: { type: x }
    not_before_ms: 100
`);
    const tooEarly = await run(early, (impl) => impl.sendJson({ type: "x" }));
    expect(tooEarly.status).to.equal("failed");
    expect(tooEarly.reason).to.contain("not before");
  });

  it("subtracts provider delay for budget_ms", async function () {
    const s = scenario(`
steps:
  - expect: { type: output.started }
    budget_ms: 60
`);
    const harness: Harness = { providerDelayBetween: () => 200 };
    const result = await run(
      s,
      async (impl) => {
        await sleep(230);
        impl.sendJson({ type: "output.started" });
      },
      harness
    );
    expect(result.status, result.reason).to.equal("passed");
    expect(result.samples[0].adjustedMs).to.be.lessThan(60);

    const noHarness = await run(s, (impl) =>
      impl.sendJson({ type: "output.started" })
    );
    expect(noHarness.reason).to.contain("provider delays");
  });

  it("captures values and interpolates them into later sends", async function () {
    const s = scenario(`
steps:
  - expect: { type: speak }
    capture: { sid: id }
  - send: { type: output.done, id: "\${sid}" }
  - expect: { type: ack, id: "\${sid}" }
`);
    const result = await run(s, (impl) => {
      impl.sendJson({ type: "speak", id: "abc" });
      impl.frames
        .waitUntil(
          () => impl.frames.items.find((f) => f.kind === "json"),
          Date.now() + 500
        )
        .then((f) => {
          const data = (f as { data: { id: string } }).data;
          impl.sendJson({ type: "ack", id: data.id });
        });
    });
    expect(result.status, result.reason).to.equal("passed");
  });

  it("fails expect_none when a matching frame arrives", async function () {
    const s = scenario(`
steps:
  - expect_none: { type: session.end }
    for_ms: 100
`);
    const result = await run(s, (impl) =>
      impl.sendJson({ type: "session.end", reason: "error" })
    );
    expect(result.status).to.equal("failed");
    expect(result.reason).to.contain("unexpected frame");
  });

  it("counts audio by track after session.start announces the format", async function () {
    const s = scenario(`
steps:
  - expect: { type: session.start }
  - expect_audio: { track: 1, ms: 100 }
    within_ms: 300
`);
    const result = await run(s, (impl) => {
      impl.sendJson(START);
      // 5 frames of 20 ms at 16 kHz PCM16, each with the track byte.
      for (let i = 0; i < 5; i++)
        impl.sendBinary(Buffer.concat([Buffer.from([1]), Buffer.alloc(640)]));
    });
    expect(result.status, result.reason).to.equal("passed");
  });

  it("sends audio in the announced format", async function () {
    const s = scenario(`
steps:
  - expect: { type: session.start }
  - send_audio: { ms: 100, realtime: false }
`);
    const [runnerSide, implSide] = peerPair();
    implSide.sendJson(START);
    const result = await runScenario(s, {
      connect: () => runnerSide,
      keepOpen: true
    });
    await sleep(10);
    expect(result.status, result.reason).to.equal("passed");
    const binary = implSide.frames.items.filter((f) => f.kind === "binary");
    expect(binary).to.have.length(5);
    expect((binary[0].data as Buffer).length).to.equal(640);
  });

  it("wraps audio as media events in the Twilio protocol", async function () {
    const s: Scenario = parse(`
format: fonoster.scenario.v1
name: t
contract: twilio-media-streams-flavor
role: app
steps:
  - expect: { event: start }
  - send_audio: { ms: 40, realtime: false }
`);
    const [runnerSide, implSide] = peerPair();
    implSide.sendJson({ event: "start", streamSid: "MZ1" });
    const result = await runScenario(s, {
      connect: () => runnerSide,
      keepOpen: true
    });
    await sleep(10);
    expect(result.status, result.reason).to.equal("passed");
    const media = implSide.frames.items.filter((f) => f.kind === "json");
    expect(media).to.have.length(2);
    expect((media[0].data as { streamSid: string }).streamSid).to.equal("MZ1");
    expect(
      Buffer.from(
        (media[0].data as { media: { payload: string } }).media.payload,
        "base64"
      )
    ).to.have.length(160);
  });

  it("fails assertions the harness cannot measure", async function () {
    const s = scenario(`
steps:
  - assert: { media.output_silent_within_ms: { $lte: 40 } }
`);
    const result = await run(s, () => undefined, { measure: () => undefined });
    expect(result.reason).to.contain("cannot measure");
  });

  it("reports skipped scenarios", async function () {
    const s = scenario(`
skip: needs the listener API
steps:
  - expect: { type: x }
`);
    const result = await runScenario(s, { connect: () => peerPair()[0] });
    expect(result.status).to.equal("skipped");
  });
});
