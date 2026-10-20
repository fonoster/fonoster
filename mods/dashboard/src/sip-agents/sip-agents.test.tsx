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
import { screen, within } from "@testing-library/react";
import type { Capabilities } from "~/lib/client";
import { communityCapabilities, regionsCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import SipAgentsScreen from ".";
import { publicRegionWithEndpoints } from "~/numbers/fixtures";
import { toSipAgentRow } from "./sip-agents.service";

// jsdom lacks these; Radix Select uses them.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const maria = {
  ref: "ag-1",
  name: "María Rodríguez",
  username: "maria",
  privacy: "PRIVATE",
  enabled: true,
  maxContacts: 3,
  expires: 3600,
  domain: { ref: "dm-1", name: "Acme HQ", domainUri: "acme.fonoster.local" },
  credentials: { ref: "cr-1", name: "Maria's phone", username: "maria" }
};

function setup(
  items: object[] = [],
  capabilities: Capabilities = regionsCapabilities
) {
  const agents = {
    listAgents: vi.fn().mockResolvedValue({ items }),
    createAgent: vi.fn().mockResolvedValue({ ref: "ag-new" }),
    updateAgent: vi.fn().mockResolvedValue({ ref: "ag-1" }),
    deleteAgent: vi.fn().mockResolvedValue({ ref: "ag-1" })
  };
  const domains = {
    listDomains: vi.fn().mockResolvedValue({
      items: [
        { ref: "dm-1", name: "Acme HQ", domainUri: "acme.fonoster.local" },
        { ref: "dm-2", name: "Madrid", domainUri: "madrid.fonoster.local" }
      ]
    })
  };
  const credentials = {
    listCredentials: vi.fn().mockResolvedValue({
      items: [{ ref: "cr-1", name: "Maria's phone", username: "maria" }]
    })
  };
  const regions = {
    getRegion: vi.fn().mockResolvedValue(publicRegionWithEndpoints)
  };
  const auth = fakeAuth({
    status: "signedIn",
    sdk: { agents, domains, credentials, regions } as never
  });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <SipAgentsScreen />
    </WorkspaceProvider>,
    { auth, capabilities }
  );
  return { ...view, agents, regions };
}

describe("SIP agents", () => {
  it("shows the server, port and transport for a softphone", async () => {
    const { user } = setup([]);
    await user.click(
      await screen.findByRole("button", { name: "Create SIP agent" })
    );
    const phone = await screen.findByRole("region", {
      name: "Softphone settings"
    });
    expect(within(phone).getByLabelText("Server")).toHaveTextContent(
      "sip.us-east-1.fonoster.com"
    );
    expect(within(phone).getByLabelText("Port")).toHaveTextContent("5060");
    expect(within(phone).getByLabelText("Transport")).toHaveTextContent("UDP");
    expect(
      within(phone).getByRole("button", { name: "Copy Server" })
    ).toBeInTheDocument();
  });

  it("takes the softphone settings from the deployment's capabilities without private regions", async () => {
    const { user, regions } = setup([], communityCapabilities);
    await user.click(
      await screen.findByRole("button", { name: "Create SIP agent" })
    );
    const phone = await screen.findByRole("region", {
      name: "Softphone settings"
    });
    expect(within(phone).getByLabelText("Server")).toHaveTextContent(
      "192.0.2.10"
    );
    expect(within(phone).getByLabelText("Port")).toHaveTextContent("5060");
    expect(within(phone).getByLabelText("Transport")).toHaveTextContent("UDP");
    expect(regions.getRegion).not.toHaveBeenCalled();
  });

  it("shows no softphone settings when the deployment lists no SIP address", async () => {
    const { user } = setup([], {
      ...communityCapabilities,
      connection: { sip: [], signalingAddresses: [], mediaAddresses: [] }
    });
    await user.click(
      await screen.findByRole("button", { name: "Create SIP agent" })
    );
    await screen.findByRole("dialog");
    expect(
      screen.queryByRole("region", { name: "Softphone settings" })
    ).toBeNull();
  });

  it("lists SIP agents with their SIP address", async () => {
    setup([maria]);
    const table = await screen.findByRole("table", { name: "SIP agents" });
    expect(
      await within(table).findByText("María Rodríguez")
    ).toBeInTheDocument();
    expect(
      within(table).getByText("sip:maria@acme.fonoster.local")
    ).toBeInTheDocument();
    expect(within(table).getByText("Private")).toBeInTheDocument();
    expect(within(table).getByText("3")).toBeInTheDocument();
    expect(
      within(table).getByRole("switch", { name: "Enable María Rodríguez" })
    ).toBeChecked();
    expect(screen.getByText(/Numbers can route straight/)).toBeInTheDocument();
  });

  it("reads nested protobuf messages and the ID privacy alias", () => {
    const row = toSipAgentRow({
      ...maria,
      privacy: "ID",
      domain: {
        toObject: () => ({ ref: "d", name: "D", domainUri: "d.local" })
      }
    } as never);
    expect(row.privacy).toBe("PRIVATE");
    expect(row.domain?.domainUri).toBe("d.local");
  });

  it("shows the empty state with an add action", async () => {
    setup([]);
    expect(await screen.findByText("No SIP agents yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create SIP agent" })
    ).toBeInTheDocument();
  });

  it("validates and creates a SIP agent", async () => {
    const { user, agents } = setup([]);
    await user.click(
      await screen.findByRole("button", { name: "Create SIP agent" })
    );
    await user.type(screen.getByLabelText("Name"), "Front desk");
    await user.type(screen.getByLabelText("Username"), "Front Desk");
    await user.clear(screen.getByLabelText("Max contacts"));
    await user.type(screen.getByLabelText("Max contacts"), "500");
    await user.click(screen.getByRole("button", { name: "Create SIP agent" }));
    expect(
      await screen.findByText(
        "Lowercase letters, numbers, dots, underscores and hyphens only"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Pick a domain")).toBeInTheDocument();
    expect(screen.getByText("Between 1 and 100")).toBeInTheDocument();
    expect(agents.createAgent).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Username"));
    await user.type(screen.getByLabelText("Username"), "desk");
    await user.clear(screen.getByLabelText("Max contacts"));
    await user.type(screen.getByLabelText("Max contacts"), "2");
    await user.click(screen.getByLabelText("Domain"));
    await user.click(
      await screen.findByRole("option", { name: /madrid\.fonoster\.local/ })
    );
    await user.click(screen.getByLabelText("Credentials"));
    await user.click(
      await screen.findByRole("option", { name: /Maria's phone/ })
    );
    await user.click(screen.getByLabelText("Privacy"));
    await user.click(await screen.findByRole("option", { name: /Private/ }));
    await user.click(screen.getByRole("button", { name: "Create SIP agent" }));

    expect(agents.createAgent).toHaveBeenCalledWith({
      name: "Front desk",
      username: "desk",
      domainRef: "dm-2",
      credentialsRef: "cr-1",
      privacy: "PRIVATE",
      maxContacts: 2,
      enabled: true,
      expires: 3600
    });
  });

  it("edits a SIP agent without changing the username", async () => {
    const { user, agents } = setup([maria]);
    await user.click(await screen.findByText("María Rodríguez"));
    expect(screen.getByLabelText("Username")).toBeDisabled();
    await user.click(screen.getByLabelText("Enabled"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(agents.updateAgent).toHaveBeenCalledWith({
      ref: "ag-1",
      name: "María Rodríguez",
      domainRef: "dm-1",
      credentialsRef: "cr-1",
      privacy: "PRIVATE",
      maxContacts: 3,
      enabled: false
    });
  });

  it("toggles a SIP agent from the list", async () => {
    const { user, agents } = setup([maria]);
    await user.click(
      await screen.findByRole("switch", { name: "Enable María Rodríguez" })
    );
    expect(agents.updateAgent).toHaveBeenCalledWith({
      ref: "ag-1",
      enabled: false
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks before deleting", async () => {
    const { user, agents } = setup([maria]);
    await user.click(
      await screen.findByRole("button", { name: "Actions for María Rodríguez" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await user.type(screen.getByLabelText(/to confirm/), "DELETE");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(agents.deleteAgent).toHaveBeenCalledWith("ag-1");
  });
});
