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
import { getPath, interpolate, match } from "../src";

describe("@conformance/match", function () {
  it("matches partial objects and ignores extra fields", function () {
    expect(
      match(
        { type: "mark", name: "m1" },
        { type: "mark", name: "m1", extra: 1 }
      ).ok
    ).to.equal(true);
    expect(
      match({ type: "mark", name: "m1" }, { type: "mark", name: "m2" }).reason
    ).to.contain("name");
  });

  it("treats * as any present value, including null", function () {
    expect(match({ handoff: "*" }, { handoff: null }).ok).to.equal(true);
    expect(match({ handoff: "*" }, {}).ok).to.equal(false);
    expect(match({ v: { $eq: "*" } }, { v: "x" }).ok).to.equal(false);
    expect(match({ v: { $eq: "*" } }, { v: "*" }).ok).to.equal(true);
  });

  it("matches arrays by length and position", function () {
    expect(match({ tracks: ["inbound"] }, { tracks: ["inbound"] }).ok).to.equal(
      true
    );
    expect(
      match({ tracks: ["inbound"] }, { tracks: ["inbound", "outbound"] }).ok
    ).to.equal(false);
  });

  it("supports the operators", function () {
    expect(match({ $gte: 5 }, 5).ok).to.equal(true);
    expect(match({ $lt: 5 }, 5).ok).to.equal(false);
    expect(match({ $near: 1800, $tolerance: 100 }, 1750).ok).to.equal(true);
    expect(match({ $near: 1800, $tolerance: 100 }, 1600).ok).to.equal(false);
    expect(match({ $contains: "balance" }, "Your balance is").ok).to.equal(
      true
    );
    expect(match({ $re: "^r[0-9]+$" }, "r12").ok).to.equal(true);
    expect(match({ $oneOf: ["a", "b"] }, "b").ok).to.equal(true);
    expect(match({ x: { $absent: true } }, {}).ok).to.equal(true);
    expect(match({ x: { $absent: true } }, { x: 1 }).ok).to.equal(false);
    expect(
      match({ $includes: [{ id: 1 }] }, [{ id: 2 }, { id: 1, side: "inbound" }])
        .ok
    ).to.equal(true);
    expect(match({ $includes: [{ id: 3 }] }, [{ id: 2 }]).ok).to.equal(false);
  });

  it("supports $excludes", function () {
    expect(
      match({ $excludes: [{ role: "tool" }] }, [{ role: "user" }]).ok
    ).to.equal(true);
    expect(
      match({ $excludes: [{ role: "user" }] }, [{ role: "user" }]).ok
    ).to.equal(false);
  });

  it("fails on unknown operators instead of passing", function () {
    expect(match({ $sometimes: 1 }, 1).reason).to.contain("unknown operator");
  });

  it("reads dotted paths", function () {
    expect(
      getPath({ start: { streamSid: "MZ1" } }, "start.streamSid")
    ).to.equal("MZ1");
    expect(getPath({ tracks: [{ id: 7 }] }, "tracks.0.id")).to.equal(7);
  });

  it("interpolates variables, keeping types for whole-string references", function () {
    const out = interpolate(
      { id: "${sid}", text: "id is ${sid}", n: "${n}" },
      { sid: "s1", n: 3 }
    );
    expect(out).to.deep.equal({ id: "s1", text: "id is s1", n: 3 });
    expect(() => interpolate({ id: "${nope}" }, {})).to.throw(
      "unknown variable"
    );
  });
});
