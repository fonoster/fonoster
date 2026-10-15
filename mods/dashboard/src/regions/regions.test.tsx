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
import { createMockRegionsApi, privateRegion } from "./mock-api";
import NewRegionPage from "./new-region.page";
import RegionDetailPage from "./region-detail.page";
import { RegionSettings } from "./region-settings";
import RegionSetup from "./setup";
import { remaining } from "./status";
import { validateRegionId, validateSipDomain } from "./validation";

const privateWs = { ...testWorkspace, region: "acme-dallas" } as Workspace;
const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 3600_000 + 30_000).toISOString();
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
  const landing = (api = createMockRegionsApi()) => {
    const { auth } = withWorkspaces(api);
    vi.mocked(auth.sdk.workspaces.listWorkspaces).mockResolvedValue({
      items: [testWorkspace]
    } as never);
    return render(<WorkspacesPage />, api, { path: "/workspaces", auth });
  };

  it("lists your regions next to the workspaces, with New region", async () => {
    landing();
    const section = await screen.findByRole("region", { name: "Your regions" });
    expect(await within(section).findByText("Acme Dallas")).toBeInTheDocument();
    expect(within(section).getByText("Connected")).toBeInTheDocument();
    expect(
      within(section).getByRole("link", { name: /New region/ })
    ).toHaveAttribute("href", "/regions/new");
    expect(
      within(section).getByRole("link", { name: /Acme Dallas/ })
    ).toHaveAttribute("href", "/regions/rg_7K2QF");
    expect(await screen.findByText("Acme Support")).toBeInTheDocument();
  });
});

describe("new region", () => {
  const create = () =>
    render(<NewRegionPage />, createMockRegionsApi(), {
      path: "/regions/new",
      route: "/regions/new"
    });

  it("validates the id and the SIP domain before calling the API", async () => {
    const { user, api } = create();
    await user.type(await screen.findByLabelText("ID"), "us-east-9");
    await user.type(screen.getByLabelText("Display name"), "Acme");
    await user.type(screen.getByLabelText("SIP domain"), "acme");
    await user.click(screen.getByRole("button", { name: "Create region" }));
    expect(await screen.findByText("This id is reserved")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a domain like sip.acme.com")
    ).toBeInTheDocument();
    expect(api.state.createdRegions).toEqual([]);
  });

  it("creates the region and opens its setup", async () => {
    const { user, api } = create();
    await user.type(await screen.findByLabelText("ID"), "acme-houston");
    await user.type(screen.getByLabelText("Display name"), "Acme Houston");
    await user.type(screen.getByLabelText("SIP domain"), "sip.acme.com");
    await user.click(screen.getByRole("button", { name: "Create region" }));
    await waitFor(() =>
      expect(api.state.createdRegions).toEqual([
        {
          id: "acme-houston",
          displayName: "Acme Houston",
          sipDomain: "sip.acme.com"
        }
      ])
    );
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/regions/rg_NEW01/setup"
    );
  });
});

describe("create workspace with a region", () => {
  const create = (api = createMockRegionsApi()) =>
    render(<CreateWorkspacePage />, api, {
      path: "/workspaces/new",
      route: "/workspaces/new"
    });

  it("offers Default and your regions, with one permanence line", async () => {
    create();
    const select = await screen.findByLabelText("Region");
    expect(select).toHaveValue("default");
    expect(
      await screen.findByRole("option", { name: "Acme Dallas" })
    ).toBeEnabled();
    expect(
      screen.getByText("You can't change the region later.")
    ).toBeInTheDocument();
  });

  it("disables regions that are waiting or offline", async () => {
    create(
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
    expect(
      await screen.findByRole("option", { name: "Acme Dallas (waiting)" })
    ).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "Acme Miami (offline)" })
    ).toBeDisabled();
  });

  it("creates the workspace in the picked region id, no confirm step", async () => {
    const { user, api } = create();
    await user.type(await screen.findByLabelText("Name"), "Acme Private");
    await screen.findByRole("option", { name: "Acme Dallas" });
    await user.selectOptions(screen.getByLabelText("Region"), "Acme Dallas");
    await user.click(screen.getByRole("button", { name: "Create" }));
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

describe("region setup", () => {
  const enrollment = { token: "tok.en.123", expiresAt: hoursFromNow(5) };
  const setup = (
    region = privateRegion({ status: "waiting", version: undefined })
  ) =>
    render(<RegionSetup />, createMockRegionsApi([region]), {
      path: "/regions/:ref/setup",
      route: "/regions/rg_7K2QF/setup",
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
      await screen.findByText("fonoster-regions secrets set elevenlabs")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("fonoster-regions secrets set deepgram")
    ).toBeNull();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
  });

  it("moves to connected when the status polling sees the region", async () => {
    const { api } = setup();
    await screen.findByText("Waiting");
    api.state.regions = api.state.regions.map((r) =>
      r.kind === "private" ? privateRegion({ status: "connected" }) : r
    );
    expect(
      await screen.findByText("Connected", {}, { timeout: 6000 })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View region" })).toHaveAttribute(
      "href",
      "/regions/rg_7K2QF"
    );
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

describe("region detail", () => {
  const detail = (region = privateRegion()) =>
    render(<RegionDetailPage />, createMockRegionsApi([region]), {
      path: "/regions/:ref",
      route: "/regions/rg_7K2QF"
    });

  it("shows status, version, nodes, calls, SIP domain, workspaces and keys", async () => {
    detail();
    expect((await screen.findByText("Version")).nextSibling).toHaveTextContent(
      "0.28.1"
    );
    expect(screen.getByText("Nodes").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("Active calls").nextSibling).toHaveTextContent("3");
    expect(screen.getByText("SIP domain").nextSibling).toHaveTextContent(
      "sip.acme.com"
    );
    expect(screen.getByRole("link", { name: "Acme Support" })).toHaveAttribute(
      "href",
      "/w/ws-1"
    );
    expect(screen.getByText("Set")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.queryByText("Monthly fee")).toBeNull();
  });

  it("shows the monthly fee only when the cloud reports one", async () => {
    detail(privateRegion({ monthlyFeeCents: 4900 }));
    expect(
      (await screen.findByText("Monthly fee")).nextSibling
    ).toHaveTextContent("$49 / month");
  });

  it("says offline and unsupported in one line", async () => {
    const { unmount } = detail(
      privateRegion({ status: "offline", lastSeenAt: ago(10) })
    );
    expect(
      await screen.findByText("Your region is offline.")
    ).toBeInTheDocument();
    expect(screen.getByText("Last seen").nextSibling).toHaveTextContent(
      "10 min ago"
    );
    unmount();
    detail(privateRegion({ status: "unsupported" }));
    expect(
      await screen.findByText("Your region needs an upgrade.")
    ).toBeInTheDocument();
  });

  it("re-issues a token", async () => {
    const { user, api } = detail();
    await user.click(
      await screen.findByRole("button", { name: "Re-issue token" })
    );
    expect(await screen.findByLabelText("Docker Compose")).toHaveTextContent(
      "reissued"
    );
    expect(api.state.calls).toEqual(["reissue:rg_7K2QF"]);
  });

  it("disconnects behind a confirmation", async () => {
    const { user, api } = detail();
    await user.click(await screen.findByRole("button", { name: "Disconnect" }));
    expect(screen.getByText(/stops taking calls/)).toBeInTheDocument();
    await user.click(
      screen.getAllByRole("button", { name: "Disconnect" }).at(-1)!
    );
    await waitFor(() =>
      expect(api.state.regions.at(-1)!.status).toBe("waiting")
    );
    expect(await screen.findByText("Waiting")).toBeInTheDocument();
  });

  it("shows connection details with copy buttons", async () => {
    detail(
      privateRegion({
        endpoints: {
          sip: [{ host: "sip.acme.example", port: 5061, transport: "tls" }],
          signalingAddresses: ["203.0.113.10"],
          mediaAddresses: ["203.0.113.10", "203.0.113.11"],
          rtpPorts: { min: 20000, max: 20999 }
        }
      })
    );
    const details = await screen.findByRole("region", {
      name: "Connection details"
    });
    expect(screen.getByLabelText("SIP (TLS)")).toHaveTextContent(
      "sip.acme.example:5061"
    );
    expect(screen.getByLabelText("Addresses to allowlist")).toHaveTextContent(
      "203.0.113.10, 203.0.113.11"
    );
    expect(details.querySelectorAll("button[aria-label^='Copy']")).toHaveLength(
      3
    );
  });

  it("says when the region has not reported its details yet", async () => {
    detail();
    expect(
      await screen.findByText("Shown once your region connects.")
    ).toBeInTheDocument();
  });
});

describe("Settings → Region", () => {
  it("is read-only and links to a private region", async () => {
    render(<RegionSettings />);
    expect((await screen.findByText("ID")).nextSibling).toHaveTextContent(
      "acme-dallas"
    );
    expect(screen.getByText("Type").nextSibling).toHaveTextContent("Private");
    expect(screen.getByRole("link", { name: "Manage region" })).toHaveAttribute(
      "href",
      "/regions/rg_7K2QF"
    );
    expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Re-issue token" })).toBeNull();
  });

  it("shows the default region without controls", async () => {
    render(<RegionSettings />, createMockRegionsApi(), {}, testWorkspace);
    expect(await screen.findByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Type").nextSibling).toHaveTextContent("Public");
    expect(screen.queryByRole("link", { name: "Manage region" })).toBeNull();
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
      "/regions/rg_7K2QF"
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
