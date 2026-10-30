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
import { parseAnnouncement } from "./announcement";

const shown = {
  show: true,
  tone: "warning",
  lead: "The biggest update in Fonoster history.",
  text: "Move your apps to the new version.",
  cta: "Read the upgrade plan",
  link: "https://fonoster.com/upgrade"
};

describe("parseAnnouncement", () => {
  it("reads a shown announcement", () => {
    expect(parseAnnouncement({ announcement: shown })).toEqual(shown);
  });

  it("shows nothing for show: false, an empty message or no file", () => {
    expect(
      parseAnnouncement({ announcement: { ...shown, show: false } })
    ).toBeNull();
    expect(
      parseAnnouncement({ announcement: { show: true, lead: "", text: "" } })
    ).toBeNull();
    expect(parseAnnouncement(undefined)).toBeNull();
    expect(parseAnnouncement("<!doctype html>")).toBeNull();
  });

  it("ignores an announcement with an unknown tone", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      parseAnnouncement({ announcement: { ...shown, tone: "loud" } })
    ).toBeNull();
  });

  it("drops a link that isn't http(s), keeping the message", () => {
    expect(
      parseAnnouncement({
        announcement: { ...shown, link: "javascript:alert(1)" }
      })
    ).toEqual({ ...shown, cta: "", link: "" });
  });
});
