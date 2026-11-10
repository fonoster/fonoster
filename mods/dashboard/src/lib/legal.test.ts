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
import { parseLegal } from "./legal";

const terms = "https://example.com/terms";
const privacy = "https://example.com/privacy";

describe("parseLegal", () => {
  it("reads both links", () => {
    expect(parseLegal({ legal: { terms, privacy } })).toEqual({
      terms,
      privacy
    });
  });

  it("reads only the terms or only the privacy policy", () => {
    expect(parseLegal({ legal: { terms, privacy: "" } })).toEqual({
      terms,
      privacy: ""
    });
    expect(parseLegal({ legal: { privacy } })).toEqual({
      terms: "",
      privacy
    });
  });

  it("shows nothing for empty values, no legal key or no file", () => {
    expect(parseLegal({ legal: { terms: "", privacy: "" } })).toBeNull();
    expect(parseLegal({ legal: { terms: null, privacy: null } })).toBeNull();
    expect(parseLegal({ announcement: { show: false } })).toBeNull();
    expect(parseLegal(null)).toBeNull();
    expect(parseLegal("<!doctype html>")).toBeNull();
  });

  it("drops a link that isn't http(s), with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      parseLegal({ legal: { terms: "javascript:alert(1)", privacy } })
    ).toEqual({ terms: "", privacy });
    expect(warn).toHaveBeenCalled();
  });
});
