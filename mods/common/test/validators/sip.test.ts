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
import { createCallRequestSchema } from "../../src/validators/calls";
import {
  isSipTarget,
  sipHeaderProblem,
  sipHeadersProblem
} from "../../src/validators/sip";

describe("@common[validators/sip]", function () {
  describe("sipHeaderProblem", function () {
    it("accepts a custom X- header", function () {
      expect(sipHeaderProblem("X-Customer-Id", "abc-123")).to.equal(undefined);
    });

    [
      "X-App-Ref",
      "x-call-ref",
      "X-DOD-Number",
      "X-Access-Key-Id",
      "X-Is-Api-Originated-Type",
      "X-Connect-Token",
      "X-Call-Direction"
    ].forEach((name) =>
      it(`refuses the reserved header ${name}`, function () {
        expect(sipHeaderProblem(name, "v")).to.match(/reserved/);
      })
    );

    [
      "Via",
      "Contact",
      "X-",
      "X-Bad Name",
      "X-a:b",
      `X-${"a".repeat(65)}`
    ].forEach((name) =>
      it(`refuses the header name ${JSON.stringify(name)}`, function () {
        expect(sipHeaderProblem(name, "v")).to.match(/not an X- header/);
      })
    );

    ["a\r\nVia: x", "a\nb", "a\rb", "a\u0000b"].forEach((value) =>
      it(`refuses a value with control characters ${JSON.stringify(value)}`, function () {
        expect(sipHeaderProblem("X-Note", value)).to.match(/control/);
      })
    );

    it("refuses a value that is not a string or is too long", function () {
      expect(sipHeaderProblem("X-Note", 1)).to.match(/string/);
      expect(sipHeaderProblem("X-Note", "a".repeat(257))).to.match(/longer/);
    });
  });

  describe("sipHeadersProblem", function () {
    it("accepts no headers and a few custom ones", function () {
      expect(sipHeadersProblem(undefined)).to.equal(undefined);
      expect(sipHeadersProblem({ "X-A": "1", "X-B": "2" })).to.equal(undefined);
    });

    it("refuses too many headers and any bad one", function () {
      const many = Object.fromEntries(
        Array.from({ length: 17 }, (_, i) => [`X-H${i}`, "v"])
      );
      expect(sipHeadersProblem(many)).to.match(/at most/);
      expect(sipHeadersProblem({ "X-A": "1", "X-App-Ref": "2" })).to.match(
        /reserved/
      );
      expect(sipHeadersProblem(["X-A"])).to.match(/object/);
    });
  });

  describe("isSipTarget", function () {
    [
      "+15551234567",
      "1001",
      "agent.smith",
      "sip:1001@sip.example.com",
      "sips:bob@10.0.0.1:5061",
      "tel:+15551234567"
    ].forEach((to) =>
      it(`accepts ${to}`, function () {
        expect(isSipTarget(to)).to.equal(true);
      })
    );

    [
      "",
      "+1555\r\nVia: x",
      "a b",
      "sip:a@b;transport=tcp",
      "sip:a@b>",
      "<sip:a@b>",
      "a@b",
      "x".repeat(65)
    ].forEach((to) =>
      it(`refuses ${JSON.stringify(to)}`, function () {
        expect(isSipTarget(to)).to.equal(false);
      })
    );
  });

  describe("createCallRequestSchema", function () {
    const appRef = "00000000-0000-4000-8000-000000000000";

    it("accepts an E.164 from and a dialable to", function () {
      const ok = createCallRequestSchema.safeParse({
        from: "+15550001111",
        to: "+15550002222",
        appRef
      });
      expect(ok.success).to.equal(true);
    });

    it("refuses a from that is not an E.164 number", function () {
      ["sip:a@b", "abc", "+1555\r\nX-Dod-Number: 1", ""].forEach((from) =>
        expect(
          createCallRequestSchema.safeParse({
            from,
            to: "+15550002222",
            appRef
          }).success,
          from
        ).to.equal(false)
      );
    });

    it("refuses a to with CR/LF or URI delimiters", function () {
      ["+1555\r\nVia: x", "sip:a@b;x=y", "a b"].forEach((to) =>
        expect(
          createCallRequestSchema.safeParse({
            from: "+15550001111",
            to,
            appRef
          }).success,
          to
        ).to.equal(false)
      );
    });
  });
});
