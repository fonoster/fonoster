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
import { decodeJwt, msUntilExpiry } from "./jwt";

function token(claims: object) {
  const encode = (value: object) =>
    btoa(
      String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${encode({ alg: "RS256" })}.${encode(claims)}.signature`;
}

describe("jwt", () => {
  it("decodes claims, including non-ASCII text", () => {
    expect(
      decodeJwt(token({ email: "josé@acme.com", mustChangePassword: true }))
    ).toEqual({
      email: "josé@acme.com",
      mustChangePassword: true
    });
  });

  it("returns null for garbage", () => {
    expect(decodeJwt("not-a-token")).toBeNull();
    expect(decodeJwt(undefined)).toBeNull();
  });

  it("measures time to expiry", () => {
    expect(msUntilExpiry(token({ exp: 1_000 }), 400_000)).toBe(600_000);
    expect(msUntilExpiry("bad")).toBeLessThan(0);
  });
});
