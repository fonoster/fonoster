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
import { fakeAuth, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import CredentialsScreen from "./index";

const credentials = [
  { ref: "cr-1", name: "claro-acme", username: "acme" },
  { ref: "cr-2", name: "maria-desk", username: "maria" },
  { ref: "cr-3", name: "spare", username: "spare" }
];

function setup({ items = credentials } = {}) {
  const sdk = {
    credentials: {
      listCredentials: vi.fn().mockResolvedValue({ items }),
      createCredentials: vi.fn().mockResolvedValue({ ref: "cr-new" }),
      updateCredentials: vi.fn().mockResolvedValue({ ref: "cr-1" }),
      deleteCredentials: vi.fn().mockResolvedValue(undefined)
    },
    trunks: {
      listTrunks: vi.fn().mockResolvedValue({
        items: [
          { ref: "t1", name: "Claro", outboundCredentials: { ref: "cr-1" } }
        ]
      })
    },
    agents: {
      listAgents: vi.fn().mockResolvedValue({
        items: [
          {
            ref: "a1",
            name: "María Rodríguez",
            credentials: { ref: "cr-2" }
          }
        ]
      })
    }
  };
  const auth = fakeAuth({ sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <CredentialsScreen />
    </WorkspaceProvider>,
    { auth }
  );
  return { ...view, sdk };
}

describe("Credentials screen", () => {
  it("lists credentials with hidden passwords and what uses them", async () => {
    setup();
    const claro = (await screen.findByText("claro-acme")).closest("tr")!;
    expect(within(claro).getByText("acme")).toBeInTheDocument();
    expect(within(claro).getByText("Hidden")).toBeInTheDocument();
    expect(
      await within(claro).findByText("Trunk · Claro (outbound)")
    ).toBeInTheDocument();

    const maria = screen.getByText("maria-desk").closest("tr")!;
    expect(
      within(maria).getByText("SIP user · María Rodríguez")
    ).toBeInTheDocument();

    const spare = screen
      .getByText("spare", { selector: "span.font-medium" })
      .closest("tr")!;
    expect(within(spare).getByText("—")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    setup({ items: [] });
    expect(await screen.findByText("No credentials yet")).toBeInTheDocument();
  });

  it("creates credentials, requiring a password", async () => {
    const { user, sdk } = setup({ items: [] });
    await user.click(
      await screen.findByRole("button", { name: /Add credentials/ })
    );
    await user.type(screen.getByLabelText("Name"), "altice-acme");
    await user.type(screen.getByLabelText("Username"), "acme_do");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Enter a password")).toBeInTheDocument();
    expect(sdk.credentials.createCredentials).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Password"), "s3cret!");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(sdk.credentials.createCredentials).toHaveBeenCalledWith({
      name: "altice-acme",
      username: "acme_do",
      password: "s3cret!"
    });
  });

  it("rejects usernames the API won't take", async () => {
    const { user, sdk } = setup({ items: [] });
    await user.click(
      await screen.findByRole("button", { name: /Add credentials/ })
    );
    await user.type(screen.getByLabelText("Name"), "x");
    await user.type(screen.getByLabelText("Username"), "Acme User");
    await user.type(screen.getByLabelText("Password"), "p");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(/Lowercase letters/)).toBeInTheDocument();
    expect(sdk.credentials.createCredentials).not.toHaveBeenCalled();
  });

  it("keeps the current password when the field is left empty", async () => {
    const { user, sdk } = setup();
    await user.click(await screen.findByText("claro-acme"));
    expect(
      await screen.findByText("Leave empty to keep the current password.")
    ).toBeInTheDocument();
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "claro-main");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sdk.credentials.updateCredentials).toHaveBeenCalledWith({
      ref: "cr-1",
      name: "claro-main",
      username: "acme"
    });
  });

  it("sends a new password when one is entered", async () => {
    const { user, sdk } = setup();
    await user.click(await screen.findByText("claro-acme"));
    await user.type(await screen.findByLabelText("New password"), "n3w");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sdk.credentials.updateCredentials).toHaveBeenCalledWith({
      ref: "cr-1",
      name: "claro-acme",
      username: "acme",
      password: "n3w"
    });
  });

  it("warns before deleting credentials that are in use", async () => {
    const { user, sdk } = setup();
    await user.click(await screen.findByText("maria-desk"));
    await screen.findByText("SIP user · María Rodríguez", { selector: "p" });
    await user.click(
      screen.getByRole("button", { name: "Delete credentials" })
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Delete maria-desk?"
    });
    expect(
      within(dialog).getByText(/used by SIP user · María Rodríguez/)
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(sdk.credentials.deleteCredentials).toHaveBeenCalledWith("cr-2");
  });
});
