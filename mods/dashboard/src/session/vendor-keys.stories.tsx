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
import VendorKeysScreen from "./vendor-keys";

const meta = {
  title: "Workspace/Vendor keys",
  render: () => (
    <SessionApiProvider value={createMockSessionApi()}>
      <VendorKeysScreen />
    </SessionApiProvider>
  ),
  parameters: {
    screen: {
      route: {
        path: "/w/:workspaceRef/vendor-keys",
        url: "/w/ws-1/vendor-keys"
      }
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
      <SessionApiProvider value={{ ...api, listVendorKeys: async () => [] }}>
        <VendorKeysScreen />
      </SessionApiProvider>
    );
  }
};
export const AddKey: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Deepgram");
    await userEvent.click(canvas.getByRole("button", { name: /Add key/ }));
  }
};
export const RowMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Actions for Deepgram" })
    );
  }
};
