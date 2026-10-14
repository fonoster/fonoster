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
import VoiceAppsScreen from ".";

const at = (date: string) => Date.parse(date) / 1000;

const sample = [
  {
    ref: "ap-5a20c7",
    name: "Main menu IVR",
    type: "EXTERNAL",
    endpoint: "voice.acme.com:50061",
    textToSpeech: {
      productRef: "tts.deepgram",
      config: { voice: "aura-2-diana-es" }
    },
    speechToText: {
      productRef: "stt.deepgram",
      config: { model: "nova-3", languageCode: "es-ES" }
    },
    createdAt: at("2026-10-09"),
    updatedAt: at("2026-10-09")
  },
  {
    ref: "ap-e81b33",
    name: "Call recorder",
    type: "EXTERNAL",
    endpoint: "stream.acme.com:50061",
    createdAt: at("2026-10-04"),
    updatedAt: at("2026-10-04")
  },
  {
    ref: "ap-0c9f12",
    name: "Support line (legacy)",
    type: "EXTERNAL",
    endpoint: "10.0.4.17:50061",
    textToSpeech: {
      productRef: "tts.google",
      config: { voice: "es-US-Neural2-A" }
    },
    createdAt: at("2026-08-21"),
    updatedAt: at("2026-08-21")
  },
  {
    ref: "ap-agent1",
    name: "Front desk agent (hidden: AUTOPILOT)",
    type: "AUTOPILOT",
    createdAt: at("2026-10-01"),
    updatedAt: at("2026-10-01")
  }
];

const numbers = [
  {
    ref: "nb-1",
    name: "Madrid",
    telUrl: "+34910555211",
    appRef: "ap-5a20c7",
    trunk: { ref: "tr-1", name: "Telnyx EU" }
  },
  {
    ref: "nb-2",
    name: "Santo Domingo",
    telUrl: "+18095550123",
    appRef: "ap-e81b33"
  },
  { ref: "nb-3", name: "Support", telUrl: "+18095550140", appRef: "ap-0c9f12" }
];

const withApps = (items: object[]) => (auth: AuthContextValue) => ({
  status: "signedIn" as const,
  sdk: {
    ...auth.sdk,
    applications: {
      listApplications: fn().mockResolvedValue({ items }),
      getApplication: fn((ref: string) =>
        Promise.resolve(items.find((a) => (a as { ref: string }).ref === ref))
      ),
      createApplication: fn().mockResolvedValue({ ref: "ap-new" }),
      updateApplication: fn().mockResolvedValue({ ref: "ap-5a20c7" }),
      deleteApplication: fn().mockResolvedValue({ ref: "ap-5a20c7" })
    },
    numbers: { listNumbers: fn().mockResolvedValue({ items: numbers }) }
  } as never
});

const meta = {
  title: "Workspace/Voice apps",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <VoiceAppsScreen />
    </WorkspaceProvider>
  ),
  parameters: {
    screen: {
      auth: withApps(sample),
      route: {
        path: "/w/:workspaceRef/voice-apps/*",
        url: "/w/ws-1/voice-apps"
      }
    }
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };

export const Empty: Story = {
  parameters: {
    screen: {
      auth: withApps([]),
      route: {
        path: "/w/:workspaceRef/voice-apps/*",
        url: "/w/ws-1/voice-apps"
      }
    }
  }
};

const openCreate: Story["play"] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(
    await canvas.findByRole("button", { name: "New voice app" })
  );
  const body = within(canvasElement.ownerDocument.body);
  await expect(
    await body.findByRole("heading", { name: "New voice app" })
  ).toBeInTheDocument();
};

export const Create: Story = { play: openCreate };
export const CreateLight: Story = {
  globals: { theme: "light" },
  play: openCreate
};

const detail = {
  screen: {
    auth: withApps(sample),
    route: {
      path: "/w/:workspaceRef/voice-apps/*",
      url: "/w/ws-1/voice-apps/ap-5a20c7"
    }
  }
};

export const Detail: Story = { parameters: detail };
export const DetailLight: Story = {
  parameters: detail,
  globals: { theme: "light" }
};
