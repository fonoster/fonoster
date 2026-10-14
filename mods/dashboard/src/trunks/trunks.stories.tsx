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
import { fn } from "@storybook/test";
import type { AuthContextValue } from "~/lib/auth";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeSdk } from "~/numbers/fixtures";
import { testWorkspace } from "~/test/workspace";
import TrunksScreen from ".";

const withTrunks =
  (data?: Parameters<typeof fakeSdk>[1]) => (auth: AuthContextValue) => ({
    status: "signedIn" as const,
    sdk: { ...auth.sdk, ...fakeSdk(fn as never, data) } as never
  });

const at = (url: string) => ({
  path: "/w/:workspaceRef/trunks/*",
  url: `/w/${testWorkspace.ref}/trunks${url}`
});

const meta = {
  title: "Workspace/Trunks",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <TrunksScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { route: at(""), auth: withTrunks() } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { route: at(""), auth: withTrunks({ trunks: [] }) } }
};

export const Detail: Story = {
  parameters: { screen: { route: at("/tk-31a0c2"), auth: withTrunks() } }
};
export const DetailLight: Story = { ...Detail, globals: { theme: "light" } };

export const New: Story = {
  parameters: { screen: { route: at("/new"), auth: withTrunks() } }
};
