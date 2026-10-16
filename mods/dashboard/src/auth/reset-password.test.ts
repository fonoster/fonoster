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
import { parseResetToken } from "./reset-password.page";

describe("parseResetToken", () => {
  const encode = (value: object) => btoa(JSON.stringify(value));

  it("reads the username and code", () => {
    expect(
      parseResetToken(encode({ username: "ada@acme.com", code: "123456" }))
    ).toEqual({
      username: "ada@acme.com",
      code: "123456"
    });
  });

  it("restores a '+' that arrived as a space", () => {
    const token = encode({ username: "a+b@acme.com>>", code: "1" });
    expect(token).toContain("+");
    expect(parseResetToken(token.replace(/\+/g, " "))?.username).toBe(
      "a+b@acme.com>>"
    );
  });

  it("returns null for a damaged token", () => {
    expect(parseResetToken("%%%")).toBeNull();
    expect(parseResetToken(encode({ username: "x" }))).toBeNull();
    expect(parseResetToken(null)).toBeNull();
  });
});
