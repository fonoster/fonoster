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
import { userEvent, within } from "@storybook/test";
import { SessionApiProvider } from "./api";
import { createMockSessionApi } from "./mock-api";
import WebhooksScreen from "./webhooks";

const meta = {
  title: "Workspace/Webhooks",
  render: () => (
    <SessionApiProvider value={createMockSessionApi()}>
      <WebhooksScreen />
    </SessionApiProvider>
  ),
  parameters: {
    screen: {
      route: { path: "/w/:workspaceRef/webhooks", url: "/w/ws-1/webhooks" }
    }
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  render: () => {
    const api = createMockSessionApi();
    return (
      <SessionApiProvider
        value={{
          ...api,
          listWebhooks: async () => [],
          listDeliveries: async () => []
        }}
      >
        <WebhooksScreen />
      </SessionApiProvider>
    );
  }
};
export const Create: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /Create webhook/ })
    );
  }
};
export const Edit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = await canvas.findByRole("table", { name: "Webhooks" });
    await userEvent.click(
      await within(table).findByText("https://hooks.example.com/fonoster")
    );
  }
};
export const SigningSecretOnce: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /Create webhook/ })
    );
    const body = within(document.body);
    await userEvent.type(
      await body.findByLabelText("URL"),
      "https://new.example.com/events"
    );
    await userEvent.click(
      within(
        await body.findByRole("dialog", { name: "Create webhook" })
      ).getByRole("button", { name: "Create webhook" })
    );
  }
};
