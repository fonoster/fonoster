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
import { sampleCalls } from "~/calls/fixtures";
import type { AuthContextValue } from "~/lib/auth";
import { WorkspaceProvider } from "~/lib/workspace";
import { testWorkspace } from "~/test/workspace";
import OverviewScreen from ".";

/** A week of calls: the sample morning repeated across the last days. */
const week = Array.from({ length: 7 }, (_, day) =>
  sampleCalls.slice(0, 6 - (day % 3)).map((call, i) => ({
    ...call,
    ref: `${call.ref}-${day}-${i}`,
    startedAt: new Date((call.startedAt as Date).getTime() - day * 86_400_000)
  }))
).flat();

const withCalls = (items: object[]) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  sdk: {
    ...auth.sdk,
    calls: { listCalls: async () => ({ items, nextPageToken: "" }) }
  } as never
});

const meta = {
  title: "Workspace/Overview",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <OverviewScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withCalls(week) } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Light: Story = { globals: { theme: "light" } };
export const Cloud: Story = { globals: { variant: "cloud" } };
export const NoCalls: Story = {
  parameters: { screen: { auth: withCalls([]) } }
};

/** A new workspace with an agent but no trunk yet: the checklist's second step is next. */
export const NewWorkspace: Story = {
  parameters: {
    screen: {
      auth: (auth: AuthContextValue) => {
        const base = withCalls([])(auth);
        return {
          ...base,
          sdk: {
            ...(base.sdk as object),
            applications: {
              listApplications: async () => ({
                items: [{ ref: "ap-7f3c91", type: "AUTOPILOT" }]
              })
            },
            trunks: { listTrunks: async () => ({ items: [] }) },
            numbers: { listNumbers: async () => ({ items: [] }) }
          } as never
        };
      }
    }
  }
};
