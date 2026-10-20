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
import { screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import type { Capabilities } from "~/lib/client";
import { cloudCapabilities, regionsCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import CreateWorkspacePage from "~/workspaces/create-workspace.page";
import WorkspacesPage from "~/workspaces/landing.page";
import { CallsScreen } from "~/session";
import { SessionApiProvider } from "~/session/api";
import { createMockSessionApi } from "~/session/mock-api";
import SecretsScreen from "~/secrets";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { RegionsApiProvider } from "./api";
import { RegionBanner } from "./banner";
import { formatFee } from "./region-drawer";
import { createMockRegionsApi, privateRegion } from "./mock-api";
import { RegionSettings } from "./region-settings";
import { remaining } from "./status";
import { validateRegionId, validateSipDomain } from "./validation";

const privateWs = { ...testWorkspace, region: "acme-dallas" } as Workspace;
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const me = { sub: "u1", email: "ada@acme.com", accessKeyId: "US1", exp: 0 };

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
      {
        auth: fakeAuth({ status: "signedIn", user: me as never }),
        capabilities: regionsCapabilities,
        ...opts
      }
    )
  };
}

const withWorkspaces = (api: ReturnType<typeof createMockRegionsApi>) => {
  const auth = fakeAuth({ status: "signedIn", user: me as never });
  return { api, auth };
};

describe("region id and SIP domain rules", () => {
  it("accepts a company-place id", () => {
    expect(validateRegionId("acme-dallas")).toBeUndefined();
  });
  it.each(["ab", "1acme", "Acme", "acme_x", "a".repeat(33)])(
    "rejects the malformed id %s",
    (id) => expect(validateRegionId(id)).toBeDefined()
  );
  it.each([
    "default",
    "us-east-1",
    "eu-west-2",
    "sa-x",
    "ap-x1",
    "af-x1",
    "me-x1"
  ])("rejects the reserved id %s", (id) =>
    expect(validateRegionId(id)).toBe("This id is reserved")
  );
  it("requires a fully qualified domain", () => {
    expect(validateSipDomain("sip.acme.com")).toBeUndefined();
    expect(validateSipDomain("acme")).toBeDefined();
    expect(validateSipDomain("10.0.0.1")).toBeDefined();
    expect(validateSipDomain("")).toBeDefined();
  });
});

describe("start screen", () => {
  const landing = (api = createMockRegionsApi(), route = "/workspaces") => {
    const { auth } = withWorkspaces(api);
    vi.mocked(auth.sdk.workspaces.listWorkspaces).mockResolvedValue({
      items: [testWorkspace]
    } as never);
    return render(<WorkspacesPage />, api, {
      path: "/workspaces",
      route,
      auth
    });
  };
  const section = () => screen.findByRole("region", { name: "Your regions" });

  it("shows each region as a name and a status dot, without details", async () => {
    landing();
    const s = await section();
    expect(await within(s).findByText("Acme Dallas")).toBeInTheDocument();
    expect(within(s).getByText("Connected")).toBeInTheDocument();
    expect(within(s).queryByLabelText("Docker Compose")).toBeNull();
    expect(within(s).queryByText("acme-dallas")).toBeNull();
    expect(
      within(s).getByRole("button", { name: "More for Acme Dallas" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Acme Support")).toBeInTheDocument();
  });

  it("shows the install command of a waiting region until it connects", async () => {
    const api = createMockRegionsApi([
      privateRegion({ status: "waiting", version: undefined })
    ]);
    const { user } = landing(api);
    const s = await section();
    expect(await within(s).findByText("Waiting")).toBeInTheDocument();
    await user.click(
      await within(s).findByRole("button", { name: "Re-issue token" })
    );
    expect(await within(s).findByLabelText("Docker Compose")).toHaveTextContent(
      "reissued"
    );
    expect(within(s).queryByLabelText("Helm")).toBeNull();
    await user.click(within(s).getByRole("tab", { name: "Helm" }));
    expect(within(s).getByLabelText("Helm")).toHaveTextContent("helm install");
    expect(within(s).getByText(/Expires in (23|24)h/)).toBeInTheDocument();
    api.state.regions = api.state.regions.map((r) =>
      r.kind === "private" ? privateRegion({ status: "connected" }) : r
    );
    expect(
      await within(s).findByText("Connected", {}, { timeout: 7000 })
    ).toBeInTheDocument();
    expect(within(s).queryByLabelText("Helm")).toBeNull();
  }, 12000);

  it("creates a region in a drawer and shows its command", async () => {
    const { user, api } = landing();
    const s = await section();
    await user.click(within(s).getByRole("button", { name: /Create region/ }));
    const drawer = await screen.findByRole("dialog", { name: "New region" });
    await user.type(within(drawer).getByLabelText("ID"), "us-east-9");
    await user.type(within(drawer).getByLabelText("Display name"), "Acme");
    await user.type(within(drawer).getByLabelText("SIP domain"), "acme");
    await user.click(
      within(drawer).getByRole("button", { name: "Create region" })
    );
    expect(await screen.findByText("This id is reserved")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a domain like sip.acme.com")
    ).toBeInTheDocument();
    expect(api.state.createdRegions).toEqual([]);
    await user.clear(within(drawer).getByLabelText("ID"));
    await user.type(within(drawer).getByLabelText("ID"), "acme-houston");
    await user.clear(within(drawer).getByLabelText("Display name"));
    await user.type(
      within(drawer).getByLabelText("Display name"),
      "Acme Houston"
    );
    await user.clear(within(drawer).getByLabelText("SIP domain"));
    await user.type(
      within(drawer).getByLabelText("SIP domain"),
      "sip.acme.com"
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Create region" })
    );
    await waitFor(() =>
      expect(api.state.createdRegions).toEqual([
        {
          id: "acme-houston",
          displayName: "Acme Houston",
          sipDomain: "sip.acme.com"
        }
      ])
    );
    expect(await within(s).findByText("Acme Houston")).toBeInTheDocument();
    expect(await within(s).findByLabelText("Docker Compose")).toHaveTextContent(
      "mock.token"
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the drawer from More and from a link", async () => {
    const { user } = landing();
    await user.click(
      await screen.findByRole("button", { name: "More for Acme Dallas" })
    );
    const drawer = await screen.findByRole("dialog");
    expect(await within(drawer).findByText("Version")).toBeInTheDocument();
  });

  it("opens the drawer for ?region=", async () => {
    landing(createMockRegionsApi(), "/workspaces?region=rg_7K2QF");
    const drawer = await screen.findByRole("dialog");
    expect(await within(drawer).findByText("Version")).toBeInTheDocument();
  });
});

describe("region drawer", () => {
  const drawer = async (
    region = privateRegion(),
    capabilities?: Capabilities
  ) => {
    const api = createMockRegionsApi([region]);
    const { auth } = withWorkspaces(api);
    vi.mocked(auth.sdk.workspaces.listWorkspaces).mockResolvedValue({
      items: [testWorkspace]
    } as never);
    const view = render(<WorkspacesPage />, api, {
      path: "/workspaces",
      route: "/workspaces?region=rg_7K2QF",
      auth,
      ...(capabilities ? { capabilities } : {})
    });
    const d = await screen.findByRole("dialog");
    await within(d).findByText("Version");
    return { ...view, d };
  };

  it("shows status, version, last seen, workspaces and keys", async () => {
    const { d } = await drawer();
    expect(within(d).getByText("Connected")).toBeInTheDocument();
    expect(within(d).getByText("Version").nextSibling).toHaveTextContent(
      "0.28.1"
    );
    expect(within(d).getByText("Last seen").nextSibling).toHaveTextContent(
      "just now"
    );
    expect(
      within(d).getByRole("link", { name: "Acme Support" })
    ).toHaveAttribute("href", "/w/ws-1");
    expect(within(d).getByText("Set")).toBeInTheDocument();
    expect(within(d).getByText("Missing")).toBeInTheDocument();
    expect(
      within(d).getByText("fonoster-region secrets set elevenlabs")
    ).toBeInTheDocument();
  });

  it("shows the flat monthly fee on Fonoster Cloud only (PR-11)", async () => {
    const cloud = await drawer(
      privateRegion({ monthlyFeeCents: 4900, minutesThisMonth: 1000 }),
      cloudCapabilities
    );
    expect(
      within(cloud.d).getByText("Monthly fee").nextSibling
    ).toHaveTextContent("$49 / month · 1,000 min this month");
    cloud.unmount();
    const selfHosted = await drawer(privateRegion({ monthlyFeeCents: 4900 }));
    expect(within(selfHosted.d).queryByText("Monthly fee")).toBeNull();
    expect(formatFee(4950)).toBe("$49.50");
  });

  it("says offline and unsupported in one line", async () => {
    const { d, unmount } = await drawer(
      privateRegion({ status: "offline", lastSeenAt: ago(10) })
    );
    expect(within(d).getByText("Your region is offline.")).toBeInTheDocument();
    expect(within(d).getByText("Last seen").nextSibling).toHaveTextContent(
      "10 min ago"
    );
    unmount();
    const next = await drawer(privateRegion({ status: "unsupported" }));
    expect(
      within(next.d).getByText("Your region needs an upgrade.")
    ).toBeInTheDocument();
  });

  it("shows connection details with copy buttons, or says they are pending", async () => {
    const { d, unmount } = await drawer(
      privateRegion({
        endpoints: {
          sip: [{ host: "sip.acme.example", port: 5061, transport: "tls" }],
          signalingAddresses: ["203.0.113.10"],
          mediaAddresses: ["203.0.113.10", "203.0.113.11"],
          rtpPorts: { min: 20000, max: 20999 }
        }
      })
    );
    const details = within(d).getByRole("region", {
      name: "Connection details"
    });
    expect(within(d).getByLabelText("SIP (TLS)")).toHaveTextContent(
      "sip.acme.example:5061"
    );
    expect(details.querySelectorAll("button[aria-label^='Copy']")).toHaveLength(
      3
    );
    unmount();
    const next = await drawer();
    expect(
      within(next.d).getByText("Shown once your region connects.")
    ).toBeInTheDocument();
  });

  it("re-issues a token and shows it on the start screen", async () => {
    const { user, api, d } = await drawer(
      privateRegion({ status: "waiting", version: undefined })
    );
    await user.click(within(d).getByRole("button", { name: "Re-issue token" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(await screen.findByLabelText("Docker Compose")).toHaveTextContent(
      "reissued"
    );
    expect(api.state.calls).toEqual(["reissue:rg_7K2QF"]);
  });

  it("disconnects after an inline confirmation", async () => {
    const { user, api, d } = await drawer();
    await user.click(within(d).getByRole("button", { name: "Disconnect" }));
    expect(within(d).getByText(/Stops taking calls/)).toBeInTheDocument();
    expect(api.state.regions.at(-1)!.status).toBe("connected");
    await user.click(
      within(d).getByRole("button", { name: "Confirm disconnect" })
    );
    await waitFor(() =>
      expect(api.state.regions.at(-1)!.status).toBe("waiting")
    );
    expect(await within(d).findByText("Waiting")).toBeInTheDocument();
  });
});

describe("create workspace with a region", () => {
  const create = (api = createMockRegionsApi()) =>
    render(<CreateWorkspacePage />, api, {
      path: "/workspaces/new",
      route: "/workspaces/new"
    });

  it("offers Default and your regions, with one permanence line", async () => {
    const { user } = create();
    const select = await screen.findByLabelText("Region");
    expect(select).toHaveTextContent("Default");
    await user.click(select);
    expect(
      await screen.findByRole("option", { name: "Acme Dallas" })
    ).toBeEnabled();
    expect(
      screen.getByText("You can't change the region later.")
    ).toBeInTheDocument();
  });

  it("disables regions that are waiting or offline", async () => {
    const { user } = create(
      createMockRegionsApi([
        privateRegion({ status: "waiting" }),
        privateRegion({
          ref: "rg_2",
          id: "acme-miami",
          displayName: "Acme Miami",
          status: "offline"
        })
      ])
    );
    await user.click(await screen.findByLabelText("Region"));
    expect(
      await screen.findByRole("option", { name: "Acme Dallas (waiting)" })
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("option", { name: "Acme Miami (offline)" })
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("creates the workspace in the picked region id, no confirm step", async () => {
    const { user, api } = create();
    await user.type(
      await screen.findByLabelText("Workspace name"),
      "Acme Private"
    );
    await user.click(screen.getByLabelText("Region"));
    await user.click(
      await screen.findByRole("option", { name: "Acme Dallas" })
    );
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
    await waitFor(() =>
      expect(api.state.created).toEqual([
        { name: "Acme Private", region: "acme-dallas" }
      ])
    );
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/w/ws-new"
    );
  });
});

describe("token countdown", () => {
  it("formats the countdown", () => {
    expect(
      remaining(new Date(Date.now() + 90 * 60_000 + 5000).toISOString())
    ).toBe("1h 30m");
    expect(remaining(new Date(Date.now() - 1).toISOString())).toBeUndefined();
  });
});

describe("Settings → Region", () => {
  it("is one read-only line linking to a private region", async () => {
    render(<RegionSettings />);
    expect(await screen.findByText("Acme Dallas")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View region/ })).toHaveAttribute(
      "href",
      "/workspaces?region=rg_7K2QF"
    );
    expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull();
  });

  it("shows the default region without a link", async () => {
    render(<RegionSettings />, createMockRegionsApi(), {}, testWorkspace);
    expect(await screen.findByText("Default")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View region/ })).toBeNull();
  });
});

describe("Secrets for a private workspace", () => {
  it("lists names with set or missing, linking to the region", async () => {
    render(<SecretsScreen />);
    expect(await screen.findByText("deepgram")).toBeInTheDocument();
    expect(screen.getByText("Set")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByText(/1 missing/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acme Dallas" })).toHaveAttribute(
      "href",
      "/workspaces?region=rg_7K2QF"
    );
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
      createMockRegionsApi([region]),
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
    call(privateRegion({ status: "offline", lastSeenAt: ago(5) }));
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
      createMockRegionsApi([
        privateRegion({ status: "offline", lastSeenAt: ago(3) })
      ])
    );
    expect(
      await screen.findByText(/Your region is offline. Last seen 3 min ago/)
    ).toBeInTheDocument();
    unmount();
    render(<RegionBanner />);
    await waitFor(() => expect(screen.queryByText(/offline/)).toBeNull());
  });
});
