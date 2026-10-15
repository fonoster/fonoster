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
import { cloudCapabilities } from "~/lib/fixtures";
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

  it("offers us-east-1 and a private region, with the permanent note", async () => {
    create();
    expect(await screen.findByRole("radio", { name: /US East/ })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Private region/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/The region is permanent/)).toBeInTheDocument();
  });

  it("creates a public workspace without a confirm step", async () => {
    const { user, api } = create();
    await user.type(
      await screen.findByLabelText("Workspace name"),
      "Acme Support"
    );
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
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
    await user.type(
      await screen.findByLabelText("Workspace name"),
      "Acme Private"
    );
    await user.click(screen.getByRole("radio", { name: /Private region/ }));
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
    expect(screen.getByText(/can't be changed afterwards/)).toBeInTheDocument();
    expect(api.state.created).toEqual([]);
    await user.click(
      screen.getByRole("button", { name: "Create private workspace" })
    );
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

  it("shows the token, install commands, countdown and the keys to set", async () => {
    setup();
    expect(await screen.findByLabelText("Enrollment token")).toHaveTextContent(
      "tok.en.123"
    );
    expect(screen.getByLabelText("Docker Compose")).toHaveTextContent(
      "docker compose"
    );
    expect(screen.getByLabelText("Helm")).toHaveTextContent("helm install");
    expect(screen.getByText(/Expires in 5h/)).toBeInTheDocument();
    expect(
      await screen.findByText("fonoster-region secrets set deepgram")
    ).toBeInTheDocument();
    expect(screen.getByText(/first heartbeat/)).toBeInTheDocument();
  });

  it("moves to connected when the status polling sees the heartbeat", async () => {
    const { api } = setup();
    await screen.findByText(/first heartbeat/);
    api.state.region = privateRegion({ status: "connected" });
    expect(
      await screen.findByText(/Your region is connected/, {}, { timeout: 6000 })
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
    expect(await screen.findByLabelText("Enrollment token")).toHaveTextContent(
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
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("0.28.1")).toBeInTheDocument();
    expect(screen.getByText("Media nodes").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("Active calls").nextSibling).toHaveTextContent("3");
  });

  it("explains offline, unsupported and degraded", async () => {
    render(
      <RegionSettings />,
      createMockRegionsApi(
        privateRegion({ status: "offline", lastHeartbeatAt: ago(10) })
      )
    );
    expect(
      await screen.findByText(
        /Your region is offline. Last heartbeat 10 min ago/
      )
    ).toBeInTheDocument();
  });

  it("shows the unsupported reason", async () => {
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
      await screen.findByText("Version 0.20.0 is too old.")
    ).toBeInTheDocument();
  });

  it("shows degraded", async () => {
    render(
      <RegionSettings />,
      createMockRegionsApi(privateRegion({ status: "degraded", gateways: 0 }))
    );
    expect(
      await screen.findByText(/component of your region is unhealthy/)
    ).toBeInTheDocument();
  });

  it("re-issues a token", async () => {
    const { user } = render(<RegionSettings />);
    await user.click(
      await screen.findByRole("button", { name: "Re-issue token" })
    );
    expect(await screen.findByLabelText("Enrollment token")).toHaveTextContent(
      "reissued"
    );
  });

  it("disconnects behind a confirmation", async () => {
    const { user, api } = render(<RegionSettings />);
    await user.click(await screen.findByRole("button", { name: "Disconnect" }));
    expect(screen.getByText(/credentials are revoked/)).toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: "Disconnect" }).at(-1)!
    );
    await waitFor(() => expect(api.state.region.status).toBe("waiting"));
    expect(
      await screen.findByText("Waiting for your region")
    ).toBeInTheDocument();
  });

  it("is read-only for a public region", async () => {
    render(<RegionSettings />, createMockRegionsApi(), {}, testWorkspace);
    expect(await screen.findByText("us-east-1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull();
  });

  it("mentions the flat fee only when billing is enabled", async () => {
    const { unmount } = render(<RegionSettings />, createMockRegionsApi(), {
      capabilities: cloudCapabilities
    });
    expect(await screen.findByText(/flat monthly fee/)).toBeInTheDocument();
    unmount();
    render(<RegionSettings />);
    await screen.findByText("Connected");
    expect(screen.queryByText(/flat monthly fee/)).toBeNull();
  });
});

describe("Secrets for a private workspace", () => {
  it("lists names, used by, and set or missing", async () => {
    render(<SecretsScreen />);
    expect(await screen.findByText("deepgram")).toBeInTheDocument();
    expect(screen.getByText("Support line, Sales bot")).toBeInTheDocument();
    expect(screen.getByText("Set in your region")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByText(/1 key is missing/)).toBeInTheDocument();
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
      await screen.findByText(/can't be opened. Only/)
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
      await screen.findByText(/Your region is offline/)
    ).toBeInTheDocument();
    unmount();
    render(<RegionBanner />);
    await waitFor(() => expect(screen.queryByText(/offline/)).toBeNull());
  });
});
