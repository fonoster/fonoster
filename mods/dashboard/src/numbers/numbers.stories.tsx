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
import { expect, fn, userEvent, within } from "@storybook/test";
import type { AuthContextValue } from "~/lib/auth";
import { WorkspaceProvider } from "~/lib/workspace";
import { testWorkspace } from "~/test/workspace";
import NumbersScreen from ".";
import { fakeSdk } from "./fixtures";

const withNumbers =
  (data?: Parameters<typeof fakeSdk>[1]) => (auth: AuthContextValue) => ({
    status: "signedIn" as const,
    sdk: { ...auth.sdk, ...fakeSdk(fn as never, data) } as never
  });

const meta = {
  title: "Workspace/Numbers",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <NumbersScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withNumbers() } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { auth: withNumbers({ numbers: [] }) } }
};

/** The edit drawer, opened on a number routed to an agent. */
export const Edit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Billing inbound"));
    const drawer = within(canvasElement.ownerDocument.body);
    await expect(
      await drawer.findByRole("radio", { name: /Billing reminders/ })
    ).toBeInTheDocument();
  }
};
export const EditLight: Story = { ...Edit, globals: { theme: "light" } };

export const Add: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Add number" })
    );
  }
};
