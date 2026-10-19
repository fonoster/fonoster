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
import { struct } from "pb-util";
import {
  rowToApplication,
  toAppColumns
} from "../../src/applications/session/appModel";

// voice-session "An app's audio filters are set through the Applications API": known filters and
// public options only, absent keeps the current list, empty clears it.

const CONFIG = { autopilotUrl: "ws://autopilot:50061" };
const db = {};
const base = {
  name: "a",
  type: "STREAM",
  url: "wss://bot.example.com/session"
};

async function columns(request: Record<string, unknown>) {
  const { columns } = await toAppColumns(
    db,
    { ...base, ...request },
    { accessKeyId: "WO1", config: CONFIG }
  );
  return columns as Record<string, unknown>;
}

async function message(request: Record<string, unknown>) {
  try {
    await columns(request);
  } catch (e) {
    return (e as Error).message;
  }
  return "accepted";
}

describe("@applications/filters", function () {
  it("stores a known filter with public options, decoding a Struct", async function () {
    expect(
      (await columns({ filters: [{ name: "aiCoustics" }] })).filters
    ).to.deep.equal([{ name: "aiCoustics" }]);
    expect(
      (
        await columns({
          filters: [{ name: "aiCoustics", options: { enhancementLevel: 0.8 } }]
        })
      ).filters
    ).to.deep.equal([
      { name: "aiCoustics", options: { enhancementLevel: 0.8 } }
    ]);
    // Over gRPC the options arrive as a google.protobuf.Struct.
    expect(
      (
        await columns({
          filters: [
            { name: "aiCoustics", options: struct.encode({ bypass: true }) }
          ]
        })
      ).filters
    ).to.deep.equal([{ name: "aiCoustics", options: { bypass: true } }]);
  });

  it("rejects server-side options, keys and unknown filters, naming them", async function () {
    expect(
      await message({
        filters: [{ name: "aiCoustics", options: { modelFile: "/etc/passwd" } }]
      })
    ).to.match(/filters: .*aiCoustics.*modelFile/);
    expect(
      await message({
        filters: [{ name: "aiCoustics", options: { license: "abc" } }]
      })
    ).to.match(/license/);
    expect(await message({ filters: [{ name: "krisp" }] })).to.match(
      /unknown audio filter "krisp"/
    );
  });

  it("keeps the current filters when absent and clears them when empty", async function () {
    expect(await columns({})).to.not.have.property("filters");
    expect((await columns({ filters: [] })).filters).to.equal(null);
  });

  it("returns the stored filters with their options as a Struct", function () {
    const row = {
      ref: "r1",
      name: "a",
      type: "STREAM",
      filters: [
        { name: "aiCoustics", options: { enhancementLevel: 0.8 } },
        { name: "other" }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const app = rowToApplication(row as never);
    const filters = app.filters as { name: string; options?: unknown }[];
    expect(filters.map((f) => f.name)).to.deep.equal(["aiCoustics", "other"]);
    expect(struct.decode(filters[0].options as never)).to.deep.equal({
      enhancementLevel: 0.8
    });
    expect(filters[1].options).to.equal(undefined);
    expect(
      rowToApplication({ ...row, filters: null } as never).filters
    ).to.deep.equal([]);
  });
});
