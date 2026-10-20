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
import { Usage } from "@fonoster/common";
import { expect } from "chai";
import { NatsConnection, StringCodec } from "nats";
import {
  attachUsagePublisher,
  reportEvalUsage
} from "../../src/usage/publishUsage";

// An eval's model usage (add-usage-metering 4.5): published for the USAGE stream with origin eval,
// no call, and ids scoped to the eval run and request, so a replayed message is stored once.

const sc = StringCodec();

describe("@apiserver/usage eval usage", function () {
  it("publishes token lines with origin eval and no call reference", () => {
    const sent: { subject: string; event: Record<string, unknown> }[] = [];
    attachUsagePublisher({
      publish: (subject: string, data: Uint8Array) =>
        sent.push({ subject, event: JSON.parse(sc.decode(data)) })
    } as unknown as NatsConnection);
    const lines: Usage.UsageLine[] = [
      {
        meter: "llm.tokens.in",
        quantity: 300,
        provider: "openai",
        model: "openai/gpt-4o-mini",
        keySource: "workspace"
      },
      {
        meter: "llm.tokens.out",
        quantity: 40,
        provider: "openai",
        model: "openai/gpt-4o-mini",
        keySource: "workspace"
      }
    ];
    reportEvalUsage("WS1", lines, "eval|run-1|0");
    reportEvalUsage("WS1", lines, "eval|run-1|1");
    expect(sent.map((s) => s.subject)).to.deep.equal([
      "usage.WS1.llm.tokens.in",
      "usage.WS1.llm.tokens.out",
      "usage.WS1.llm.tokens.in",
      "usage.WS1.llm.tokens.out"
    ]);
    sent.forEach(({ event }) => {
      expect(() => Usage.parseUsageEvent(event)).to.not.throw();
      expect(event).to.include({
        origin: "eval",
        workspaceRef: "WS1",
        regionKind: "public"
      });
      expect(event).to.not.have.property("callRef");
    });
    expect(sent[0].event.id).to.equal(Usage.usageId("eval|run-1|0", lines[0]));
    expect(new Set(sent.map((s) => s.event.id)).size).to.equal(4);
  });
});
