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
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderScreen } from "~/test/render";
import SessionPreviewScreen from ".";
import { describeMessage } from "./calls";
import { validateApp } from "./apps";

describe("session preview", () => {
  it("lists apps from the mock adapter", async () => {
    renderScreen(<SessionPreviewScreen />, {
      path: "/w/:ws/preview/*",
      route: "/w/ws-1/preview/apps"
    });
    expect(await screen.findByText("Support line")).toBeInTheDocument();
    expect(screen.getByText("twilio")).toBeInTheDocument();
  });

  it("shows the call record timeline and recording link", async () => {
    renderScreen(<SessionPreviewScreen />, {
      path: "/w/:ws/preview/*",
      route: "/w/ws-1/preview/calls/room-1"
    });
    expect(await screen.findByText("Call room-1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /download recording/i })
    ).toHaveAttribute("href", expect.stringContaining("room-1.wav"));
    expect(
      screen.getByText("speak: Hi! What can I do for you?")
    ).toBeInTheDocument();
  });

  it("rotates the secret behind a confirmation and shows it once", async () => {
    const { user } = renderScreen(<SessionPreviewScreen />, {
      path: "/w/:ws/preview/*",
      route: "/w/ws-1/preview/apps/support-line"
    });
    await user.click(
      await screen.findByRole("button", { name: "Rotate secret" })
    );
    expect(screen.getByText(/no overlap window/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rotate now" }));
    expect(await screen.findByText(/shown once/)).toBeInTheDocument();
  });

  it("validates url and ref", () => {
    expect(validateApp({ ref: "ok-app", url: "wss://x" })).toEqual({});
    expect(Object.keys(validateApp({ ref: "A", url: "http://x" }))).toEqual([
      "ref",
      "url"
    ]);
  });

  it("describes messages", () => {
    expect(describeMessage({ type: "session.end", reason: "app_hangup" })).toBe(
      "session.end: app_hangup"
    );
  });
});
