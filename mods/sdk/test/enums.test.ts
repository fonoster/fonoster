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
import * as Types from "@fonoster/types";
import { expect } from "chai";
import * as NodeSdk from "../src/node";
import * as WebSdk from "../src/web";

const ENUMS = [
  "Privacy",
  "ApplicationType",
  "ExpectedTextType",
  "CallType",
  "CallStatus",
  "DialStatus",
  "CallDirection",
  "AmdStatus",
  "ContactType",
  "Role",
  "WorkspaceMemberStatus"
] as const;

describe("@sdk/enums", function () {
  for (const [entry, sdk] of [
    ["node", NodeSdk],
    ["web", WebSdk]
  ] as const) {
    for (const name of ENUMS) {
      it(`the ${entry} entry exports ${name} from @fonoster/types`, function () {
        expect((sdk as Record<string, unknown>)[name]).to.equal(Types[name]);
        expect(Types[name]).to.be.an("object");
      });
    }
  }
});
