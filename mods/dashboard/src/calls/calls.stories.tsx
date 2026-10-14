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
import { testWorkspace } from "~/test/workspace";
import CallsScreen from ".";
import { sampleCalls } from "./fixtures";

const withCalls =
  (items: object[], getCall = async (): Promise<unknown> => sampleCalls[0]) =>
  (auth: AuthContextValue) => ({
    status: "signedIn" as const,
    sdk: {
      ...auth.sdk,
      calls: {
        listCalls: fn().mockResolvedValue({ items, nextPageToken: "" }),
        getCall
      }
    } as never
  });

const route = (url: string) => ({ path: "/w/:workspaceRef/calls/*", url });

const meta = {
  title: "Workspace/Calls",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <CallsScreen />
    </WorkspaceProvider>
  ),
  parameters: {
    screen: { auth: withCalls(sampleCalls), route: route("/w/ws-1/calls") }
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: {
    screen: { auth: withCalls([]), route: route("/w/ws-1/calls") }
  }
};
export const NoMatches: Story = {
  parameters: {
    screen: {
      auth: withCalls([]),
      route: route("/w/ws-1/calls?status=USER_BUSY")
    }
  }
};

const detail = (index: number) => ({
  screen: {
    auth: withCalls(sampleCalls, async () => sampleCalls[index]),
    route: route(`/w/ws-1/calls/${sampleCalls[index].ref}`)
  }
});

export const Detail: Story = { parameters: detail(0) };
export const DetailLight: Story = {
  parameters: detail(0),
  globals: { theme: "light" }
};
export const DetailCloud: Story = {
  parameters: detail(0),
  globals: { variant: "cloud" }
};
export const DetailWithoutAmd: Story = { parameters: detail(2) };
export const DetailNotFound: Story = {
  parameters: {
    screen: {
      auth: withCalls(sampleCalls, async () => {
        throw Object.assign(new Error("Call not found"), { code: 5 });
      }),
      route: route("/w/ws-1/calls/missing")
    }
  }
};
