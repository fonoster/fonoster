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
import SecretsScreen from ".";

function setup(items: object[] = []) {
  const secrets = {
    listSecrets: vi.fn().mockResolvedValue({ items }),
    createSecret: vi.fn().mockResolvedValue({ ref: "sc-new" }),
    updateSecret: vi.fn().mockResolvedValue({ ref: "sc-1" }),
    deleteSecret: vi.fn().mockResolvedValue({ ref: "sc-1" })
  };
  const auth = fakeAuth({ status: "signedIn", sdk: { secrets } as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <SecretsScreen />
    </WorkspaceProvider>,
    { auth }
  );
  return { ...view, secrets };
}

describe("Secrets", () => {
  it("lists secrets without their values", async () => {
    setup([
      {
        ref: "sc-1",
        name: "OPENAI_API_KEY",
        secret: "",
        createdAt: 1_791_900_000,
        updatedAt: 1_791_900_000
      }
    ]);
    expect(await screen.findByText("OPENAI_API_KEY")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Secrets" });
    expect(within(table).getByText("••••••••••••")).toBeInTheDocument();
  });

  it("shows the empty state with an add action", async () => {
    setup([]);
    expect(await screen.findByText("No secrets yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create secret" })
    ).toBeInTheDocument();
  });

  it("validates the name like the API and creates the secret", async () => {
    const { user, secrets } = setup([]);
    await user.click(
      await screen.findByRole("button", { name: "Create secret" })
    );
    await user.type(screen.getByLabelText("Name"), "bad name");
    await user.click(screen.getByRole("button", { name: "Create secret" }));
    expect(
      await screen.findByText("Letters, numbers, underscores and hyphens only")
    ).toBeInTheDocument();
    expect(secrets.createSecret).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "OPENAI_API_KEY");
    await user.type(screen.getByLabelText("Value"), "sk-test");
    await user.click(screen.getByRole("button", { name: "Create secret" }));
    expect(secrets.createSecret).toHaveBeenCalledWith({
      name: "OPENAI_API_KEY",
      secret: "sk-test"
    });
  });

  it("keeps the value when renaming with an empty value", async () => {
    const { user, secrets } = setup([
      { ref: "sc-1", name: "OLD", secret: "", createdAt: 0, updatedAt: 0 }
    ]);
    await user.click(await screen.findByText("OLD"));
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "NEW_NAME");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(secrets.updateSecret).toHaveBeenCalledWith({
      ref: "sc-1",
      name: "NEW_NAME"
    });
  });

  it("asks before deleting", async () => {
    const { user, secrets } = setup([
      { ref: "sc-1", name: "OLD", secret: "", createdAt: 0, updatedAt: 0 }
    ]);
    await user.click(
      await screen.findByRole("button", { name: "Actions for OLD" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(
      screen.getByRole("heading", { name: "Delete OLD?" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(secrets.deleteSecret).toHaveBeenCalledWith("sc-1");
  });
});
