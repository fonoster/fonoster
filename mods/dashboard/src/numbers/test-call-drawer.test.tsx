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
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { sampleNumbers } from "../agents/fixtures";
import { TestCallDrawer } from "./test-call-drawer";

const FAILED_PRECONDITION = 9;

function setup(
  status: ReturnType<typeof vi.fn>,
  createCall = vi.fn().mockResolvedValue({
    ref: "call-1",
    statusStream: (async function* () {})()
  })
) {
  const sdk = { billing: { getCallsStatus: status }, calls: { createCall } };
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <TestCallDrawer
        number={sampleNumbers[0]}
        appName="Acme Support"
        onOpenChange={() => {}}
        returnFocusTo={() => null}
      />
    </WorkspaceProvider>,
    {
      auth: fakeAuth({ status: "signedIn", sdk: sdk as never }),
      capabilities: cloudCapabilities
    }
  );
  return { ...view, createCall };
}

describe("Test call: calls paused by billing", () => {
  it("disables Call and says why while calls are paused", async () => {
    setup(vi.fn().mockResolvedValue({ paused: true, reason: "trial_ended" }));
    const dialog = await screen.findByRole("dialog");
    const note = await within(dialog).findByText(
      "Calls are paused in this workspace."
    );
    const call = within(dialog).getByRole("button", { name: "Call" });
    expect(call).toBeDisabled();
    expect(call).toHaveAttribute("aria-describedby", note.id);
  });

  it("keeps Call enabled when the read fails", async () => {
    const status = vi.fn().mockRejectedValue(new Error("unavailable"));
    setup(status);
    const dialog = await screen.findByRole("dialog");
    await vi.waitFor(() => expect(status).toHaveBeenCalled());
    expect(within(dialog).getByRole("button", { name: "Call" })).toBeEnabled();
    expect(within(dialog).queryByText(/Calls are paused/)).toBeNull();
  });

  it("says the Trial ended when CreateCall refuses, and disables Call", async () => {
    const status = vi
      .fn()
      .mockResolvedValueOnce({ paused: false })
      .mockResolvedValue({ paused: true, reason: "trial_ended" });
    const { user } = setup(
      status,
      vi
        .fn()
        .mockRejectedValue(
          grpcError(FAILED_PRECONDITION, "The call was refused: trial_ended")
        )
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText("Number to call"),
      "+18095550100"
    );
    await user.click(within(dialog).getByRole("button", { name: "Call" }));
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(
      "The Trial has ended. Calls are paused in this workspace."
    );
    expect(alert).toHaveFocus();
    await vi.waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Call" })
      ).toBeDisabled()
    );
    expect(status).toHaveBeenCalledTimes(2);
  });
});
