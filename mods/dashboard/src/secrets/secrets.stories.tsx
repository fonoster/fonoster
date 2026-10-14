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
import SecretsScreen from ".";

const withSecrets = (items: object[]) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  sdk: {
    ...auth.sdk,
    secrets: {
      listSecrets: fn().mockResolvedValue({ items }),
      createSecret: fn().mockResolvedValue({ ref: "sc-new" }),
      updateSecret: fn().mockResolvedValue({ ref: "sc-1" }),
      deleteSecret: fn().mockResolvedValue({ ref: "sc-1" })
    }
  } as never
});

const sample = [
  {
    ref: "sc-1a20e9",
    name: "OPENAI_API_KEY",
    secret: "",
    createdAt: Date.parse("2026-10-02") / 1000,
    updatedAt: Date.parse("2026-10-02") / 1000
  },
  {
    ref: "sc-7bd2c1",
    name: "DEEPGRAM_API_KEY",
    secret: "",
    createdAt: Date.parse("2026-09-30") / 1000,
    updatedAt: Date.parse("2026-09-30") / 1000
  },
  {
    ref: "sc-e04f88",
    name: "ACME_PAYMENTS_TOKEN",
    secret: "",
    createdAt: Date.parse("2026-09-12") / 1000,
    updatedAt: Date.parse("2026-09-12") / 1000
  }
];

const meta = {
  title: "Workspace/Secrets",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <SecretsScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withSecrets(sample) } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { auth: withSecrets([]) } }
};
