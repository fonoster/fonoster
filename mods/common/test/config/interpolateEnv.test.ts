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
import { interpolateEnv } from "../../src";

describe("@common[config/interpolateEnv]", function () {
  it("replaces a ${VAR} reference from the given env", function () {
    const out = interpolateEnv({ key: "${SECRET}" }, { SECRET: "abc123" });
    expect(out).to.deep.equal({ key: "abc123" });
  });

  it("walks nested objects and arrays", function () {
    const out = interpolateEnv(
      { a: { b: ["${ONE}", "literal", { c: "${TWO}" }] } },
      { ONE: "1", TWO: "2" }
    );
    expect(out).to.deep.equal({ a: { b: ["1", "literal", { c: "2" }] } });
  });

  it("resolves multiple references inside one string", function () {
    const out = interpolateEnv("${HOST}:${PORT}", { HOST: "db", PORT: "5432" });
    expect(out).to.equal("db:5432");
  });

  it("leaves plain literals untouched, including a bare $", function () {
    const out = interpolateEnv(
      { price: "$5.00", url: "http://asterisk:8088" },
      {}
    );
    expect(out).to.deep.equal({ price: "$5.00", url: "http://asterisk:8088" });
  });

  it("uses the default in ${VAR:-default} when the var is unset", function () {
    expect(interpolateEnv("${LEVEL:-info}", {})).to.equal("info");
  });

  it("uses the default in ${VAR:-default} when the var is empty", function () {
    expect(interpolateEnv("${LEVEL:-info}", { LEVEL: "" })).to.equal("info");
  });

  it("supports an empty default (${VAR:-})", function () {
    expect(interpolateEnv("${MAYBE:-}", {})).to.equal("");
  });

  it("prefers the env value over the default", function () {
    expect(interpolateEnv("${LEVEL:-info}", { LEVEL: "debug" })).to.equal(
      "debug"
    );
  });

  it("throws for a bare ${VAR} that is unset", function () {
    expect(() => interpolateEnv("${MISSING}", {})).to.throw(/\$\{MISSING\}/);
  });

  it("throws for a bare ${VAR} that is set but empty", function () {
    expect(() => interpolateEnv("${EMPTY}", { EMPTY: "" })).to.throw(
      /\$\{EMPTY\}/
    );
  });

  it("returns non-string primitives unchanged", function () {
    const out = interpolateEnv({ enabled: false, count: 3, nothing: null }, {});
    expect(out).to.deep.equal({ enabled: false, count: 3, nothing: null });
  });
});
