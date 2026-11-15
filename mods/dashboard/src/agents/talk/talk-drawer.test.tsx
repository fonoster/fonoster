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
import { act, screen, within } from "@testing-library/react";
import { cloudCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { sampleNumbers } from "../fixtures";
import { TalkDrawer } from "./talk-drawer";

/** One fake sip.js SimpleUser per call; tests drive its delegate. */
type Delegate = {
  onCallAnswered?: () => void;
  onCallHangup?: () => void;
  onServerDisconnect?: (error?: Error) => void;
};
type RequestDelegate = {
  onProgress?: (r: unknown) => void;
  onReject?: (r: unknown) => void;
};
const sip = vi.hoisted(() => ({
  users: [] as {
    server: string;
    options: { aor: string; delegate: Delegate };
    connect: ReturnType<typeof vi.fn>;
    call: ReturnType<typeof vi.fn>;
    hangup: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    mute: ReturnType<typeof vi.fn>;
    unmute: ReturnType<typeof vi.fn>;
    isMuted: () => boolean;
  }[],
  connectFails: false
}));

vi.mock("sip.js", () => ({
  Web: {
    SimpleUser: vi.fn().mockImplementation(function (
      server: string,
      options: { aor: string; delegate: Delegate }
    ) {
      let muted = false;
      const user = {
        server,
        options,
        connect: vi.fn(async () => {
          if (sip.connectFails) throw new Error("WebSocket closed");
        }),
        call: vi.fn().mockResolvedValue(undefined),
        hangup: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        mute: vi.fn(() => (muted = true)),
        unmute: vi.fn(() => (muted = false)),
        isMuted: () => muted
      };
      sip.users.push(user);
      return user;
    })
  }
}));

const TOKEN = {
  token: "jwt-1",
  domain: "internal",
  displayName: "Test Call Agent",
  signalingServer: "ws://localhost:8449/sip",
  targetAor: "sip:roomr@default",
  username: "internal"
};

const getUserMedia = vi.fn();

function setSecure(secure: boolean) {
  Object.defineProperty(window, "isSecureContext", {
    value: secure,
    configurable: true
  });
  Object.defineProperty(navigator, "mediaDevices", {
    value: secure ? { getUserMedia } : undefined,
    configurable: true
  });
}

function setup({
  dirty = false,
  status
}: {
  dirty?: boolean;
  /** GetCallsStatus on Fonoster Cloud; without it, billing is off (self-hosted). */
  status?: ReturnType<typeof vi.fn>;
} = {}) {
  const createTestToken = vi.fn().mockResolvedValue(TOKEN);
  const sdk = {
    applications: { createTestToken },
    billing: { getCallsStatus: status },
    numbers: {
      listNumbers: vi.fn().mockResolvedValue({ items: sampleNumbers })
    }
  };
  const onOpenChange = vi.fn();
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <TalkDrawer
        open
        onOpenChange={onOpenChange}
        appRef="ap-7f3c91"
        name="Billing reminders"
        dirty={dirty}
      />
    </WorkspaceProvider>,
    {
      auth: fakeAuth({ status: "signedIn", sdk: sdk as never }),
      ...(status ? { capabilities: cloudCapabilities } : {})
    }
  );
  return { ...view, createTestToken, onOpenChange };
}

const card = () => screen.getByRole("region", { name: "Talk in the browser" });
const lastUser = () => sip.users[sip.users.length - 1];

describe("Talk drawer: browser call", () => {
  beforeEach(() => {
    // jsdom has no media playback.
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    sip.users.length = 0;
    sip.connectFails = false;
    getUserMedia.mockReset();
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });
    setSecure(true);
  });

  it("calls the saved agent, mutes and hangs up", async () => {
    const { user, createTestToken } = setup();
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Call"
      })
    );

    expect(createTestToken).toHaveBeenCalledOnce();
    const sipAgent = lastUser();
    expect(sipAgent.server).toBe("ws://localhost:8449/sip");
    expect(sipAgent.options.aor).toBe("sip:internal@internal");
    expect(sipAgent.connect).toHaveBeenCalled();
    expect(sipAgent.call).toHaveBeenCalledWith(
      "sip:roomr@default",
      {
        extraHeaders: ["X-App-Ref: ap-7f3c91", "X-Connect-Token: jwt-1"]
      },
      expect.anything()
    );
    expect(within(card()).getByText("Connecting…")).toBeInTheDocument();

    const delegate = sipAgent.call.mock.calls[0][2]
      .requestDelegate as RequestDelegate;
    act(() => delegate.onProgress?.({ message: { statusCode: 180 } }));
    expect(within(card()).getByText("Ringing…")).toBeInTheDocument();

    act(() => sipAgent.options.delegate.onCallAnswered?.());
    expect(within(card()).getByText("Connected")).toBeInTheDocument();
    expect(within(card()).getByLabelText("Call time")).toHaveTextContent(
      "0:00"
    );

    await user.click(within(card()).getByRole("button", { name: "Mute" }));
    expect(sipAgent.mute).toHaveBeenCalled();
    await user.click(within(card()).getByRole("button", { name: "Unmute" }));
    expect(sipAgent.unmute).toHaveBeenCalled();

    await user.click(within(card()).getByRole("button", { name: "Hang up" }));
    expect(sipAgent.hangup).toHaveBeenCalled();
    expect(sipAgent.disconnect).toHaveBeenCalled();
    expect(within(card()).getByText("Call ended")).toBeInTheDocument();
    expect(
      within(card()).getByRole("button", { name: "Call again" })
    ).toBeInTheDocument();
  });

  it("shows the call ended when the agent hangs up", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Call" }));
    act(() => lastUser().options.delegate.onCallAnswered?.());
    act(() => lastUser().options.delegate.onCallHangup?.());
    expect(within(card()).getByText("Call ended")).toBeInTheDocument();
  });

  it("says to allow the microphone when the browser blocks it", async () => {
    getUserMedia.mockRejectedValue(
      Object.assign(new Error("denied"), { name: "NotAllowedError" })
    );
    const { user, createTestToken } = setup();
    await user.click(await screen.findByRole("button", { name: "Call" }));
    expect(within(card()).getByText("Call failed")).toBeInTheDocument();
    expect(within(card()).getByRole("alert")).toHaveTextContent(
      "Allow microphone access in your browser to talk to the agent."
    );
    expect(createTestToken).not.toHaveBeenCalled();
    expect(
      within(card()).getByRole("button", { name: "Call again" })
    ).toBeInTheDocument();
  });

  it("shows the status when the call is rejected", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Call" }));
    const delegate = lastUser().call.mock.calls[0][2]
      .requestDelegate as RequestDelegate;
    await act(async () =>
      delegate.onReject?.({
        message: { statusCode: 403, reasonPhrase: "Forbidden" }
      })
    );
    act(() => lastUser().options.delegate.onCallHangup?.());
    expect(within(card()).getByText("Call failed")).toBeInTheDocument();
    expect(within(card()).getByRole("alert")).toHaveTextContent(
      "The call was rejected (403 Forbidden)."
    );
  });

  it("says when the call server can't be reached", async () => {
    sip.connectFails = true;
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Call" }));
    expect(within(card()).getByRole("alert")).toHaveTextContent(
      "Couldn't reach the call server. Try again."
    );
  });

  it("explains that browser calls need HTTPS or localhost, and still lists numbers", async () => {
    setSecure(false);
    setup();
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/Calls from the browser need HTTPS or localhost/)
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Call" })
    ).not.toBeInTheDocument();
    expect(await within(dialog).findByLabelText("Claro")).toHaveTextContent(
      "+18295550199"
    );
  });

  it("hangs up when the drawer closes", async () => {
    const { user, rerender } = setup();
    await user.click(await screen.findByRole("button", { name: "Call" }));
    act(() => lastUser().options.delegate.onCallAnswered?.());
    rerender(
      <TalkDrawer
        open={false}
        onOpenChange={() => {}}
        appRef="ap-7f3c91"
        name="Billing reminders"
        dirty={false}
      />
    );
    expect(lastUser().hangup).toHaveBeenCalled();
  });

  it("warns that unsaved changes don't reach the call", async () => {
    setup({ dirty: true });
    expect(
      await screen.findByText(/You have unsaved changes/)
    ).toBeInTheDocument();
  });
});

describe("Talk drawer: calls paused by billing", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    sip.users.length = 0;
    sip.connectFails = false;
    getUserMedia.mockReset();
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });
    setSecure(true);
  });

  const paused = (reason = "trial_ended") =>
    vi.fn().mockResolvedValue({ paused: true, reason });

  /** Starts a call and has the INVITE rejected with `statusCode`. */
  async function rejectWith(
    statusCode: number,
    reasonPhrase: string,
    status: ReturnType<typeof vi.fn>
  ) {
    const { user } = setup({ status });
    await user.click(await screen.findByRole("button", { name: "Call" }));
    const delegate = lastUser().call.mock.calls[0][2]
      .requestDelegate as RequestDelegate;
    await act(async () =>
      delegate.onReject?.({ message: { statusCode, reasonPhrase } })
    );
    act(() => lastUser().options.delegate.onCallHangup?.());
  }

  it("disables Call and says why while calls are paused", async () => {
    const { createTestToken } = setup({ status: paused() });
    const note = await within(card()).findByText(
      "Calls are paused in this workspace."
    );
    expect(
      within(card()).queryByText("Uses your microphone and speakers.")
    ).toBeNull();
    const call = within(card()).getByRole("button", { name: "Call" });
    expect(call).toBeDisabled();
    expect(call).toHaveAttribute("aria-describedby", note.id);
    expect(createTestToken).not.toHaveBeenCalled();
  });

  it("keeps Call enabled when calls aren't paused, or the read fails", async () => {
    const first = setup({
      status: vi.fn().mockResolvedValue({ paused: false })
    });
    expect(
      await within(card()).findByText("Uses your microphone and speakers.")
    ).toBeInTheDocument();
    expect(within(card()).getByRole("button", { name: "Call" })).toBeEnabled();
    first.unmount();

    const status = vi.fn().mockRejectedValue(new Error("unavailable"));
    setup({ status });
    await vi.waitFor(() => expect(status).toHaveBeenCalled());
    expect(within(card()).getByRole("button", { name: "Call" })).toBeEnabled();
  });

  it("says why a 402 refused the call, and disables Call again", async () => {
    const status = vi
      .fn()
      .mockResolvedValueOnce({ paused: false })
      .mockResolvedValue({ paused: true, reason: "insufficient_balance" });
    await rejectWith(402, "Payment Required", status);
    expect(within(card()).getByText("Call failed")).toBeInTheDocument();
    expect(await within(card()).findByRole("alert")).toHaveTextContent(
      "Credits have run out. Calls are paused in this workspace."
    );
    expect(within(card()).queryByText(/402/)).toBeNull();
    const again = await within(card()).findByRole("button", {
      name: "Call again"
    });
    await vi.waitFor(() => expect(again).toBeDisabled());
    expect(status).toHaveBeenCalledTimes(2);
  });

  it("says the call couldn't start when a 402 comes but calls aren't paused", async () => {
    await rejectWith(
      402,
      "Payment Required",
      vi.fn().mockResolvedValue({ paused: false })
    );
    expect(await within(card()).findByRole("alert")).toHaveTextContent(
      "The call couldn't start. Try again."
    );
    expect(
      within(card()).getByRole("button", { name: "Call again" })
    ).toBeEnabled();
  });

  it("shows a 503 as before", async () => {
    await rejectWith(
      503,
      "Service Unavailable",
      vi.fn().mockResolvedValue({ paused: false })
    );
    expect(within(card()).getByRole("alert")).toHaveTextContent(
      "The call was rejected (503 Service Unavailable)."
    );
  });
});
