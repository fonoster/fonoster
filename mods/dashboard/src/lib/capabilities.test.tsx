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
import { act, render, screen } from "@testing-library/react";
import { CapabilitiesProvider, useCapabilities } from "./capabilities";
import { communityCapabilities } from "./fixtures";

function Domain() {
  return <p>{useCapabilities().domain}</p>;
}

describe("CapabilitiesProvider", () => {
  it("renders once the API answers", async () => {
    const client = {
      getCapabilities: vi.fn().mockResolvedValue(communityCapabilities)
    };
    render(
      <CapabilitiesProvider
        client={client}
        loading={<p>loading</p>}
        failed={() => <p>failed</p>}
      >
        <Domain />
      </CapabilitiesProvider>
    );
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("fonoster.local")).toBeInTheDocument();
  });

  it("shows the failure, never a guess, and can retry", async () => {
    const client = {
      getCapabilities: vi
        .fn()
        .mockRejectedValueOnce(new Error("down"))
        .mockResolvedValue(communityCapabilities)
    };
    render(
      <CapabilitiesProvider
        client={client}
        loading={<p>loading</p>}
        failed={(retry) => <button onClick={retry}>retry</button>}
      >
        <Domain />
      </CapabilitiesProvider>
    );
    const retry = await screen.findByRole("button", { name: "retry" });
    expect(screen.queryByText("fonoster.local")).not.toBeInTheDocument();
    await act(async () => retry.click());
    expect(await screen.findByText("fonoster.local")).toBeInTheDocument();
  });
});
