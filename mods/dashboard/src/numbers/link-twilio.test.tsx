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
import { screen, waitFor, within } from "@testing-library/react";
import type { Mock } from "vitest";
import { toast, Toaster } from "~/components/ui/sonner";
import { GrpcCode } from "~/lib/errors";
import { WorkspaceProvider } from "~/lib/workspace";
import { useAllTrunks } from "~/trunks/trunks.service";
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { fakeSdk, numbers } from "./fixtures";
import NumbersScreen from "./index";

/** Keeps the trunks list mounted, so its refetch shows the invalidation. */
function TrunksProbe() {
  useAllTrunks();
  return null;
}

function setup({
  route = "/w/ws-1/numbers",
  data,
  noRoutes
}: {
  route?: string;
  data?: Parameters<typeof fakeSdk>[1];
  /** No agents, apps or SIP agents in the workspace. */
  noRoutes?: boolean;
} = {}) {
  const sdk = fakeSdk(vi.fn as never, data);
  if (noRoutes) {
    sdk.applications.listApplications.mockResolvedValue({ items: [] });
    sdk.agents.listAgents.mockResolvedValue({ items: [] });
  }
  const auth = fakeAuth({ status: "signedIn", sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <NumbersScreen />
      <TrunksProbe />
      <Toaster />
    </WorkspaceProvider>,
    { path: "/w/:workspaceRef/numbers", route, auth }
  );
  return {
    ...view,
    sdk,
    linkTwilio: sdk.numbers.linkTwilio as unknown as Mock
  };
}

type View = ReturnType<typeof setup>;

async function openFromMenu({ user }: View, where?: HTMLElement) {
  const scope = where ? within(where) : screen;
  const trigger = await scope.findByRole("button", { name: "Link number" });
  await user.click(trigger);
  await user.click(
    await screen.findByRole("menuitem", { name: "Twilio number" })
  );
  return {
    trigger,
    drawer: await screen.findByRole("dialog", { name: "Link Twilio number" })
  };
}

/** Fills the drawer with a number, a route and the Account SID. */
async function fillBasics(
  { user }: View,
  drawer: HTMLElement,
  phoneNumber = "+18095550123"
) {
  const form = within(drawer);
  await user.type(form.getByLabelText("Number"), phoneNumber);
  await user.click(
    await form.findByRole("radio", { name: /Billing reminders/ })
  );
  await user.type(
    form.getByLabelText("Twilio Account SID"),
    "AC0123456789abcdef0123456789abcdef"
  );
}

async function fillApiKey({ user }: View, drawer: HTMLElement) {
  const form = within(drawer);
  await user.type(
    form.getByLabelText("API key SID"),
    "SK0123456789abcdef0123456789abcdef"
  );
  await user.type(form.getByLabelText("API key secret"), "s3cr3t-key");
}

const submit = ({ user }: View, drawer: HTMLElement) =>
  user.click(within(drawer).getByRole("button", { name: "Link number" }));

describe("link a Twilio number", () => {
  // Sonner keeps toasts in a module store; earlier links' toasts would show again.
  afterEach(() => toast.dismiss());

  it("offers Link number after Create number in the header", async () => {
    const view = setup();
    await screen.findByText("+1 829 555 0199");
    const create = screen.getByRole("button", { name: "Create number" });
    const link = screen.getByRole("button", { name: "Link number" });
    expect(
      create.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(link.className).toContain("border-border");

    await view.user.click(link);
    expect(await screen.findAllByRole("menuitem")).toHaveLength(1);
    await view.user.click(
      screen.getByRole("menuitem", { name: "Twilio number" })
    );
    expect(
      await screen.findByRole("dialog", { name: "Link Twilio number" })
    ).toBeInTheDocument();
  });

  it("offers Link number in the empty state", async () => {
    const view = setup({ data: { numbers: [] } });
    await screen.findByText("No numbers yet");
    const create = screen.getByRole("button", { name: "Create number" });
    const link = screen.getByRole("button", { name: "Link number" });
    expect(
      create.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    const { drawer } = await openFromMenu(view);
    expect(drawer).toBeInTheDocument();
  });

  it("opens the drawer from ?link=twilio", async () => {
    setup({ route: "/w/ws-1/numbers?link=twilio" });
    expect(
      await screen.findByRole("dialog", { name: "Link Twilio number" })
    ).toBeInTheDocument();
  });

  it("opens nothing from ?link=other", async () => {
    setup({ route: "/w/ws-1/numbers?link=other" });
    await screen.findByText("+1 829 555 0199");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("returns focus to Link number when the drawer closes", async () => {
    const view = setup();
    const { trigger, drawer } = await openFromMenu(view);
    await view.user.click(
      within(drawer).getByRole("button", { name: "Cancel" })
    );
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("asks for an API key by default, with the three notes", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    expect(form.getByRole("radio", { name: "API key" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    const notes = [
      "Use a Standard API key or your Auth Token.",
      "Fonoster uses these once to link this number, then discards them.",
      "Linking sends all of this number's calls to Fonoster through a SIP trunk in your Twilio account."
    ];
    notes.forEach((note) => expect(form.getByText(note)).toBeInTheDocument());
    expect(form.getByLabelText("API key SID")).toBeInTheDocument();

    await view.user.click(form.getByRole("radio", { name: "Auth Token" }));
    expect(form.getByLabelText("Auth Token")).toBeInTheDocument();
    expect(form.queryByLabelText("API key SID")).not.toBeInTheDocument();
    expect(form.queryByLabelText("API key secret")).not.toBeInTheDocument();
    notes.forEach((note) => expect(form.getByText(note)).toBeInTheDocument());
  });

  it("links with an API key", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    await fillBasics(view, drawer);
    await fillApiKey(view, drawer);
    await submit(view, drawer);

    await waitFor(() => expect(view.linkTwilio).toHaveBeenCalledTimes(1));
    expect(view.linkTwilio).toHaveBeenCalledWith({
      phoneNumber: "+18095550123",
      appRef: "ap-7f3c91",
      credentials: {
        accountSid: "AC0123456789abcdef0123456789abcdef",
        apiKeySid: "SK0123456789abcdef0123456789abcdef",
        apiKeySecret: "s3cr3t-key"
      }
    });
  });

  it("sends only the Auth Token after switching to it", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    await fillBasics(view, drawer);
    await fillApiKey(view, drawer);
    await view.user.click(form.getByRole("radio", { name: "Auth Token" }));
    await view.user.type(form.getByLabelText("Auth Token"), "t0ken");
    await submit(view, drawer);

    await waitFor(() => expect(view.linkTwilio).toHaveBeenCalledTimes(1));
    expect(view.linkTwilio.mock.calls[0][0].credentials).toEqual({
      accountSid: "AC0123456789abcdef0123456789abcdef",
      authToken: "t0ken"
    });
  });

  it("checks the route, the Account SID and the Auth Token before calling", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    await view.user.type(form.getByLabelText("Number"), "+18095550123");
    await view.user.type(form.getByLabelText("Twilio Account SID"), "XX123");
    await view.user.click(form.getByRole("radio", { name: "Auth Token" }));
    await submit(view, drawer);

    expect(await form.findByText("Choose where calls go.")).toBeInTheDocument();
    expect(
      form.getByText("Enter an Account SID that starts with AC.")
    ).toBeInTheDocument();
    expect(form.getByText("Enter the Auth Token.")).toBeInTheDocument();
    expect(view.linkTwilio).not.toHaveBeenCalled();
  });

  it("says to create a route target first when there is none", async () => {
    const view = setup({ noRoutes: true });
    const { drawer } = await openFromMenu(view);
    expect(
      await within(drawer).findByText(
        "Create an agent, an app or a SIP agent first."
      )
    ).toBeInTheDocument();
  });

  it("holds the drawer while linking", async () => {
    const view = setup();
    view.linkTwilio.mockImplementation(() => new Promise(() => {}));
    const { drawer } = await openFromMenu(view);
    await fillBasics(view, drawer);
    await fillApiKey(view, drawer);
    await submit(view, drawer);

    const form = within(drawer);
    const button = await form.findByRole("button", { name: "Linking…" });
    expect(form.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await view.user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await view.user.click(button);
    expect(view.linkTwilio).toHaveBeenCalledTimes(1);
  });

  it("shows rejected credentials on the credential fields and keeps every value", async () => {
    const view = setup();
    view.linkTwilio.mockRejectedValue(
      grpcError(
        GrpcCode.FAILED_PRECONDITION,
        "Twilio didn't accept these credentials"
      )
    );
    const { drawer } = await openFromMenu(view);
    await fillBasics(view, drawer);
    await fillApiKey(view, drawer);
    await submit(view, drawer);

    const form = within(drawer);
    expect(
      await form.findByText("Twilio didn't accept these credentials")
    ).toBeInTheDocument();
    expect(form.getByLabelText("API key SID")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(form.getByLabelText("API key secret")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await waitFor(() =>
      expect(form.getByLabelText("API key SID")).toHaveFocus()
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(form.getByLabelText("Number")).toHaveValue("+18095550123");
    expect(form.getByLabelText("Twilio Account SID")).toHaveValue(
      "AC0123456789abcdef0123456789abcdef"
    );
    expect(form.getByLabelText("API key secret")).toHaveValue("s3cr3t-key");
  });

  it("shows a number missing from the Twilio account on Number", async () => {
    const view = setup();
    view.linkTwilio.mockRejectedValue(
      grpcError(
        GrpcCode.FAILED_PRECONDITION,
        "+18095550123 isn't in Twilio account AC…cdef"
      )
    );
    const { drawer } = await openFromMenu(view);
    await fillBasics(view, drawer);
    await fillApiKey(view, drawer);
    await submit(view, drawer);

    const form = within(drawer);
    expect(
      await form.findByText("+18095550123 isn't in Twilio account AC…cdef")
    ).toBeInTheDocument();
    expect(form.getByLabelText("Number")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await waitFor(() => expect(form.getByLabelText("Number")).toHaveFocus());
  });

  it.each([
    [
      "Twilio is unavailable",
      grpcError(GrpcCode.UNAVAILABLE, "Twilio is unavailable; try again"),
      "Twilio is unavailable; try again"
    ],
    [
      "the API is unreachable",
      grpcError(GrpcCode.UNAVAILABLE, "upstream connect error"),
      "Can't reach the Fonoster API. Check your connection and try again."
    ],
    [
      "something is missing",
      grpcError(GrpcCode.NOT_FOUND, "Application not found"),
      "Application not found"
    ]
  ])("shows a form alert when %s", async (_, error, text) => {
    const view = setup();
    view.linkTwilio.mockRejectedValue(error);
    const { drawer } = await openFromMenu(view);
    await fillBasics(view, drawer);
    await fillApiKey(view, drawer);
    await submit(view, drawer);

    const alert = await within(drawer).findByRole("alert");
    expect(alert).toHaveTextContent(text);
    await waitFor(() => expect(alert).toHaveFocus());
  });

  it("closes, toasts and lists the linked number on Twilio Trunk", async () => {
    const view = setup();
    const linked = {
      ref: "n-linked",
      name: "+18095550123",
      telUrl: "tel:+18095550123",
      appRef: "ap-7f3c91",
      trunk: { ref: "tk-twilio", name: "Twilio Trunk" }
    };
    const { drawer } = await openFromMenu(view);
    await fillBasics(view, drawer);
    await fillApiKey(view, drawer);
    await waitFor(() =>
      expect(view.sdk.trunks.listTrunks).toHaveBeenCalledTimes(1)
    );
    view.sdk.numbers.listNumbers.mockResolvedValue({
      items: [linked, ...numbers]
    });
    await submit(view, drawer);

    expect(
      await screen.findByText(
        "+1 809 555 0123 linked. Calls now go to Billing reminders."
      )
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    const table = screen.getByRole("table", { name: "Numbers" });
    const row = within(
      (await within(table).findByText("+1 809 555 0123")).closest("tr")!
    );
    expect(row.getByText("Twilio Trunk")).toBeInTheDocument();
    await waitFor(() =>
      expect(view.sdk.trunks.listTrunks).toHaveBeenCalledTimes(2)
    );
  });

  it("warns when the number is already in the workspace", async () => {
    const view = setup({
      data: {
        numbers: [
          ...numbers,
          { ref: "n9", name: "Bare", telUrl: "tel:+18095550999" }
        ]
      }
    });
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    await view.user.type(form.getByLabelText("Number"), "+18095550177");
    expect(
      await form.findByText(
        "This number is in your workspace, routed to Billing reminders on the Altice trunk. Linking moves it to Twilio Trunk and the route you choose."
      )
    ).toBeInTheDocument();

    await view.user.clear(form.getByLabelText("Number"));
    await view.user.type(form.getByLabelText("Number"), "+18095550999");
    expect(
      await form.findByText(
        "This number is in your workspace. Linking moves it to Twilio Trunk and the route you choose."
      )
    ).toBeInTheDocument();
  });

  it("forgets the secret when the drawer closes", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    await fillApiKey(view, drawer);
    await view.user.click(
      within(drawer).getByRole("button", { name: "Cancel" })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );

    const { drawer: again } = await openFromMenu(view);
    expect(within(again).getByLabelText("API key secret")).toHaveValue("");
    const stored = JSON.stringify({ ...localStorage, ...sessionStorage });
    expect(stored).not.toContain("s3cr3t-key");
    expect(window.location.href).not.toContain("s3cr3t-key");
  });

  it("keeps password managers away from the secret and labels its toggle", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    expect(form.getByLabelText("API key secret")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(
      form.getByRole("button", { name: "Show API key secret" })
    ).toBeInTheDocument();
  });
});
