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
import { sampleCalls } from "~/calls/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import OverviewScreen from ".";

function setup(
  listCalls = vi
    .fn()
    .mockResolvedValue({ items: sampleCalls, nextPageToken: "" })
) {
  const auth = fakeAuth({
    status: "signedIn",
    sdk: { calls: { listCalls } } as never
  });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <OverviewScreen />
    </WorkspaceProvider>,
    { auth }
  );
  return { ...view, listCalls };
}

describe("Overview", () => {
  it("sums the range's calls from the call records", async () => {
    setup();
    const totals = await screen.findByLabelText("Totals");
    expect(within(totals).getByText("Calls").nextSibling).toHaveTextContent(
      "6"
    );
    expect(within(totals).getByText("Completed").nextSibling).toHaveTextContent(
      "50%"
    );
    expect(
      screen.getByRole("region", { name: "Ended reasons" })
    ).toHaveTextContent("Busy");
    expect(
      screen.getByRole("table", { name: "Recent calls" })
    ).toBeInTheDocument();
  });

  it("asks for another range and pages until a short page", async () => {
    const full = Array.from({ length: 50 }, (_, i) => ({
      ...sampleCalls[0],
      ref: `c-${i}`
    }));
    const listCalls = vi
      .fn()
      .mockResolvedValueOnce({ items: full, nextPageToken: "t1" })
      .mockResolvedValue({
        items: sampleCalls.slice(0, 2),
        nextPageToken: "t2"
      });
    const { user } = setup(listCalls);
    const totals = await screen.findByLabelText("Totals");
    expect(within(totals).getByText("Calls").nextSibling).toHaveTextContent(
      "52"
    );
    expect(listCalls).toHaveBeenCalledTimes(2);
    expect(listCalls.mock.calls[1][0].pageToken).toBe("t1");

    await user.click(screen.getByRole("radio", { name: "30d" }));
    expect(
      await screen.findByText("Calls in Acme Support, last 30 days.")
    ).toBeInTheDocument();
  });

  it("shows the steps to a first call instead of drawing empty charts", async () => {
    setup(vi.fn().mockResolvedValue({ items: [], nextPageToken: "" }));
    // Nothing is set up (the lists aren't mocked), so the first step is next.
    expect(
      await screen.findByRole("heading", { name: "Welcome to Acme Support" })
    ).toBeInTheDocument();
    const steps = screen.getByRole("list", {
      name: "Steps to your first call"
    });
    expect(within(steps).getAllByRole("listitem")).toHaveLength(4);
    expect(
      within(steps).getByRole("button", { name: "Create agent" })
    ).toBeInTheDocument();
    expect(
      within(steps).getByRole("link", { name: "Create number" })
    ).toHaveAttribute("href", "/w/ws-1/numbers?new=1");
    expect(
      within(steps).getByText("Bring your carrier so you have numbers to use.")
    ).toBeInTheDocument();
    expect(
      within(steps).getByRole("link", { name: "Or link a Twilio number" })
    ).toHaveAttribute("href", "/w/ws-1/numbers?link=twilio");
    expect(
      within(steps).getByRole("link", { name: "Create trunk" })
    ).toHaveAttribute("href", "/w/ws-1/trunks/new");
    expect(
      screen.queryByRole("region", { name: "Call volume" })
    ).not.toBeInTheDocument();
  });
});
