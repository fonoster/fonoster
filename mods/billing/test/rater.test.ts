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
import { rate } from "../src/rater";
import { join } from "path";
import { readFileSync } from "fs";
import { parse } from "yaml";
import { cardAt, loadRateCards, priceOf, RateCard } from "../src/rateCards";
import { RecordedUsage } from "../src/usage";

// The rater (add-billing-service D4, billing "Rated lines follow fixed rules"): one case per rule,
// and the order between them.

const card: RateCard = {
  version: 3,
  startsAt: new Date("2026-11-01T00:00:00Z"),
  source: "test",
  prices: {
    "call.seconds": 0.08,
    "tts.characters": { elevenlabs: 0.018, "*": 0.01 },
    "llm.tokens.in": { openai: { "gpt-x": 0.00025, "*": 0.0005 } },
    "nc.seconds": 0.002
  }
};
const started = new Date("2026-11-01T00:00:00Z");

const usage = (o: Partial<RecordedUsage> = {}): RecordedUsage => ({
  id: "usg_x",
  ownerRef: "owner",
  workspaceRef: "WO-A",
  callRef: "call-1",
  region: "default",
  regionKind: "public",
  origin: "call",
  meter: "tts.characters",
  quantity: 1000,
  provider: "elevenlabs",
  keySource: "platform",
  occurredAt: "2026-11-05T12:00:00Z",
  ...o
});

describe("@billing rater", function () {
  it("[BIL-029] prices a vendor meter on our key at the card's price (rule 7)", function () {
    expect(rate(usage(), started, card)).to.deep.equal({
      billable: true,
      reason: "platform_key",
      amount: 18_000n,
      rateCardVersion: 3,
      category: "ai_usage"
    });
  });

  it("[BIL-028] never bills a private region, even on our key (rule 1 before rule 7)", function () {
    expect(rate(usage({ regionKind: "private" }), started, card)).to.include({
      billable: false,
      reason: "private_region"
    });
  });

  it("[BIL-028] never bills the customer's own key (rule 2)", function () {
    expect(
      rate(
        usage({ meter: "stt.seconds", keySource: "workspace" }),
        started,
        card
      )
    ).to.include({
      billable: false,
      reason: "byok"
    });
  });

  it("[BIL-028] includes AMD, recording and storage (rules 3 and 4)", function () {
    for (const meter of [
      "amd.detections",
      "amd.seconds",
      "recording.seconds",
      "storage.bytes"
    ])
      expect(
        rate(
          usage({ meter, provider: undefined, keySource: undefined }),
          started,
          card
        ).reason
      ).to.equal("included");
  });

  it("[BIL-029] bills a call for at least 15 seconds (rule 6)", function () {
    const call = (quantity: number) =>
      rate(
        usage({
          meter: "call.seconds",
          quantity,
          provider: undefined,
          keySource: undefined
        }),
        started,
        card
      );
    expect(call(5)).to.include({
      billable: true,
      reason: "platform_minutes",
      amount: 1_200n,
      category: "platform_minutes"
    });
    expect(call(20).amount).to.equal(1_600n);
    expect(call(160).amount).to.equal(12_800n);
    // Browser tests are billed like calls.
    expect(
      rate(
        usage({
          meter: "call.seconds",
          quantity: 90,
          origin: "browser_test",
          provider: undefined
        }),
        started,
        card
      ).billable
    ).to.equal(true);
  });

  it("[BIL-029] bills noise cancelling on our key as an add-on (rule 8)", function () {
    expect(
      rate(
        usage({ meter: "nc.seconds", quantity: 160, provider: "ai-coustics" }),
        started,
        card
      )
    ).to.include({
      reason: "addon",
      amount: 320n,
      category: "addons"
    });
  });

  it("[BIL-028] does not bill usage the card has no price for, and says so (rule 9)", function () {
    expect(
      rate(
        usage({ meter: "embedding.tokens", provider: "openai" }),
        started,
        card
      )
    ).to.include({
      billable: false,
      reason: "unpriced"
    });
    expect(rate(usage(), started, undefined).reason).to.equal("unpriced");
  });

  it("[BIL-028] does not bill usage from before the account started billing", function () {
    expect(
      rate(usage({ occurredAt: "2026-10-30T00:00:00Z" }), started, card).reason
    ).to.equal("before_billing");
  });

  it("[BIL-029] prices eval tokens on our key like call tokens", function () {
    expect(
      rate(
        usage({
          meter: "llm.tokens.in",
          origin: "eval",
          provider: "openai",
          model: "gpt-x",
          quantity: 10_000
        }),
        started,
        card
      )
    ).to.include({ billable: true, amount: 2_500n });
  });

  it("[BIL-029] finds prices by provider and model, with * as the fallback", function () {
    expect(priceOf(card, "tts.characters", "azure")).to.equal(0.01);
    expect(priceOf(card, "llm.tokens.in", "openai", "gpt-other")).to.equal(
      0.0005
    );
    expect(priceOf(card, "llm.tokens.in", "groq")).to.equal(undefined);
  });

  it("[BIL-030] uses the card in force when the usage happened", function () {
    const one = {
      ...card,
      version: 1,
      startsAt: new Date("2026-11-01T00:00:00Z")
    };
    const two = {
      ...card,
      version: 2,
      startsAt: new Date("2026-11-15T00:00:00Z")
    };
    expect(
      cardAt([one, two], new Date("2026-11-14T23:00:00Z"))?.version
    ).to.equal(1);
    expect(
      cardAt([one, two], new Date("2026-11-16T00:00:00Z"))?.version
    ).to.equal(2);
    expect(cardAt([one, two], new Date("2026-10-01T00:00:00Z"))).to.equal(
      undefined
    );
  });

  it("[BIL-052] card 1 prices every meter the launch providers emit, with its source", function () {
    const root = join(__dirname, "../../..");
    const [one] = loadRateCards(join(__dirname, "../rate-cards"));
    expect(one.version).to.equal(1);
    expect(one.source).to.match(/2026-10-30/);
    expect(one.source).not.to.match(/NOT FINAL|not filled/i);
    // $0.05 a minute: a 60-second call is exactly 5 credits.
    expect(
      rate(
        usage({ meter: "call.seconds", quantity: 60, provider: undefined }),
        started,
        one
      ).amount
    ).to.equal(5_000n);
    // The catalog the bundle ships: which meters each launch provider's capabilities emit. At
    // launch the card prices Deepgram speech and every LLM provider; other usage is unpriced.
    const { entries } = parse(
      readFileSync(join(root, "ops/bundle/config/catalog.yaml"), "utf8")
    ) as {
      entries: {
        kind: string;
        id: string;
        capabilities?: string[];
        type?: string;
        state?: string;
      }[];
    };
    const meters: Record<string, string[]> = {
      stt: ["stt.seconds"],
      tts: ["tts.characters"],
      llm: ["llm.tokens.in", "llm.tokens.out", "llm.tokens.cached"]
    };
    const launch = (provider: string, capability: string) =>
      capability === "llm" ||
      (provider === "deepgram" && ["stt", "tts"].includes(capability));
    const lines: Partial<RecordedUsage>[] = [];
    for (const p of entries.filter((e) => e.kind === "provider"))
      for (const capability of (p.capabilities ?? []).filter((c) =>
        launch(p.id, c)
      )) {
        const models = entries.filter(
          (e) =>
            e.kind === "model" &&
            e.type === capability &&
            e.state === "active" &&
            e.id.startsWith(`${p.id}/`)
        );
        for (const meter of meters[capability]) {
          lines.push({ meter, provider: p.id });
          models.forEach((m) =>
            lines.push({ meter, provider: p.id, model: m.id })
          );
        }
      }
    expect(lines.length).to.be.greaterThan(10);
    for (const line of lines) {
      const rated = rate(usage({ quantity: 1000, ...line }), started, one);
      expect(rated.reason, JSON.stringify(line)).not.to.equal("unpriced");
      expect(rated.amount > 0n, JSON.stringify(line)).to.equal(true);
    }
  });
});
