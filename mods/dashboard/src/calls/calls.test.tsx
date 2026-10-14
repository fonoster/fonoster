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
import { cloudCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import CallsScreen from ".";
import { sampleCalls } from "./fixtures";

function setup({
  items = sampleCalls,
  route = "/w/ws-1/calls",
  getCall = vi.fn().mockResolvedValue(sampleCalls[0]),
  capabilities
}: {
  items?: object[];
  route?: string;
  getCall?: ReturnType<typeof vi.fn>;
  capabilities?: typeof cloudCapabilities;
} = {}) {
  const calls = {
    listCalls: vi.fn().mockResolvedValue({ items, nextPageToken: "" }),
    getCall
  };
  const auth = fakeAuth({ status: "signedIn", sdk: { calls } as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <CallsScreen />
    </WorkspaceProvider>,
    { auth, path: "/w/:workspaceRef/calls/*", route, capabilities }
  );
  return { ...view, calls };
}

describe("Calls", () => {
  it("lists calls with the customer, status and AMD verdict", async () => {
    setup();
    await screen.findByText("+1 829 555 0110");
    const table = screen.getByRole("table", { name: "Calls" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(sampleCalls.length + 1);
    const first = within(rows[1]);
    expect(first.getByText("+1 829 555 0110")).toBeInTheDocument();
    expect(first.getByText("Outbound")).toBeInTheDocument();
    expect(first.getByText("0:24")).toBeInTheDocument();
    expect(first.getByText("Completed")).toBeInTheDocument();
    expect(first.getByText("Human")).toBeInTheDocument();
    // Inbound: the caller is the customer, the dialed number is ours.
    const inbound = within(rows[3]);
    expect(inbound.getByText("+1 809 555 0142")).toBeInTheDocument();
    expect(inbound.getByText("No answer")).toBeInTheDocument();
  });

  it("asks the API for the last 7 days by default and filters by status", async () => {
    const { user, calls } = setup();
    await screen.findByRole("table", { name: "Calls" });
    const first = calls.listCalls.mock.calls[0][0];
    expect(first.status).toBeUndefined();
    expect(Date.now() - Date.parse(first.after)).toBeGreaterThan(
      6.9 * 86_400_000
    );

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Busy" }));
    expect(calls.listCalls).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "USER_BUSY" })
    );
  });

  it("offers to clear filters when nothing matches", async () => {
    const { user, calls } = setup({
      items: [],
      route: "/w/ws-1/calls?status=USER_BUSY"
    });
    expect(
      await screen.findByText("No calls match these filters")
    ).toBeInTheDocument();
    calls.listCalls.mockResolvedValue({
      items: sampleCalls,
      nextPageToken: ""
    });
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(
      await screen.findByRole("table", { name: "Calls" })
    ).toBeInTheDocument();
  });

  it("shows the empty state when the workspace has no calls", async () => {
    setup({ items: [] });
    expect(await screen.findByText("No calls yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Export CSV" })
    ).not.toBeInTheDocument();
  });

  it("opens a call's detail from its row", async () => {
    const { user, calls } = setup();
    await screen.findByText("+1 829 555 0110");
    const table = screen.getByRole("table", { name: "Calls" });
    await user.click(within(table).getAllByRole("row")[1]);
    expect(
      await screen.findByRole("heading", { name: /\+1 829 555 0110/ })
    ).toBeInTheDocument();
    expect(calls.getCall).toHaveBeenCalledWith(sampleCalls[0].ref);
  });

  it("shows the call record, the AMD verdict and what's coming", async () => {
    setup({ route: `/w/ws-1/calls/${sampleCalls[0].ref}` });
    const summary = await screen.findByRole("list", { name: "Summary" });
    expect(within(summary).getByText("Answered by human")).toBeInTheDocument();
    expect(
      within(summary).getByText("via +1 829 555 0199")
    ).toBeInTheDocument();
    const record = screen.getByRole("region", { name: "Call record" });
    expect(within(record).getByText("NORMAL_CLEARING")).toBeInTheDocument();
    const amd = screen.getByRole("region", {
      name: "Answering machine detection"
    });
    expect(within(amd).getByText("94%")).toBeInTheDocument();
    expect(within(amd).getByText("820 ms")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Recording and transcript" })
    ).toBeInTheDocument();
    // Community doesn't show costs.
    expect(
      screen.queryByRole("region", { name: "Cost" })
    ).not.toBeInTheDocument();
  });

  it("hides AMD when it didn't run and shows cost on Cloud", async () => {
    setup({
      route: `/w/ws-1/calls/${sampleCalls[2].ref}`,
      getCall: vi.fn().mockResolvedValue(sampleCalls[2]),
      capabilities: cloudCapabilities
    });
    expect(
      await screen.findByRole("region", { name: "Call record" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Answering machine detection" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Cost" })).toBeInTheDocument();
  });

  it("says when a call doesn't exist", async () => {
    setup({
      route: "/w/ws-1/calls/missing",
      getCall: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error("Call not found"), { code: 5 })
        )
    });
    expect(
      await screen.findByText("This call doesn't exist in this workspace.")
    ).toBeInTheDocument();
  });
});
