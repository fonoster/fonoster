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
import { expect } from "chai";
import {
  CallUsage,
  METER_NAMES,
  METERS,
  parseUsageEvent,
  parseUsageLine,
  usageId
} from "../../src/usage";

describe("@common/usage", function () {
  it("declares exactly the twelve meters of the spec with their units", function () {
    expect(
      Object.fromEntries(METER_NAMES.map((m) => [m, METERS[m].unit]))
    ).to.deep.equal({
      "call.seconds": "second",
      "stt.seconds": "second",
      "tts.characters": "character",
      "llm.tokens.in": "token",
      "llm.tokens.out": "token",
      "llm.tokens.cached": "token",
      "embedding.tokens": "token",
      "nc.seconds": "second",
      "amd.detections": "count",
      "amd.seconds": "second",
      "recording.seconds": "second",
      "storage.bytes": "byte"
    });
  });

  it("rejects an undeclared meter", function () {
    expect(() =>
      parseUsageLine({ meter: "video.seconds", quantity: 1 })
    ).to.throw(/undeclared meter "video.seconds"/);
  });

  it("needs a key source on vendor meters and refuses one elsewhere", function () {
    expect(() =>
      parseUsageLine({
        meter: "stt.seconds",
        quantity: 3,
        provider: "deepgram"
      })
    ).to.throw(/needs a keySource/);
    expect(() =>
      parseUsageLine({
        meter: "call.seconds",
        quantity: 3,
        keySource: "platform"
      })
    ).to.throw(/takes no keySource/);
    expect(
      parseUsageLine({
        meter: "stt.seconds",
        quantity: 3,
        provider: "deepgram",
        keySource: "workspace"
      })
    ).to.deep.equal({
      meter: "stt.seconds",
      quantity: 3,
      provider: "deepgram",
      keySource: "workspace"
    });
  });

  it("carries no money: unknown fields such as a price are rejected", function () {
    expect(() =>
      parseUsageLine({ meter: "call.seconds", quantity: 3, priceCents: 5 })
    ).to.throw(/priceCents/);
    expect(() =>
      parseUsageLine({ meter: "call.seconds", quantity: 3, billable: true })
    ).to.throw(/billable/);
  });

  it("validates a full event", function () {
    const line = { meter: "call.seconds" as const, quantity: 65 };
    const event = {
      ...line,
      id: usageId("call-1", line),
      workspaceRef: "ws-1",
      callRef: "call-1",
      region: "us-east",
      regionKind: "public",
      origin: "call",
      occurredAt: "2026-10-20T12:00:00.000Z"
    };
    expect(parseUsageEvent(event)).to.deep.equal(event);
    expect(() => parseUsageEvent({ ...event, origin: "test" })).to.throw();
  });

  it("derives the same id from the same usage and a different one otherwise", function () {
    const a = usageId("call-1", {
      meter: "stt.seconds",
      provider: "deepgram",
      keySource: "platform"
    });
    expect(a).to.match(/^usg_[a-z2-7]{26}$/);
    expect(
      usageId("call-1", {
        meter: "stt.seconds",
        provider: "deepgram",
        keySource: "platform"
      })
    ).to.equal(a);
    expect(
      usageId("call-1", {
        meter: "stt.seconds",
        provider: "deepgram",
        keySource: "workspace"
      })
    ).to.not.equal(a);
    expect(
      usageId("call-2", {
        meter: "stt.seconds",
        provider: "deepgram",
        keySource: "platform"
      })
    ).to.not.equal(a);
  });

  it("adds up a call's usage per meter, provider, model and key source", function () {
    const usage = new CallUsage();
    const stt = {
      meter: "stt.seconds" as const,
      provider: "deepgram",
      keySource: "workspace" as const
    };
    usage.addMillis(stt, 1500);
    usage.addMillis(stt, 1500);
    usage.add({
      meter: "tts.characters",
      quantity: 42,
      provider: "elevenlabs",
      keySource: "platform"
    });
    usage.add({
      meter: "tts.characters",
      quantity: 8,
      provider: "elevenlabs",
      keySource: "platform"
    });
    usage.add({
      meter: "llm.tokens.in",
      quantity: 1200,
      provider: "openai",
      model: "openai/gpt-4o-mini",
      keySource: "platform"
    });
    usage.add({
      meter: "llm.tokens.in",
      quantity: 300,
      provider: "openai",
      model: "openai/gpt-4o-mini",
      keySource: "workspace"
    });
    expect(usage.lines()).to.deep.equal([
      {
        meter: "stt.seconds",
        quantity: 3,
        provider: "deepgram",
        keySource: "workspace"
      },
      {
        meter: "tts.characters",
        quantity: 50,
        provider: "elevenlabs",
        keySource: "platform"
      },
      {
        meter: "llm.tokens.in",
        quantity: 1200,
        provider: "openai",
        model: "openai/gpt-4o-mini",
        keySource: "platform"
      },
      {
        meter: "llm.tokens.in",
        quantity: 300,
        provider: "openai",
        model: "openai/gpt-4o-mini",
        keySource: "workspace"
      }
    ]);
  });

  it("rounds seconds up and drops empty entries", function () {
    const usage = new CallUsage();
    usage.addMillis({ meter: "recording.seconds" }, 2100);
    usage.addMillis({ meter: "amd.seconds" }, 0);
    expect(usage.lines()).to.deep.equal([
      { meter: "recording.seconds", quantity: 3 }
    ]);
  });
});
