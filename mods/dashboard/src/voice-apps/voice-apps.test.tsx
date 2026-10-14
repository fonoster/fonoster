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
import { screen, within } from "@testing-library/react";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import VoiceAppsScreen from ".";

// Radix Select needs these in jsdom.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const ivr = {
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
  createdAt: 1_791_900_000,
  updatedAt: 1_791_900_000
};
const recorder = {
  ref: "ap-e81b33",
  name: "Call recorder",
  type: "EXTERNAL",
  endpoint: "stream.acme.com:50061",
  createdAt: 1_791_900_000,
  updatedAt: 1_791_900_000
};
const agent = {
  ref: "ap-agent1",
  name: "Front desk agent",
  type: "AUTOPILOT",
  endpoint: "localhost",
  createdAt: 1_791_900_000,
  updatedAt: 1_791_900_000
};
const numbers = [
  {
    ref: "nb-1",
    name: "Madrid",
    telUrl: "+34910555211",
    appRef: "ap-5a20c7",
    trunk: { ref: "tr-1", name: "Telnyx EU" }
  },
  { ref: "nb-2", name: "Other", telUrl: "+18095550123", appRef: "ap-agent1" }
];

function setup({
  items = [ivr, recorder, agent],
  route = "/w/ws-1/voice-apps",
  listError
}: {
  items?: object[];
  route?: string;
  listError?: unknown;
} = {}) {
  const applications = {
    listApplications: listError
      ? vi.fn().mockRejectedValue(listError)
      : vi.fn().mockResolvedValue({ items }),
    getApplication: vi.fn().mockImplementation((ref: string) => {
      const found = items.find((a) => (a as { ref: string }).ref === ref);
      return found
        ? Promise.resolve(found)
        : Promise.reject(grpcError(5, "not found"));
    }),
    createApplication: vi.fn().mockResolvedValue({ ref: "ap-new" }),
    updateApplication: vi.fn().mockResolvedValue({ ref: "ap-5a20c7" }),
    deleteApplication: vi.fn().mockResolvedValue({ ref: "ap-5a20c7" })
  };
  const sdk = {
    applications,
    numbers: { listNumbers: vi.fn().mockResolvedValue({ items: numbers }) }
  };
  const auth = fakeAuth({ status: "signedIn", sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <VoiceAppsScreen />
    </WorkspaceProvider>,
    { auth, path: "/w/:workspaceRef/voice-apps/*", route }
  );
  return { ...view, applications };
}

async function choose(
  user: ReturnType<typeof setup>["user"],
  label: string,
  option: string
) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("Voice apps list", () => {
  it("lists only EXTERNAL apps with endpoint, numbers and speech", async () => {
    setup();
    const table = await screen.findByRole("table", { name: "Voice apps" });
    expect(await within(table).findByText("Main menu IVR")).toBeInTheDocument();
    expect(within(table).getByText("Call recorder")).toBeInTheDocument();
    expect(
      within(table).queryByText("Front desk agent")
    ).not.toBeInTheDocument();
    expect(within(table).getByText("voice.acme.com:50061")).toBeInTheDocument();
    expect(
      within(table).getByText("Aura 2 Diana · nova-3")
    ).toBeInTheDocument();
    expect(await within(table).findByText("+34910555211")).toBeInTheDocument();
    expect(
      within(table).queryByText("+1 809 555 0123")
    ).not.toBeInTheDocument();
    expect(screen.getByText("2 voice apps")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    const { user } = setup();
    await screen.findByText("Main menu IVR");
    await user.type(screen.getByLabelText("Search voice apps"), "stream.acme");
    expect(screen.queryByText("Main menu IVR")).not.toBeInTheDocument();
    expect(screen.getByText("Call recorder")).toBeInTheDocument();
  });

  it("shows the empty state when there are only agents", async () => {
    setup({ items: [agent] });
    expect(await screen.findByText("No voice apps yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New voice app" })
    ).toBeInTheDocument();
  });

  it("shows list errors with a retry", async () => {
    const { user, applications } = setup({ listError: new Error("boom") });
    expect(await screen.findByText(/boom/)).toBeInTheDocument();
    applications.listApplications.mockResolvedValue({ items: [ivr] });
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Main menu IVR")).toBeInTheDocument();
  });

  it("asks before deleting from the row menu", async () => {
    const { user, applications } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Actions for Call recorder" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(
      screen.getByRole("heading", { name: "Delete Call recorder?" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(applications.deleteApplication).toHaveBeenCalledWith("ap-e81b33");
  });
});

describe("New voice app", () => {
  it("validates the endpoint like the API and creates an IVR app", async () => {
    const { user, applications } = setup();
    await user.click(
      await screen.findByRole("button", { name: "New voice app" })
    );
    await user.type(screen.getByLabelText("Name"), "Main menu IVR");
    await user.type(screen.getByLabelText("Endpoint"), "http://voice.acme.com");
    await user.click(screen.getByRole("button", { name: "Create voice app" }));
    expect(
      await screen.findByText(
        "Use host:port, like voice.acme.com:50061 (no http://)"
      )
    ).toBeInTheDocument();
    expect(applications.createApplication).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Endpoint"));
    await user.type(screen.getByLabelText("Endpoint"), "voice.acme.com:50061");
    await user.click(screen.getByRole("button", { name: "Create voice app" }));
    expect(applications.createApplication).toHaveBeenCalledWith({
      name: "Main menu IVR",
      type: "EXTERNAL",
      endpoint: "voice.acme.com:50061",
      textToSpeech: {
        productRef: "tts.deepgram",
        config: { voice: "aura-2-thalia-en" }
      },
      speechToText: {
        productRef: "stt.deepgram",
        config: { model: "nova-3", languageCode: "en-US" }
      }
    });
    // Opens the new app's page.
    await vi.waitFor(() =>
      expect(applications.getApplication).toHaveBeenCalledWith("ap-new")
    );
  });

  it("requires an endpoint and sends no speech for a blank app", async () => {
    const { user, applications } = setup();
    await user.click(
      await screen.findByRole("button", { name: "New voice app" })
    );
    await user.click(screen.getByRole("radio", { name: /Blank/ }));
    expect(screen.getByRole("radio", { name: /Blank/ })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await user.type(screen.getByLabelText("Name"), "Recorder");
    await user.click(screen.getByRole("button", { name: "Create voice app" }));
    expect(
      await screen.findByText("Enter the host:port of your voice server")
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Endpoint"), "10.0.4.17:50061");
    await user.click(screen.getByRole("button", { name: "Create voice app" }));
    expect(applications.createApplication).toHaveBeenCalledWith({
      name: "Recorder",
      type: "EXTERNAL",
      endpoint: "10.0.4.17:50061"
    });
  });

  it("shows the API error and stays open", async () => {
    const { user, applications } = setup();
    applications.createApplication.mockRejectedValue(
      grpcError(3, "Invalid Deepgram voice")
    );
    await user.click(
      await screen.findByRole("button", { name: "New voice app" })
    );
    await user.type(screen.getByLabelText("Name"), "X");
    await user.type(screen.getByLabelText("Endpoint"), "voice.acme.com");
    await user.click(screen.getByRole("button", { name: "Create voice app" }));
    expect(
      await screen.findByText("Invalid Deepgram voice")
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("Voice app detail", () => {
  it("shows the app, its numbers and saves the whole app", async () => {
    const { user, applications } = setup({
      route: "/w/ws-1/voice-apps/ap-5a20c7"
    });
    expect(
      await screen.findByRole("heading", { name: "Main menu IVR" })
    ).toBeInTheDocument();
    const reachable = screen.getByRole("region", { name: "Reachable at" });
    expect(
      await within(reachable).findByText("+34910555211")
    ).toBeInTheDocument();
    expect(
      within(reachable).getByText("Trunk · Telnyx EU")
    ).toBeInTheDocument();
    expect(
      within(reachable).getByRole("link", { name: "Manage in Numbers →" })
    ).toHaveAttribute("href", "/w/ws-1/numbers");

    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Main menu");
    await choose(user, "Voice", "None");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(applications.updateApplication).toHaveBeenCalledWith({
      ref: "ap-5a20c7",
      name: "Main menu",
      type: "EXTERNAL",
      endpoint: "voice.acme.com:50061",
      speechToText: {
        productRef: "stt.deepgram",
        config: { model: "nova-3", languageCode: "es-ES" }
      }
    });
  });

  it("rejects multilingual with an unsupported model", async () => {
    const { user, applications } = setup({
      route: "/w/ws-1/voice-apps/ap-5a20c7"
    });
    await screen.findByRole("heading", { name: "Main menu IVR" });
    await choose(user, "Transcriber", "Deepgram · nova-2-phonecall");
    await choose(user, "Language", "Multilingual (nova-3 or nova-2)");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText("Multilingual needs nova-3 or nova-2")
    ).toBeInTheDocument();
    expect(applications.updateApplication).not.toHaveBeenCalled();
  });

  it("deletes and goes back to the list", async () => {
    const { user, applications } = setup({
      route: "/w/ws-1/voice-apps/ap-e81b33"
    });
    await screen.findByRole("heading", { name: "Call recorder" });
    await user.click(screen.getByRole("button", { name: "Delete voice app" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(applications.deleteApplication).toHaveBeenCalledWith("ap-e81b33");
    expect(
      await screen.findByRole("heading", { name: "Voice apps" })
    ).toBeInTheDocument();
  });

  it("says when the app doesn't exist", async () => {
    setup({ route: "/w/ws-1/voice-apps/ap-missing" });
    expect(
      await screen.findByText("This voice app doesn't exist or was deleted.")
    ).toBeInTheDocument();
  });

  it("doesn't open AI agents here", async () => {
    setup({ route: "/w/ws-1/voice-apps/ap-agent1" });
    expect(
      await screen.findByText(/This is an AI agent, not a voice app/)
    ).toBeInTheDocument();
  });
});
