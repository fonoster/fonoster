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
import type { Workspace } from "@fonoster/types";
import { screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { WorkspaceProvider } from "~/lib/workspace";
import CreateWorkspacePage from "~/workspaces/create-workspace.page";
import { CallsScreen } from "~/session";
import { SessionApiProvider } from "~/session/api";
import { createMockSessionApi } from "~/session/mock-api";
import SecretsScreen from "~/secrets";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { RegionsApiProvider } from "./api";
import { RegionBanner } from "./banner";
import { createMockRegionsApi, privateRegion } from "./mock-api";
import { RegionSettings } from "./region-settings";
import RegionSetup from "./setup";
import { remaining } from "./status";

const privateWs = { ...testWorkspace, region: "rg_7K2QF" } as Workspace;
const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 3600_000 + 30_000).toISOString();
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

function render(
  element: ReactElement,
  api = createMockRegionsApi(),
  opts: Parameters<typeof renderScreen>[1] = {},
  ws: Workspace = privateWs
) {
  return {
    api,
    ...renderScreen(
      <RegionsApiProvider value={api}>
        <WorkspaceProvider value={ws}>{element}</WorkspaceProvider>
      </RegionsApiProvider>,
      { auth: fakeAuth({ status: "signedIn" }), ...opts }
    )
  };
}

describe("create workspace with a region", () => {
  const create = (api = createMockRegionsApi()) =>
    render(<CreateWorkspacePage />, api, {
      path: "/workspaces/new",
      route: "/workspaces/new"
    });

  it("offers us-east-1 and a private region, with one permanence line", async () => {
    create();
    const select = await screen.findByLabelText("Region");
    expect(select).toHaveValue("us-east-1");
    expect(
      screen.getByRole("option", { name: "Private region" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("You can't change the region later.")
    ).toBeInTheDocument();
  });

  it("creates a public workspace without a confirm step", async () => {
    const { user, api } = create();
    await user.type(await screen.findByLabelText("Name"), "Acme Support");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(api.state.created).toEqual([
        { name: "Acme Support", region: "us-east-1" }
      ])
    );
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/w/ws-new"
    );
  });

  it("confirms a private region before creating and opens the setup", async () => {
    const { user, api } = create();
    await user.type(await screen.findByLabelText("Name"), "Acme Private");
    await user.selectOptions(
      await screen.findByLabelText("Region"),
      "Private region"
    );
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByText(/runs on your own servers/)).toBeInTheDocument();
    expect(api.state.created).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(api.state.created).toHaveLength(1));
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/w/ws-new/region-setup"
    );
  });
});

describe("region setup", () => {
  const enrollment = { token: "tok.en.123", expiresAt: hoursFromNow(5) };
  const setup = (
    region = privateRegion({ status: "waiting", version: undefined })
  ) =>
    render(<RegionSetup />, createMockRegionsApi(region), {
      path: "/w/:workspaceRef/region-setup",
      route: "/w/ws-1/region-setup",
      state: { enrollment }
    });

  it("shows one install command with Compose or Helm, expiry and the missing keys", async () => {
    const { user } = setup();
    expect(await screen.findByLabelText("Docker Compose")).toHaveTextContent(
      "tok.en.123"
    );
    expect(screen.queryByLabelText("Helm")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "Helm" }));
    expect(screen.getByLabelText("Helm")).toHaveTextContent("helm install");
    expect(screen.getByText(/Expires in 5h/)).toBeInTheDocument();
    expect(
      await screen.findByText("fonoster-region secrets set elevenlabs")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("fonoster-region secrets set deepgram")
    ).toBeNull();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
  });

  it("moves to connected when the status polling sees the region", async () => {
    const { api } = setup();
    await screen.findByText("Waiting");
    api.state.region = privateRegion({ status: "connected" });
    expect(
      await screen.findByText("Connected", {}, { timeout: 6000 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to the dashboard" })
    ).toBeInTheDocument();
  }, 10000);

  it("re-issues a token", async () => {
    const { user } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Re-issue token" })
    );
    expect(await screen.findByLabelText("Docker Compose")).toHaveTextContent(
      "reissued"
    );
  });

  it("formats the countdown", () => {
    expect(
      remaining(new Date(Date.now() + 90 * 60_000 + 5000).toISOString())
    ).toBe("1h 30m");
    expect(remaining(new Date(Date.now() - 1).toISOString())).toBeUndefined();
  });
});

describe("Settings → Region", () => {
  it("shows a connected private region", async () => {
    render(<RegionSettings />);
    expect((await screen.findByText("Status")).nextSibling).toHaveTextContent(
      "Connected"
    );
    expect(screen.getByText("0.28.1")).toBeInTheDocument();
    expect(screen.getByText("Nodes").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("Active calls").nextSibling).toHaveTextContent("3");
  });

  it("says offline in one line", async () => {
    render(
      <RegionSettings />,
      createMockRegionsApi(
        privateRegion({ status: "offline", lastHeartbeatAt: ago(10) })
      )
    );
    expect(
      await screen.findByText("Your region is offline.")
    ).toBeInTheDocument();
    expect(screen.getByText("Last seen").nextSibling).toHaveTextContent(
      "10 min ago"
    );
  });

  it("says unsupported in one line", async () => {
    render(
      <RegionSettings />,
      createMockRegionsApi(
        privateRegion({
          status: "unsupported",
          unsupportedReason: "Version 0.20.0 is too old."
        })
      )
    );
    expect(
      await screen.findByText("Your region needs an upgrade.")
    ).toBeInTheDocument();
  });

  it("shows degraded", async () => {
    render(
      <RegionSettings />,
      createMockRegionsApi(privateRegion({ status: "degraded", gateways: 0 }))
    );
    expect(
      await screen.findByText("Part of your region is unhealthy.")
    ).toBeInTheDocument();
  });

  it("re-issues a token", async () => {
    const { user } = render(<RegionSettings />);
    await user.click(
      await screen.findByRole("button", { name: "Re-issue token" })
    );
    expect(await screen.findByLabelText("Docker Compose")).toHaveTextContent(
      "reissued"
    );
  });

  it("disconnects behind a confirmation", async () => {
    const { user, api } = render(<RegionSettings />);
    await user.click(await screen.findByRole("button", { name: "Disconnect" }));
    expect(screen.getByText(/stops taking calls/)).toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: "Disconnect" }).at(-1)!
    );
    await waitFor(() => expect(api.state.region.status).toBe("waiting"));
    expect((await screen.findByText("Status")).nextSibling).toHaveTextContent(
      "Waiting"
    );
  });

  it("is read-only for a public region", async () => {
    render(<RegionSettings />, createMockRegionsApi(), {}, testWorkspace);
    expect(await screen.findByText("us-east-1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull();
  });
});

describe("Secrets for a private workspace", () => {
  it("lists names with set or missing, and one line", async () => {
    render(<SecretsScreen />);
    expect(await screen.findByText("deepgram")).toBeInTheDocument();
    expect(screen.getByText("Set")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByText(/1 missing/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add secret" })).toBeNull();
  });
});

describe("call detail", () => {
  const call = (region = privateRegion()) => {
    const sessionApi = createMockSessionApi();
    return render(
      <SessionApiProvider value={sessionApi}>
        <CallsScreen />
      </SessionApiProvider>,
      createMockRegionsApi(region),
      { path: "/w/:workspaceRef/calls/*", route: "/w/ws-1/calls/room-1" }
    );
  };

  it("badges calls stored in the region", async () => {
    call();
    expect(
      await screen.findByText("Stored in your region")
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("region", { name: "Turns" })
    ).toBeInTheDocument();
  });

  it("shows metadata only while the region is offline", async () => {
    call(privateRegion({ status: "offline", lastHeartbeatAt: ago(5) }));
    expect(
      await screen.findByText(
        "Your region is offline. Only call details are shown."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Turns" })).toBeNull();
    expect(
      screen.getByRole("heading", { name: /Call room-1/ })
    ).toBeInTheDocument();
  });
});

describe("offline banner", () => {
  it("shows for an offline private region only", async () => {
    const { unmount } = render(
      <RegionBanner />,
      createMockRegionsApi(
        privateRegion({ status: "offline", lastHeartbeatAt: ago(3) })
      )
    );
    expect(
      await screen.findByText(/Your region is offline. Last seen 3 min ago/)
    ).toBeInTheDocument();
    unmount();
    render(<RegionBanner />);
    await waitFor(() => expect(screen.queryByText(/offline/)).toBeNull());
  });
});
