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
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Capabilities } from "~/lib/client";
import {
  cloudCapabilities,
  communityCapabilities,
  regionsCapabilities
} from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import SecretsScreen from "~/secrets";
import SettingsScreen from "~/settings";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import CreateWorkspacePage from "~/workspaces/create-workspace.page";
import WorkspacesPage from "~/workspaces/landing.page";
import { RegionsApiProvider } from "./api";
import { RegionBanner } from "./banner";
import { createMockRegionsApi, privateRegion } from "./mock-api";

/**
 * Private regions are an optional integration (capabilities.regions.private). Without them
 * every region surface is hidden and the regions API is never called; with them nothing changes.
 */
beforeAll(() => {
  // Radix Select needs these in jsdom.
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const me = { sub: "u1", email: "ada@acme.com", accessKeyId: "US1", exp: 0 };

function spiedApi() {
  const api = createMockRegionsApi();
  const listRegions = vi.spyOn(api, "listRegions");
  const getRegion = vi.spyOn(api, "getRegion");
  return { api, listRegions, getRegion };
}

function render(
  element: ReactElement,
  capabilities: Capabilities,
  opts: { path?: string; route?: string; workspaces?: Workspace[] } = {},
  ws: Workspace = testWorkspace
) {
  const spied = spiedApi();
  const auth = fakeAuth({ status: "signedIn", user: me as never });
  vi.mocked(auth.sdk.workspaces.listWorkspaces).mockResolvedValue({
    items: opts.workspaces ?? [testWorkspace]
  } as never);
  const view = renderScreen(
    <RegionsApiProvider value={spied.api}>
      <WorkspaceProvider value={ws}>{element}</WorkspaceProvider>
    </RegionsApiProvider>,
    { auth, capabilities, path: opts.path, route: opts.route }
  );
  return { ...view, ...spied };
}

describe("without private regions (Community)", () => {
  const caps = communityCapabilities;

  it("start screen: no regions section or New region, and no regions call", async () => {
    const { listRegions } = render(<WorkspacesPage />, caps, {
      path: "/workspaces",
      route: "/workspaces"
    });
    expect(await screen.findByText(testWorkspace.name)).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your regions" })).toBeNull();
    expect(screen.queryByRole("button", { name: /New region/ })).toBeNull();
    expect(listRegions).not.toHaveBeenCalled();
  });

  it("start screen: no workspaces goes straight to the first workspace", async () => {
    const { listRegions } = render(<WorkspacesPage />, caps, {
      path: "/workspaces",
      route: "/workspaces",
      workspaces: []
    });
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/workspaces/new"
    );
    expect(listRegions).not.toHaveBeenCalled();
  });

  it("a direct region link opens nothing and drops the parameter", async () => {
    const { getRegion } = render(<WorkspacesPage />, caps, {
      path: "/workspaces",
      route: "/workspaces?region=rg_7K2QF"
    });
    expect(await screen.findByText(testWorkspace.name)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getRegion).not.toHaveBeenCalled();
  });

  it("create workspace: no Region select; it goes to the public default", async () => {
    const { user, api, listRegions } = render(<CreateWorkspacePage />, caps, {
      path: "/workspaces/new",
      route: "/workspaces/new"
    });
    await user.type(await screen.findByLabelText("Name"), "Acme Support");
    expect(screen.queryByLabelText("Region")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(api.state.created).toEqual([
        { name: "Acme Support", region: "default" }
      ])
    );
    expect(listRegions).not.toHaveBeenCalled();
  });

  it("settings: no Region tab, and its URL goes back to General", async () => {
    render(<SettingsScreen />, caps, {
      path: "/settings/*",
      route: "/settings/region"
    });
    const nav = await screen.findByRole("navigation", { name: "Settings" });
    expect(nav).toHaveTextContent("General");
    expect(nav).not.toHaveTextContent("Region");
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "General" })).toHaveAttribute(
        "aria-current",
        "page"
      )
    );
  });

  it("secrets, banner: the workspace's own secrets, no region link", async () => {
    const privateWs = { ...testWorkspace, region: "acme-dallas" } as Workspace;
    const { getRegion } = render(
      <>
        <RegionBanner />
        <SecretsScreen />
      </>,
      caps,
      {},
      privateWs
    );
    expect(
      await screen.findByText(/Values can't be read back after saving/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Acme Dallas" })).toBeNull();
    expect(getRegion).not.toHaveBeenCalled();
  });
});

describe("with private regions", () => {
  for (const [name, caps] of [
    ["Fonoster Cloud", cloudCapabilities],
    ["self-hosted with the hub", regionsCapabilities]
  ] as const)
    it(`${name}: shows the regions section, the Region select and tab`, async () => {
      const landing = render(<WorkspacesPage />, caps, {
        path: "/workspaces",
        route: "/workspaces"
      });
      expect(
        await screen.findByRole("region", { name: "Your regions" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /New region/ })
      ).toBeInTheDocument();
      landing.unmount();

      const create = render(<CreateWorkspacePage />, caps, {
        path: "/workspaces/new",
        route: "/workspaces/new"
      });
      const select = await screen.findByLabelText("Region");
      expect(select).toHaveTextContent("Default");
      await create.user.click(select);
      expect(
        await screen.findByRole("option", { name: privateRegion().displayName })
      ).toBeInTheDocument();
      create.unmount();

      render(<SettingsScreen />, caps, {
        path: "/settings/*",
        route: "/settings"
      });
      expect(
        await screen.findByRole("navigation", { name: "Settings" })
      ).toHaveTextContent("Region");
    });
});
