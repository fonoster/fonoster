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
import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within } from "@storybook/test";
import type { AuthContextValue } from "~/lib/auth";
import { WorkspaceProvider } from "~/lib/workspace";
import { testWorkspace } from "~/test/workspace";
import AgentsScreen from ".";
import { sampleCalls } from "~/calls/fixtures";
import {
  billingAgent,
  fakeCatalogItems,
  sampleAgents,
  sampleCatalogItems,
  sampleNumbers,
  voiceApp
} from "./fixtures";

const withAgents =
  (items: object[], catalog: object[] = sampleCatalogItems) =>
  (auth: AuthContextValue) => ({
    status: "signedIn" as const,
    sdk: {
      ...auth.sdk,
      applications: {
        listApplications: fn().mockResolvedValue({ items }),
        getApplication: fn().mockImplementation(
          async (ref: string) =>
            sampleAgents.find((agent) => agent.ref === ref) ?? billingAgent
        ),
        createApplication: fn().mockResolvedValue({ ref: billingAgent.ref }),
        updateApplication: fn().mockResolvedValue({ ref: billingAgent.ref }),
        deleteApplication: fn().mockResolvedValue({ ref: billingAgent.ref })
      },
      numbers: {
        listNumbers: fn().mockResolvedValue({ items: sampleNumbers })
      },
      providers: { listCatalog: fn().mockResolvedValue({ items: catalog }) },
      calls: {
        listCalls: async (request: { to?: string }) => ({
          items: request.to === "+18295550199" ? sampleCalls.slice(0, 3) : [],
          nextPageToken: ""
        })
      }
    } as never
  });

const route = (url: string) => ({
  path: "/w/:workspaceRef/agents/*",
  url
});

const detail = (tab: string) => ({
  parameters: {
    screen: {
      auth: withAgents([...sampleAgents, voiceApp]),
      route: route(`/w/ws-1/agents/${billingAgent.ref}/${tab}`)
    }
  }
});

const meta = {
  title: "Workspace/Agents",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <AgentsScreen />
    </WorkspaceProvider>
  ),
  parameters: {
    screen: {
      auth: withAgents([...sampleAgents, voiceApp]),
      route: route("/w/ws-1/agents")
    }
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: {
    screen: { auth: withAgents([voiceApp]), route: route("/w/ws-1/agents") }
  }
};

export const CreateDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Billing reminders");
    await userEvent.click(canvas.getByRole("button", { name: "Create agent" }));
  }
};

export const Configure: Story = detail("configure");
export const ConfigureLight: Story = {
  ...detail("configure"),
  globals: { theme: "light" }
};
export const ConfigureUnsaved: Story = {
  ...detail("configure"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = await canvas.findByLabelText("First message");
    await userEvent.type(first, " Gracias.");
  }
};
/** A workspace with no vendor keys (a fresh dev container): only the fakes are offered. */
export const ConfigureFakesOnly: Story = {
  parameters: {
    screen: {
      auth: withAgents([...sampleAgents, voiceApp], fakeCatalogItems),
      route: route(`/w/ws-1/autopilot/${billingAgent.ref}/configure`)
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Voice/ })
    );
  }
};
export const Tools: Story = detail("tools");
export const ToolsLight: Story = {
  ...detail("tools"),
  globals: { theme: "light" }
};
export const Advanced: Story = detail("advanced");
export const Calls: Story = detail("calls");

export const TalkToAgent: Story = {
  ...detail("configure"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Talk to agent" })
    );
  }
};
