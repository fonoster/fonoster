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
import ApiKeysScreen from ".";
import { ApiKeySecretDialog } from "./secret-dialog";

const created = {
  ref: "ak-new",
  accessKeyId: "AP3f8h1j6k0p2s9u4y7a5c1e8g3i6o0q",
  accessKeySecret: "k3Jd9_fQ2x7LmVt0bN8rS4yWc1uHe6Ga"
};

const withKeys = (items: object[]) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  sdk: {
    ...auth.sdk,
    apiKeys: {
      listApiKeys: fn().mockResolvedValue({ items }),
      createApiKey: fn().mockResolvedValue(created),
      regenerateApiKey: fn().mockResolvedValue(created),
      deleteApiKey: fn().mockResolvedValue({ ref: "ak-1" })
    }
  } as never
});

const seconds = (date: string) => Date.parse(date) / 1000;

const sample = [
  {
    ref: "ak-1",
    accessKeyId: "APq7d0k2m9x4c8v1b6n3z5l0w2e7r9t4",
    role: "WORKSPACE_ADMIN",
    createdAt: seconds("2026-09-03"),
    updatedAt: seconds("2026-09-03")
  },
  {
    ref: "ak-2",
    accessKeyId: "AP3f8h1j6k0p2s9u4y7a5c1e8g3i6o0q",
    role: "WORKSPACE_MEMBER",
    expiresAt: seconds("2027-01-01T12:00:00Z"),
    createdAt: seconds("2026-10-01"),
    updatedAt: seconds("2026-10-01")
  }
];

const meta = {
  title: "Workspace/API keys",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <ApiKeysScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withKeys(sample) } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { auth: withKeys([]) } }
};

/** The once-only secret, as shown after Create or Regenerate. */
export const SaveSecret: Story = {
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <ApiKeysScreen />
      <ApiKeySecretDialog
        apiKey={created}
        workspaceAccessKeyId={testWorkspace.accessKeyId}
        onDone={fn()}
      />
    </WorkspaceProvider>
  )
};
export const SaveSecretLight: Story = {
  ...SaveSecret,
  globals: { theme: "light" }
};

/** The row "…" menu, open on the first key. */
export const RowMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: `Actions for ${sample[0].accessKeyId}`
      })
    );
  }
};
