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
import {
  offersNumberFormats,
  takesPrefix,
  toRequest,
  toValues,
  trunkSchema,
  uriSchema
} from "./trunk-form";

const uri = {
  host: "sip.carrier.com",
  port: 5060,
  transport: "UDP",
  user: "",
  priority: 1,
  weight: 10,
  enabled: true
};

describe("trunk URI messages", () => {
  it.each([
    ["port", "1–65535"],
    ["priority", "0 or more"],
    ["weight", "0 or more"]
  ])("a non-number %s says %s", (field, message) => {
    const result = uriSchema.safeParse({ ...uri, [field]: "x" });
    expect(
      result.error!.issues.map((i) => [i.path.join("."), i.message])
    ).toEqual([[field, message]]);
  });
});

describe("number formats", () => {
  const values = (formats: Record<string, string>) =>
    trunkSchema.safeParse({
      ...toValues(),
      name: "Acme",
      inboundUri: "acme.pstn.fonoster.local",
      uris: [uri],
      ...formats
    });

  it("refuses a prefix other than 1 to 20 of digits, * and #", () => {
    for (const bad of ["9a", "9 9", "1".repeat(21)]) {
      const result = values({
        calledNumberFormat: "NATIONAL",
        calledNumberPrefix: bad
      });
      expect(result.error!.issues.map((i) => i.message)).toEqual([
        "Use only digits, * and #, up to 20."
      ]);
    }
    for (const good of ["", "9", "9#", "*67", "1".repeat(20)])
      expect(
        values({ calledNumberFormat: "NATIONAL", calledNumberPrefix: good })
          .success
      ).toBe(true);
  });

  it("sends all four fields, with an empty prefix for a format that takes none", () => {
    const request = toRequest({
      ...toValues(),
      calledNumberFormat: "NATIONAL",
      calledNumberPrefix: " 9 ",
      callerNumberFormat: "E164",
      callerNumberPrefix: "5"
    });
    expect(request).toMatchObject({
      calledNumberFormat: "NATIONAL",
      calledNumberPrefix: "9",
      callerNumberFormat: "E164",
      callerNumberPrefix: ""
    });
    expect(toRequest(toValues())).toMatchObject({
      calledNumberFormat: "NUMBER_FORMAT_UNSPECIFIED",
      calledNumberPrefix: "",
      callerNumberFormat: "NUMBER_FORMAT_UNSPECIFIED",
      callerNumberPrefix: ""
    });
  });

  it("takes a prefix only with E.164 without +, National or International", () => {
    expect(
      [
        "NUMBER_FORMAT_UNSPECIFIED",
        "E164",
        "E164_WITHOUT_PLUS",
        "NATIONAL",
        "INTERNATIONAL"
      ].map(takesPrefix)
    ).toEqual([false, false, true, true, true]);
  });

  it("isn't offered on Trunks made by Link Twilio or Link WhatsApp", () => {
    expect(offersNumberFormats([{ host: "acme.pstn.twilio.com" }])).toBe(false);
    expect(offersNumberFormats([{ host: "wa.meta.vc" }])).toBe(false);
    expect(offersNumberFormats([{ host: "sip.claro.com.do" }])).toBe(true);
  });
});
