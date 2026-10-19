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
import { describe, expect, it } from "vitest";
import { NAVIGATION } from "./shell/nav";

describe("sidebar", () => {
  it("says Agents, Apps and SIP agents", () => {
    const items = NAVIGATION.flatMap((section) => section.items);
    for (const [label, path] of [
      ["Agents", "agents"],
      ["Apps", "apps"],
      ["SIP agents", "sip-agents"]
    ])
      expect(items).toContainEqual(expect.objectContaining({ label, path }));
    expect(
      items.some((item) =>
        ["Autopilot", "Streams", "SIP users"].includes(item.label)
      )
    ).toBe(false);
  });
});
