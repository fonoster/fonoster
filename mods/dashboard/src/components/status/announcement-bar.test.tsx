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
import type { Workspace } from "@fonoster/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { BillingNotice } from "~/billing/billing-notice";
import type { Announcement } from "~/lib/announcement";
import { AuthOverride } from "~/lib/auth";
import { CapabilitiesOverride } from "~/lib/capabilities";
import { cloudCapabilities, communityCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { AnnouncementBar } from "./announcement-bar";
import { BillingNoticeProvider } from "./billing-notice-context";

const upgrade: Announcement = {
  show: true,
  tone: "critical",
  lead: "The biggest update in Fonoster history.",
  text: "Move your apps to the new version.",
  cta: "Read the upgrade plan",
  link: "https://fonoster.com/upgrade"
};

const renderBar = (announcement: Announcement | null) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AnnouncementBar load={async () => ({ announcement })} />
    </QueryClientProvider>
  );

describe("AnnouncementBar", () => {
  beforeEach(() => localStorage.clear());

  it("shows the message and its link", async () => {
    renderBar(upgrade);
    const bar = await screen.findByRole("alert");
    expect(bar).toHaveTextContent(
      "The biggest update in Fonoster history. Move your apps to the new version. Read the upgrade plan"
    );
    expect(
      screen.getByRole("link", { name: "Read the upgrade plan" })
    ).toHaveAttribute("href", "https://fonoster.com/upgrade");
  });

  it("shows nothing without an announcement", async () => {
    const { container } = renderBar(null);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it("stays closed for the same message and shows a new one", async () => {
    const first = renderBar(upgrade);
    await userEvent.click(
      await screen.findByRole("button", { name: "Close the announcement" })
    );
    expect(screen.queryByRole("alert")).toBeNull();
    first.unmount();

    const again = renderBar(upgrade);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("alert")).toBeNull();
    again.unmount();

    renderBar({ ...upgrade, text: "The old version shuts down soon." });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

/** The workspace someone else (Ana Ruiz) owns, for anyone but its owner. */
const anas: Workspace = {
  ...testWorkspace,
  ownerRef: "u-ana",
  owner: { ref: "u-ana", name: "Ana Ruiz", email: "ana@acme.com" }
};

function Where() {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{pathname + search}</div>;
}

/**
 * The bar as app.tsx mounts it, above a workspace page (BillingNotice under WorkspaceGate) and
 * /billing (outside any workspace). `status` answers GetCallsStatus.
 */
function renderInWorkspace({
  workspace = testWorkspace,
  status = vi.fn().mockResolvedValue({ paused: false }),
  announcement = null,
  capabilities = cloudCapabilities
}: {
  workspace?: Workspace;
  status?: ReturnType<typeof vi.fn>;
  announcement?: Announcement | null;
  capabilities?: typeof cloudCapabilities;
} = {}) {
  const auth = fakeAuth({
    status: "signedIn",
    user: { sub: "u1" } as never,
    sdk: { billing: { getCallsStatus: status } } as never
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  const user = userEvent.setup();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CapabilitiesOverride value={capabilities}>
        <AuthOverride value={auth}>
          <BillingNoticeProvider>
            <AnnouncementBar load={async () => ({ announcement })} />
            <MemoryRouter initialEntries={["/w/ws-1/overview"]}>
              <Routes>
                <Route
                  path="/w/:workspaceRef/*"
                  element={
                    <WorkspaceProvider value={workspace}>
                      <BillingNotice />
                      <Where />
                    </WorkspaceProvider>
                  }
                />
                <Route path="*" element={<Where />} />
              </Routes>
            </MemoryRouter>
          </BillingNoticeProvider>
        </AuthOverride>
      </CapabilitiesOverride>
    </QueryClientProvider>
  );
  return { ...view, user, status, queryClient };
}

const settle = () => act(() => new Promise((r) => setTimeout(r, 0)));

describe("AnnouncementBar: calls paused by billing", () => {
  beforeEach(() => localStorage.clear());

  it("tells the owner the Trial ended and links to Billing, with no close button", async () => {
    const { user } = renderInWorkspace({
      status: vi
        .fn()
        .mockResolvedValue({ paused: true, reason: "trial_ended" }),
      announcement: upgrade
    });
    const bar = await screen.findByText(/Calls are paused/);
    expect(bar.closest(".fn-announcement")).toHaveAttribute(
      "data-tone",
      "critical"
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The Trial has ended. Calls are paused in this workspace. Go to Billing"
    );
    // Instead of the config announcement, and it can't be closed.
    expect(screen.queryByText(/biggest update/)).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Close the announcement" })
    ).toBeNull();

    const link = screen.getByRole("link", { name: "Go to Billing" });
    expect(link).toHaveAttribute("href", "/billing?from=ws-1");
    expect(link).not.toHaveAttribute("target");
    await user.click(link);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/billing?from=ws-1"
    );
    // No billing bar outside the workspace; the config announcement is back.
    expect(screen.queryByText(/Calls are paused/)).toBeNull();
    expect(await screen.findByText(/biggest update/)).toBeInTheDocument();
  });

  it("says Credits have run out when the balance is used up", async () => {
    renderInWorkspace({
      status: vi
        .fn()
        .mockResolvedValue({ paused: true, reason: "insufficient_balance" })
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credits have run out. Calls are paused in this workspace. Go to Billing"
    );
  });

  it("says only that calls are paused for a reason it doesn't know", async () => {
    renderInWorkspace({
      status: vi.fn().mockResolvedValue({ paused: true, reason: undefined })
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /^Calls are paused in this workspace\. Go to Billing$/
    );
  });

  it("tells anyone else whom to ask, with no link", async () => {
    const paused = () =>
      vi.fn().mockResolvedValue({ paused: true, reason: "trial_ended" });
    const first = renderInWorkspace({ workspace: anas, status: paused() });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The Trial has ended. Calls are paused in this workspace. Ask Ana Ruiz to update billing."
    );
    expect(screen.queryByRole("link")).toBeNull();
    first.unmount();

    const byEmail = renderInWorkspace({
      workspace: { ...anas, owner: { ...anas.owner!, name: "" } },
      status: paused()
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ask ana@acme.com to update billing."
    );
    byEmail.unmount();

    renderInWorkspace({
      workspace: { ...anas, owner: undefined },
      status: paused()
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ask the workspace owner to update billing."
    );
  });

  it("shows the config announcement when calls aren't paused", async () => {
    renderInWorkspace({ announcement: upgrade });
    expect(await screen.findByText(/biggest update/)).toBeInTheDocument();
    expect(screen.queryByText(/Calls are paused/)).toBeNull();
  });

  it("shows no billing bar when the read fails", async () => {
    const { status } = renderInWorkspace({
      status: vi.fn().mockRejectedValue(new Error("unavailable")),
      announcement: upgrade
    });
    expect(await screen.findByText(/biggest update/)).toBeInTheDocument();
    await settle();
    expect(status).toHaveBeenCalled();
    expect(screen.queryByText(/Calls are paused/)).toBeNull();
  });

  it("makes no request and changes nothing with billing off", async () => {
    const { status } = renderInWorkspace({
      capabilities: communityCapabilities,
      announcement: upgrade
    });
    expect(await screen.findByText(/biggest update/)).toBeInTheDocument();
    await settle();
    expect(status).not.toHaveBeenCalled();
    expect(screen.queryByText(/Calls are paused/)).toBeNull();
  });

  it("goes, and the config announcement comes back, once calls resume", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const status = vi
        .fn()
        .mockResolvedValueOnce({ paused: true, reason: "trial_ended" })
        .mockResolvedValue({ paused: false });
      renderInWorkspace({ status, announcement: upgrade });
      expect(await screen.findByText(/Calls are paused/)).toBeInTheDocument();
      // While paused it reads again every 60 seconds.
      await act(() => vi.advanceTimersByTimeAsync(60_000));
      expect(await screen.findByText(/biggest update/)).toBeInTheDocument();
      expect(screen.queryByText(/Calls are paused/)).toBeNull();
      expect(status).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
