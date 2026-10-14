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
import { readRuntimeConfig } from "./runtime";

describe("readRuntimeConfig", () => {
  it("reads the API URL and drops trailing slashes", () => {
    expect(readRuntimeConfig({ apiUrl: "https://api.example.com/" })).toEqual({
      ok: true,
      config: { apiUrl: "https://api.example.com" }
    });
  });

  it("names DASHBOARD_API_URL when config.js didn't set anything", () => {
    expect(readRuntimeConfig(undefined)).toEqual({
      ok: false,
      error: "DASHBOARD_API_URL is not set"
    });
    expect(readRuntimeConfig({})).toEqual({
      ok: false,
      error: "DASHBOARD_API_URL is not set"
    });
  });

  it("rejects a value that isn't a URL", () => {
    const result = readRuntimeConfig({ apiUrl: "api.example.com" });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/must be a URL/);
  });
});
