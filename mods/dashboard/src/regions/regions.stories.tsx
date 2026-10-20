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
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/test";
import { useState, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "~/app/shell/app-shell";
import { sampleCalls } from "~/calls/fixtures";
import type { AuthContextValue } from "~/lib/auth";
import { cloudCapabilities, regionsCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import OverviewScreen from "~/overview";
import SecretsScreen from "~/secrets";
import { CallsScreen } from "~/session";
import { SessionApiProvider } from "~/session/api";
import { createMockSessionApi } from "~/session/mock-api";
import SettingsScreen from "~/settings";
import { testWorkspace } from "~/test/workspace";
import CreateWorkspacePage from "~/workspaces/create-workspace.page";
import WorkspacesPage from "~/workspaces/landing.page";
import { RegionsApiProvider } from "./api";
import { createMockRegionsApi, privateRegion } from "./mock-api";
import type { RegionDetail } from "./types";

const privateWs = {
  ...testWorkspace,
  ref: "ws-2",
  name: "Acme Private",
  region: "acme-dallas"
} as Workspace;

const minutesAgo = (min: number) =>
  new Date(Date.now() - min * 60_000).toISOString();

const offline = privateRegion({ status: "offline", lastSeenAt: minutesAgo(5) });
const waiting = privateRegion({ status: "waiting", version: undefined });
const endpoints = {
  sip: [{ host: "sip.acme.example", port: 5061, transport: "tls" as const }],
  signalingAddresses: ["203.0.113.10"],
  mediaAddresses: ["203.0.113.10", "203.0.113.11"],
  rtpPorts: { min: 20000, max: 20999 }
};

type Mocked = { mockResolvedValue(v: unknown): void };

const signedIn = (auth: AuthContextValue) => {
  (auth.sdk.workspaces.listWorkspaces as unknown as Mocked).mockResolvedValue({
    items: [testWorkspace, privateWs]
  });
  (auth.sdk.users.getUser as unknown as Mocked).mockResolvedValue({
    ref: "u1",
    name: "Pedro Sanders",
    email: "pedro@acme.com"
  });
  return {
    status: "signedIn" as const,
    user: { sub: "u1", email: "pedro@acme.com", accessKeyId: "US1", exp: 0 },
    sdk: {
      ...auth.sdk,
      calls: {
        listCalls: async () => ({ items: sampleCalls, nextPageToken: "" })
      }
    } as never
  };
};

/** The in-memory regions API, kept across re-renders so its state sticks. */
function WithRegions({
  regions = [privateRegion()],
  children
}: {
  regions?: RegionDetail[];
  children: ReactNode;
}) {
  const [api] = useState(() => createMockRegionsApi(regions));
  return <RegionsApiProvider value={api}>{children}</RegionsApiProvider>;
}

const screen = (route: { path: string; url?: string }) => ({
  screen: { route, auth: signedIn, capabilities: regionsCapabilities }
});

const landing = (regions?: RegionDetail[]) => () => (
  <WithRegions regions={regions}>
    <WorkspacesPage />
  </WithRegions>
);

const meta = {
  title: "Regions",
  render: landing(),
  parameters: screen({ path: "/workspaces" })
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Start screen: the workspaces and the "Your regions" section. */
export const Home: Story = {};
export const HomeLight: Story = { globals: { theme: "light" } };

/** A region waiting for its first connection shows the install command. */
export const HomeWaiting: Story = { render: landing([waiting]) };

const drawerScreen = screen({
  path: "/workspaces",
  url: "/workspaces?region=rg_7K2QF"
});

export const RegionDrawer: Story = {
  render: landing([privateRegion({ endpoints })]),
  parameters: drawerScreen
};
export const RegionDrawerLight: Story = {
  ...RegionDrawer,
  globals: { theme: "light" }
};
export const RegionDrawerOffline: Story = {
  render: landing([offline]),
  parameters: drawerScreen
};
/** Fonoster Cloud adds the flat monthly fee. */
export const RegionDrawerCloud: Story = {
  render: landing([
    privateRegion({ endpoints, monthlyFeeCents: 4900, minutesThisMonth: 1000 })
  ]),
  parameters: {
    screen: {
      ...drawerScreen.screen,
      capabilities: { ...cloudCapabilities, regions: { private: true } }
    }
  }
};

export const DisconnectConfirm: Story = {
  ...RegionDrawer,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const drawer = within(await body.findByRole("dialog"));
    await drawer.findByText("Version");
    await userEvent.click(drawer.getByRole("button", { name: "Disconnect" }));
  }
};

export const NewRegion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = within(
      await canvas.findByRole("region", { name: "Your regions" })
    );
    await userEvent.click(
      await section.findByRole("button", { name: /Create region/ })
    );
  }
};
export const NewRegionLight: Story = {
  ...NewRegion,
  globals: { theme: "light" }
};

/** Create workspace, with the region select open. */
export const CreateWorkspace: Story = {
  render: () => (
    <WithRegions>
      <CreateWorkspacePage />
    </WithRegions>
  ),
  parameters: screen({ path: "/workspaces/new" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByLabelText("Region"));
  }
};

/** Settings › Region of a workspace in a private region. */
export const SettingsRegion: Story = {
  render: () => (
    <WithRegions>
      <WorkspaceProvider value={privateWs}>
        <SettingsScreen />
      </WorkspaceProvider>
    </WithRegions>
  ),
  parameters: screen({ path: "/settings/*", url: "/settings/region" })
};

/** Secrets of a private workspace: names only, set or missing in the region. */
export const PrivateSecrets: Story = {
  render: () => (
    <WithRegions>
      <WorkspaceProvider value={privateWs}>
        <SecretsScreen />
      </WorkspaceProvider>
    </WithRegions>
  ),
  parameters: screen({
    path: "/w/:workspaceRef/secrets",
    url: "/w/ws-2/secrets"
  })
};

const callDetail = (region: RegionDetail) => () => (
  <WithRegions regions={[region]}>
    <WorkspaceProvider value={privateWs}>
      <SessionApiProvider value={createMockSessionApi()}>
        <CallsScreen />
      </SessionApiProvider>
    </WorkspaceProvider>
  </WithRegions>
);
const callRoute = screen({
  path: "/w/:workspaceRef/calls/*",
  url: "/w/ws-2/calls/room-1"
});

export const CallDetailPrivate: Story = {
  render: callDetail(privateRegion()),
  parameters: callRoute
};
/** Offline region: only the call's metadata is shown. */
export const CallDetailOffline: Story = {
  render: callDetail(offline),
  parameters: callRoute
};

/** The overview inside the shell, with the region-offline banner on top. */
export const OverviewOffline: Story = {
  render: () => (
    <WithRegions regions={[offline]}>
      <WorkspaceProvider value={privateWs}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="*" element={<OverviewScreen />} />
          </Route>
        </Routes>
      </WorkspaceProvider>
    </WithRegions>
  ),
  parameters: screen({ path: "/w/:workspaceRef/*", url: "/w/ws-2" })
};
