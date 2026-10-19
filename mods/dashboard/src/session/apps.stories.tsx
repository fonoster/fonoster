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
import { AppsScreen } from ".";
import { SessionApiProvider } from "./api";
import { createMockSessionApi } from "./mock-api";

const route = (url: string) => ({ path: "/w/:workspaceRef/apps/*", url });

const meta = {
  title: "Workspace/Apps",
  render: () => (
    <SessionApiProvider value={createMockSessionApi()}>
      <AppsScreen />
    </SessionApiProvider>
  ),
  parameters: { screen: { route: route("/w/ws-1/apps") } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  render: () => {
    const api = createMockSessionApi();
    return (
      <SessionApiProvider value={{ ...api, listApps: async () => [] }}>
        <AppsScreen />
      </SessionApiProvider>
    );
  }
};
export const NewApp: Story = {
  parameters: { screen: { route: route("/w/ws-1/apps/new") } }
};
export const Detail: Story = {
  parameters: {
    screen: { route: route("/w/ws-1/apps/pipecat-bot/configure") }
  }
};
export const DetailCallHandling: Story = {
  parameters: {
    screen: { route: route("/w/ws-1/apps/pipecat-bot/call-handling") }
  }
};
