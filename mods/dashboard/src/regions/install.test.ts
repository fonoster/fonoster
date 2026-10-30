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
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { composeCommand } from "./install";

// The dashboard's install command for a private region is the docs page's, word for word.
describe("composeCommand", () => {
  it("equals the command on the Install a private region page", () => {
    // The page's code block is indented inside a step.
    const page = readFileSync(
      resolve(
        __dirname,
        "../../../../docs-site/private-regions/install-region.mdx"
      ),
      "utf8"
    )
      .split("\n")
      .map((l) => l.trimStart())
      .join("\n");
    expect(page).toContain(composeCommand("<token>"));
  });
});
