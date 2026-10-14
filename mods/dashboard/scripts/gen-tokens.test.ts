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
// @vitest-environment node
import { readFileSync } from "node:fs";
import { generateTokensCss, TOKENS_CSS, TOKENS_JSON } from "./gen-tokens";

describe("design tokens", () => {
  it("tokens.css is up to date with design/tokens.json (run npm run gen:tokens)", () => {
    const tokens = JSON.parse(readFileSync(TOKENS_JSON, "utf8"));
    expect(readFileSync(TOKENS_CSS, "utf8")).toBe(generateTokensCss(tokens));
  });

  it("resolves references per theme", () => {
    const css = generateTokensCss({
      variables: {
        ink: { type: "color", value: "#111111" },
        paper: { type: "color", value: "#FFFFFF" },
        "--foreground": {
          type: "color",
          value: [
            { value: "$ink", theme: { mode: "light" } },
            { value: "$paper", theme: { mode: "dark" } }
          ]
        },
        "--radius-control": { type: "number", value: 10 }
      }
    });
    const [dark, light] = css.split('[data-theme="light"]');
    expect(dark).toContain("--foreground: #ffffff;");
    expect(light).toContain("--foreground: #111111;");
    expect(dark).toContain("--fn-ink: #111111;");
    expect(dark).toContain("--radius-control: 10px;");
  });

  it("fails on an unknown reference", () => {
    expect(() =>
      generateTokensCss({ variables: { a: { type: "color", value: "$missing" } } })
    ).toThrow(/unknown token "missing"/);
  });
});
