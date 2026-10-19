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
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { sampleCalls } from "~/calls/fixtures";
import AgentsScreen from ".";
import { agentRow } from "./agents-list";
import {
  billingAgent,
  sampleAgents,
  sampleNumbers,
  voiceApp
} from "./fixtures";

const inboundCall = sampleCalls[2];

function setup({
  route = "/w/ws-1/agents",
  apps = [...sampleAgents, voiceApp],
  numbers = sampleNumbers
}: { route?: string; apps?: object[]; numbers?: object[] } = {}) {
  const applications = {
    listApplications: vi.fn().mockResolvedValue({ items: apps }),
    getApplication: vi.fn().mockImplementation(async (ref: string) => {
      const app = sampleAgents.find((a) => a.ref === ref);
      if (!app) throw Object.assign(new Error("not found"), { code: 5 });
      return app;
    }),
    createApplication: vi.fn().mockResolvedValue({ ref: billingAgent.ref }),
    updateApplication: vi.fn().mockResolvedValue({ ref: billingAgent.ref }),
    deleteApplication: vi.fn().mockResolvedValue({ ref: billingAgent.ref })
  };
  const listCalls = vi.fn().mockImplementation(async (request) => ({
    items: request.to === "+18295550199" ? [inboundCall] : [],
    nextPageToken: ""
  }));
  const sdk = {
    applications,
    numbers: { listNumbers: vi.fn().mockResolvedValue({ items: numbers }) },
    calls: { listCalls }
  };
  const auth = fakeAuth({ status: "signedIn", sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <AgentsScreen />
    </WorkspaceProvider>,
    { auth, path: "/w/:workspaceRef/agents/*", route }
  );
  return { ...view, applications, listCalls };
}

describe("Agents list", () => {
  it("maps an agent to its list columns", () => {
    expect(agentRow(billingAgent, sampleNumbers)).toEqual({
      numbers: "+1 829 555 0199 +1",
      model: "openai · gpt-4o-mini",
      voice: "Aura 2 Celeste · es-419"
    });
    expect(agentRow(sampleAgents[3], sampleNumbers).numbers).toBe("No numbers");
  });

  it("lists only Autopilot applications", async () => {
    setup();
    const table = await screen.findByRole("table", { name: "Agents" });
    expect(
      await within(table).findByText("Billing reminders")
    ).toBeInTheDocument();
    expect(within(table).queryByText("IVR (external)")).not.toBeInTheDocument();
    expect(screen.getByText("4 agents")).toBeInTheDocument();
    expect(
      await within(table).findByText("+1 829 555 0199 +1")
    ).toBeInTheDocument();
    expect(
      within(table).getByText("groq · llama-3.3-70b-versatile")
    ).toBeInTheDocument();
  });

  it("deletes an agent from its row menu, behind a confirmation", async () => {
    const { user, applications } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Actions for Billing reminders" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const confirm = await screen.findByRole("dialog", {
      name: "Delete Billing reminders?"
    });
    await user.click(within(confirm).getByRole("button", { name: "Delete" }));
    expect(applications.deleteApplication).toHaveBeenCalledWith(
      billingAgent.ref
    );
  });

  it("filters by name or ref", async () => {
    const { user } = setup();
    await screen.findByText("Billing reminders");
    await user.type(
      screen.getByRole("searchbox", { name: "Search agents" }),
      "ap-91"
    );
    expect(screen.getByText("1 agent")).toBeInTheDocument();
    expect(screen.getByText("Order status")).toBeInTheDocument();
    expect(screen.queryByText("Billing reminders")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no agents", async () => {
    setup({ apps: [voiceApp] });
    expect(
      await screen.findByText("Build your first agent")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create agent" })
    ).toBeInTheDocument();
  });

  it("creates an agent from a template and opens it", async () => {
    const { user, applications } = setup({ apps: [] });
    await user.click(await screen.findByRole("button", { name: "Create agent" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).queryByRole("radio", { name: /Knowledge FAQ/ })
    ).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("radio", { name: /Reminders/ }));
    await user.type(within(dialog).getByLabelText("Name"), "Billing reminders");
    await user.click(
      within(dialog).getByRole("button", { name: "Create agent" })
    );

    expect(applications.createApplication).toHaveBeenCalledTimes(1);
    const request = applications.createApplication.mock.calls[0][0];
    expect(request).toMatchObject({
      name: "Billing reminders",
      type: "AUTOPILOT",
      speech: {
        voice: "deepgram/aura-2-thalia-en",
        language: "en-US"
      },
      intelligence: {
        config: { languageModel: { model: expect.stringMatching(/^openai\//) } }
      }
    });
    expect(
      request.intelligence.config.conversationSettings.systemPrompt
    ).toMatch(/payments and appointments/);
    // Opens the new agent's detail page.
    expect(
      await screen.findByRole("heading", { name: "Billing reminders" })
    ).toBeInTheDocument();
    expect(applications.getApplication).toHaveBeenCalledWith(billingAgent.ref);
  });
});

describe("Agent detail", () => {
  const route = `/w/ws-1/agents/${billingAgent.ref}/configure`;

  it("shows the header, numbers and configure fields", async () => {
    setup({ route });
    expect(
      await screen.findByRole("heading", { name: "Billing reminders" })
    ).toBeInTheDocument();
    expect(await screen.findByText("2 numbers")).toBeInTheDocument();
    expect(screen.getByLabelText("First message")).toHaveValue(
      "Hola, le llamo de Acme sobre su factura pendiente. ¿Tiene un minuto?"
    );
    expect(screen.getByRole("link", { name: "Configure" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /Tools/ })).toHaveAttribute(
      "href",
      `/w/ws-1/agents/${billingAgent.ref}/tools`
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("renames the agent inline: Enter saves, Esc cancels", async () => {
    const { user, applications } = setup({ route });
    await user.click(
      await screen.findByRole("button", { name: "Rename agent" })
    );
    const field = screen.getByLabelText("Agent name");
    await user.clear(field);
    await user.type(field, "Collections{Escape}");
    expect(
      screen.getByRole("heading", { name: billingAgent.name })
    ).toBeInTheDocument();
    expect(applications.updateApplication).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Rename agent" }));
    await user.clear(screen.getByLabelText("Agent name"));
    await user.type(screen.getByLabelText("Agent name"), "Collections{Enter}");
    expect(applications.updateApplication).toHaveBeenCalledTimes(1);
    expect(applications.updateApplication.mock.calls[0][0]).toMatchObject({
      ref: billingAgent.ref,
      name: "Collections"
    });
  });

  it("saves edits from several tabs in one update", async () => {
    const { user, applications } = setup({ route });
    const prompt = await screen.findByLabelText("System prompt");
    await user.clear(prompt);
    await user.type(prompt, "Be brief.");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Advanced" }));
    const temperature = await screen.findByLabelText("Temperature");
    await user.clear(temperature);
    await user.type(temperature, "0.2");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(applications.updateApplication).toHaveBeenCalledTimes(1);
    const request = applications.updateApplication.mock.calls[0][0];
    expect(request).toMatchObject({ ref: billingAgent.ref, type: "AUTOPILOT" });
    expect(request.intelligence.config.conversationSettings.systemPrompt).toBe(
      "Be brief."
    );
    expect(request.intelligence.config.languageModel.temperature).toBe(0.2);
    expect(request.intelligence.config).not.toHaveProperty("eventsHook");
    expect(await screen.findByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("adds a tool in the tools editor", async () => {
    const { user, applications } = setup({
      route: `/w/ws-1/agents/${billingAgent.ref}/tools`
    });
    expect(await screen.findByText("Always on")).toBeInTheDocument();
    expect(screen.getByText("On · +1 809 555 0100")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Your tools" });
    expect(within(list).getAllByRole("button")).toHaveLength(2);

    await user.click(screen.getAllByRole("button", { name: /Add tool/ })[0]);
    await user.type(screen.getByLabelText("Tool name"), "check_balance");
    await user.type(screen.getByLabelText("Description"), "Gets the balance.");
    await user.type(
      screen.getByLabelText("URL"),
      "https://api.acme.com/balance"
    );
    await user.click(screen.getByRole("button", { name: /Add parameter/ }));
    await user.type(screen.getByLabelText("Parameter 1 name"), "customerId");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(applications.updateApplication).toHaveBeenCalledTimes(1);
    const tools =
      applications.updateApplication.mock.calls[0][0].intelligence.config
        .languageModel.tools;
    expect(tools).toHaveLength(3);
    expect(tools[2]).toEqual({
      name: "check_balance",
      description: "Gets the balance.",
      parameters: {
        type: "object",
        properties: { customerId: { type: "string" } },
        required: ["customerId"]
      },
      operation: {
        method: "get",
        url: "https://api.acme.com/balance",
        waitForResponse: true
      }
    });
  });

  it("has no Knowledge or Tests tab in this release", async () => {
    setup({ route: `/w/ws-1/agents/${billingAgent.ref}/configure` });
    const tabs = await screen.findByRole("navigation", {
      name: "Agent sections"
    });
    expect(
      within(tabs).getByRole("link", { name: "Calls" })
    ).toBeInTheDocument();
    expect(
      within(tabs).queryByRole("link", { name: "Knowledge" })
    ).not.toBeInTheDocument();
    expect(
      within(tabs).queryByRole("link", { name: "Tests" })
    ).not.toBeInTheDocument();
  });

  it("lists the calls on the agent's numbers", async () => {
    const { listCalls } = setup({
      route: `/w/ws-1/agents/${billingAgent.ref}/calls`
    });
    expect(await screen.findByText("+1 809 555 0142")).toBeInTheDocument();
    // Both of its numbers, as caller and as callee.
    const filters = listCalls.mock.calls.map(([request]) =>
      request.to ? `to ${request.to}` : `from ${request.from}`
    );
    expect(filters.sort()).toEqual([
      "from +18095550177",
      "from +18295550199",
      "to +18095550177",
      "to +18295550199"
    ]);
  });

  it("deletes the agent from Advanced and returns to the list", async () => {
    const { user, applications } = setup({
      route: `/w/ws-1/agents/${billingAgent.ref}/advanced`
    });
    await user.click(
      await screen.findByRole("button", { name: "Delete agent" })
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(applications.deleteApplication).toHaveBeenCalledWith(
      billingAgent.ref
    );
    expect(
      await screen.findByRole("heading", { name: "Agents" })
    ).toBeInTheDocument();
  });

  it("edits the agent's call handling from Advanced (it used to live in Apps)", async () => {
    const { user, applications } = setup({
      route: `/w/ws-1/agents/${billingAgent.ref}/advanced`
    });
    const panel = await screen.findByRole("region", { name: "Call handling" });
    await user.click(within(panel).getByRole("button", { name: "Edit" }));
    const drawer = await screen.findByRole("dialog", {
      name: "Call handling"
    });
    // Only call handling: name, URL, protocol and speech stay on the agent page.
    await within(drawer).findByLabelText("Fallback message");
    expect(within(drawer).queryByLabelText("Name")).not.toBeInTheDocument();
    expect(within(drawer).queryByLabelText("URL")).not.toBeInTheDocument();
    expect(within(drawer).queryByLabelText("Protocol")).not.toBeInTheDocument();
    await user.click(
      within(drawer).getByRole("button", { name: /Add listener/ })
    );
    await user.type(
      within(drawer).getByLabelText("Listener 1 URL"),
      "wss://monitor.example.com"
    );
    await user.click(
      within(drawer).getByRole("switch", { name: "Detect answering machines" })
    );
    await user.click(within(drawer).getByRole("button", { name: "Save" }));
    await vi.waitFor(() =>
      expect(applications.updateApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          ref: billingAgent.ref,
          type: "AUTOPILOT",
          name: billingAgent.name,
          listeners: [{ url: "wss://monitor.example.com", tracks: "both" }],
          amd: { enabled: true },
          intelligence: expect.objectContaining({ config: expect.anything() })
        })
      )
    );
  });

  it("talk drawer lists the agent's numbers to call", async () => {
    const { user } = setup({ route });
    await user.click(
      await screen.findByRole("button", { name: "Talk to agent" })
    );
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByLabelText("Claro")).toHaveTextContent(
      "+18295550199"
    );
    expect(within(dialog).getByLabelText("Altice")).toHaveTextContent(
      "+18095550177"
    );
    expect(within(dialog).queryByText("+34910555210")).not.toBeInTheDocument();
  });

  it("talk drawer says when no number is linked", async () => {
    const { user } = setup({ route, numbers: [] });
    await user.click(
      await screen.findByRole("button", { name: "Talk to agent" })
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      await within(dialog).findByText(/No phone number is linked/)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Go to Numbers" })
    ).toHaveAttribute("href", "/w/ws-1/numbers");
  });

  it("says when the agent doesn't exist", async () => {
    setup({ route: "/w/ws-1/agents/ap-missing/configure" });
    expect(
      await screen.findByText(/This agent doesn't exist or was deleted/)
    ).toBeInTheDocument();
  });
});
