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
import { uriSchema } from "./trunk-form";

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
