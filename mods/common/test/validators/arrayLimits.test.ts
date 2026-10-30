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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { z } from "zod";
import { sessionAppInputSchema } from "../../../apiserver/src/applications/session/appModel";
import { getUsageRequestSchema } from "../../../apiserver/src/usage/createGetUsage";
import { sessionAgentSchema } from "../../src/agents/sessionAgentSchema";
import { testCasesSchema } from "../../src/agents/testCasesSchema";
import { toolSchema } from "../../src/agents/tools/toolSchema";
import { handleError } from "../../src/errors/handleError";
import {
  createAclRequestSchema,
  updateAclRequestSchema
} from "../../src/validators/sipnet/acls";
import { createTrunkRequestSchema } from "../../src/validators/sipnet/trunks";

// #1220: every request array has a size limit (GHSA-mrhx-c7xc-m3w5). At the limit a request
// passes; one over fails with INVALID_ARGUMENT and the cap's own message.

const times = <T>(n: number, of: (i: number) => T) =>
  Array.from({ length: n }, (_, i) => of(i));

const uri = {
  host: "sip.example.com",
  port: 5060,
  transport: "UDP",
  weight: 10,
  priority: 1
};

const tool = {
  name: "lookup",
  description: "Looks up an order",
  parameters: { type: "object", properties: { id: { type: "string" } } },
  operation: { method: "get", url: "https://api.example.com/orders" }
};

const agent = (tools: unknown[]) => ({
  conversationSettings: {
    systemPrompt: "You are helpful.",
    goodbyeMessage: "Bye",
    systemErrorMessage: "Sorry"
  },
  languageModel: { model: "openai/gpt-4o-mini", tools }
});

const turn = {
  userInput: "hi",
  expected: { text: { type: "EXACT", response: "hello" } }
};

const scenario = (turns: number) => ({
  ref: "s",
  description: "a scenario",
  telephonyContext: {
    callDirection: "FROM_PSTN",
    ingressNumber: "+15555550100",
    callerNumber: "+15555550101"
  },
  conversation: times(turns, () => turn)
});

const testCases = (scenarios: unknown[]) => ({
  evalsLanguageModel: { provider: "openai", model: "gpt-4o-mini" },
  scenarios
});

type Row = {
  name: string;
  schema: z.ZodTypeAny;
  limit: number;
  input: (n: number) => unknown;
  message?: string;
};

const ROWS: Row[] = [
  {
    name: "create trunk uris",
    schema: createTrunkRequestSchema,
    limit: 10,
    input: (n) => ({
      name: "Trunk",
      inboundUri: "trunk.example.com",
      uris: times(n, () => uri)
    }),
    message: 'At most 10 URIs at "uris"'
  },
  {
    name: "create ACL allow",
    schema: createAclRequestSchema,
    limit: 100,
    input: (n) => ({ name: "Office", allow: times(n, () => "10.0.0.1") }),
    message: 'At most 100 entries at "allow"'
  },
  {
    name: "update ACL allow",
    schema: updateAclRequestSchema,
    limit: 100,
    input: (n) => ({ name: "Office", allow: times(n, () => "10.0.0.1") }),
    message: 'At most 100 entries at "allow"'
  },
  {
    name: "application filters",
    schema: sessionAppInputSchema,
    limit: 50,
    input: (n) => ({
      name: "app",
      filters: times(n, (i) => ({ name: `f${i}` }))
    }),
    message: 'At most 50 filters at "filters"'
  },
  {
    name: "agent tools",
    schema: sessionAgentSchema,
    limit: 50,
    input: (n) => agent(times(n, () => tool)),
    message: 'At most 50 tools at "languageModel.tools"'
  },
  {
    name: "tool required properties",
    schema: toolSchema,
    limit: 50,
    input: (n) => ({
      ...tool,
      parameters: { ...tool.parameters, required: times(n, () => "id") }
    }),
    message: 'At most 50 required properties at "parameters.required"'
  },
  {
    name: "test case scenarios",
    schema: testCasesSchema,
    limit: 100,
    input: (n) => testCases(times(n, () => scenario(1))),
    message: 'At most 100 scenarios at "scenarios"'
  },
  {
    name: "test case turns",
    schema: testCasesSchema,
    limit: 50,
    input: (n) => testCases([scenario(n)]),
    message: 'At most 50 turns at "scenarios[0].conversation"'
  },
  {
    name: "usage groupBy",
    schema: getUsageRequestSchema,
    limit: 7,
    input: (n) => ({
      fromDay: "2026-10-01",
      toDay: "2026-10-30",
      groupBy: times(n, () => "day")
    }),
    message: 'At most 7 dimensions at "groupBy"'
  },
  {
    name: "agent knowledge base",
    schema: sessionAgentSchema,
    limit: 50,
    input: (n) => ({
      ...agent([]),
      languageModel: {
        ...agent([]).languageModel,
        knowledgeBase: times(n, () => ({
          type: "s3",
          title: "Doc",
          document: "doc.pdf"
        }))
      }
    }),
    message: 'At most 50 documents at "languageModel.knowledgeBase"'
  },
  {
    name: "agent hints (unchanged)",
    schema: sessionAgentSchema,
    limit: 100,
    input: (n) => ({
      ...agent([]),
      conversationSettings: {
        ...agent([]).conversationSettings,
        hints: times(n, () => "Fonoster")
      }
    }),
    // Built-in message (no custom text): only the code is pinned.
    message: undefined
  }
];

function callbackOf(schema: z.ZodTypeAny, input: unknown) {
  const result = schema.safeParse(input);
  expect(result.success, "parse should fail").to.equal(false);
  let got: { code: number; message: string } | undefined;
  handleError(result.error as z.ZodError, (e) => (got = e));
  return got!;
}

describe("@common[validators/arrayLimits]", function () {
  for (const row of ROWS) {
    it(`${row.name}: ${row.limit} pass, ${row.limit + 1} fail`, function () {
      const ok = row.schema.safeParse(row.input(row.limit));
      expect(ok.success, JSON.stringify(ok.error?.issues)).to.equal(true);
      const error = callbackOf(row.schema, row.input(row.limit + 1));
      expect(error.code).to.equal(status.INVALID_ARGUMENT);
      if (row.message) expect(error.message).to.equal(row.message);
    });
  }

  it("a 100,000-entry ACL is rejected", function () {
    const allow = times(100_000, () => "10.0.0.1");
    expect(
      callbackOf(createAclRequestSchema, { name: "Office", allow })
    ).to.deep.equal({
      code: status.INVALID_ARGUMENT,
      message: 'At most 100 entries at "allow"'
    });
  });

  it("stops at the cap: 100,000 invalid entries are one too_big issue", function () {
    const allow = times(100_000, () => "not an ip");
    const result = createAclRequestSchema.safeParse({ name: "Office", allow });
    expect(result.success).to.equal(false);
    expect(result.error!.issues.map((i) => i.code)).to.deep.equal(["too_big"]);
    expect(
      callbackOf(createAclRequestSchema, { name: "Office", allow }).code
    ).to.equal(status.INVALID_ARGUMENT);
  });
});
