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
import { NAVIGATION } from "./shell/nav";
import { RenamedRedirect } from "./routes";

const at = (route: string, from = "apps", to = "streams") =>
  renderScreen(<RenamedRedirect to={to} />, {
    path: `/w/:workspaceRef/${from}/*`,
    route
  });

describe("Apps is now Streams", () => {
  it("the sidebar says Streams and links to /streams", () => {
    const items = NAVIGATION.flatMap((section) => section.items);
    expect(items).toContainEqual(
      expect.objectContaining({ label: "Streams", path: "streams" })
    );
    expect(items.some((item) => item.label === "Apps")).toBe(false);
  });

  it("redirects /apps to /streams", async () => {
    at("/w/ws-1/apps");
    expect(await screen.findByTestId("location")).toHaveTextContent(
      /^\/w\/ws-1\/streams$/
    );
  });

  it("redirects /apps/:ref to /streams/:ref", async () => {
    at("/w/ws-1/apps/pipecat-bot");
    expect(await screen.findByTestId("location")).toHaveTextContent(
      /^\/w\/ws-1\/streams\/pipecat-bot$/
    );
  });
});

describe("renamed sections", () => {
  it("the sidebar says Agents and SIP agents", () => {
    const items = NAVIGATION.flatMap((section) => section.items);
    expect(items).toContainEqual(
      expect.objectContaining({ label: "Agents", path: "agents" })
    );
    expect(items).toContainEqual(
      expect.objectContaining({ label: "SIP agents", path: "sip-agents" })
    );
    expect(
      items.some((item) => ["Autopilot", "SIP users"].includes(item.label))
    ).toBe(false);
  });

  it("redirects /sip-users to /sip-agents", async () => {
    at("/w/ws-1/sip-users", "sip-users", "sip-agents");
    expect(await screen.findByTestId("location")).toHaveTextContent(
      /^\/w\/ws-1\/sip-agents$/
    );
  });
});
