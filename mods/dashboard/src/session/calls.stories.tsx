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
import { CallsScreen } from ".";
import { SessionApiProvider } from "./api";
import { createMockSessionApi } from "./mock-api";

const route = (url: string) => ({ path: "/w/:workspaceRef/calls/*", url });

const meta = {
  title: "Workspace/Calls",
  render: () => (
    <SessionApiProvider value={createMockSessionApi()}>
      <CallsScreen />
    </SessionApiProvider>
  ),
  parameters: { screen: { route: route("/w/ws-1/calls") } }
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
        value={{ ...api, listCalls: async () => ({ items: [] }) }}
      >
        <CallsScreen />
      </SessionApiProvider>
    );
  }
};
export const Detail: Story = {
  parameters: { screen: { route: route("/w/ws-1/calls/room-1") } }
};
export const DetailLight: Story = { ...Detail, globals: { theme: "light" } };
/** room-2 ran without its noise filter: the unfiltered warning shows. */
export const DetailFiltersWarning: Story = {
  parameters: { screen: { route: route("/w/ws-1/calls/room-2") } }
};
