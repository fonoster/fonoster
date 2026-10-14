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
import AgentsScreen from ".";
import { agentRow } from "./agents-list";
import {
  billingAgent,
  sampleAgents,
  sampleNumbers,
  voiceApp
} from "./fixtures";

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
    deleteApplication: vi.fn().mockResolvedValue({ ref: billingAgent.ref }),
    createTestToken: vi.fn()
  };
  const sdk = {
    applications,
    numbers: { listNumbers: vi.fn().mockResolvedValue({ items: numbers }) }
  };
  const auth = fakeAuth({ status: "signedIn", sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <AgentsScreen />
    </WorkspaceProvider>,
    { auth, path: "/w/:workspaceRef/agents/*", route }
  );
  return { ...view, applications };
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
      screen.getByRole("button", { name: "New agent" })
    ).toBeInTheDocument();
  });

  it("creates an agent from a template and opens it", async () => {
    const { user, applications } = setup({ apps: [] });
    await user.click(await screen.findByRole("button", { name: "New agent" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("radio", { name: /Knowledge FAQ/ })
    ).toBeDisabled();
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
      textToSpeech: {
        productRef: "tts.deepgram",
        config: { voice: "aura-2-thalia-en" }
      },
      speechToText: {
        productRef: "stt.deepgram",
        config: { languageCode: "en-US" }
      },
      intelligence: { productRef: "llm.openai", credentials: {} }
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

  it("saves edits from several tabs in one update", async () => {
    const { user, applications } = setup({ route });
    const prompt = await screen.findByLabelText("System prompt");
    await user.clear(prompt);
    await user.type(prompt, "Be brief.");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Advanced" }));
    const url = await screen.findByLabelText("URL");
    await user.clear(url);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(applications.updateApplication).toHaveBeenCalledTimes(1);
    const request = applications.updateApplication.mock.calls[0][0];
    expect(request).toMatchObject({ ref: billingAgent.ref, type: "AUTOPILOT" });
    expect(request.intelligence.config.conversationSettings.systemPrompt).toBe(
      "Be brief."
    );
    expect(request.intelligence.config).not.toHaveProperty("eventsHook");
    expect(await screen.findByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("blocks saving a webhook without events and points at the tab", async () => {
    const { user, applications } = setup({
      route: `/w/ws-1/agents/${billingAgent.ref}/advanced`
    });
    await user.click(
      await screen.findByRole("checkbox", { name: "conversation.started" })
    );
    await user.click(
      screen.getByRole("checkbox", { name: "conversation.ended" })
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText("Pick at least one event")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Fix the highlighted fields in Advanced/)
    ).toBeInTheDocument();
    expect(applications.updateApplication).not.toHaveBeenCalled();
  });

  it("adds a tool in the tools editor", async () => {
    const { user, applications } = setup({
      route: `/w/ws-1/agents/${billingAgent.ref}/tools`
    });
    expect(await screen.findByText("Always on")).toBeInTheDocument();
    expect(screen.getByText("On · +18095550100")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Your tools" });
    expect(within(list).getAllByRole("button")).toHaveLength(2);

    await user.click(screen.getAllByRole("button", { name: "Add tool" })[0]);
    await user.type(screen.getByLabelText("Name"), "check_balance");
    await user.type(screen.getByLabelText("Description"), "Gets the balance.");
    await user.type(
      screen.getByLabelText("URL"),
      "https://api.acme.com/balance"
    );
    await user.click(screen.getByRole("button", { name: "Add parameter" }));
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

  it.each([
    ["knowledge", "Knowledge", /Document upload isn't available/],
    ["tests", "Tests", /can't store or run test scenarios/],
    ["calls", "Calls", /Call records don't say which agent/]
  ])("shows %s as coming soon", async (path, title, missing) => {
    setup({ route: `/w/ws-1/agents/${billingAgent.ref}/${path}` });
    const panel = await screen.findByRole("region", { name: title });
    expect(within(panel).getByText("· coming soon")).toBeInTheDocument();
    expect(within(panel).getByText(missing)).toBeInTheDocument();
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

  it("says when the agent doesn't exist", async () => {
    setup({ route: "/w/ws-1/agents/ap-missing/configure" });
    expect(
      await screen.findByText(/This agent doesn't exist or was deleted/)
    ).toBeInTheDocument();
  });
});
