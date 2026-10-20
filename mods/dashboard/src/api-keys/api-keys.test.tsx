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
import ApiKeysScreen, { formatExpiry } from ".";
import { expiresAtFor } from "./create-api-key-dialog";

// Radix Select needs these in jsdom.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const created = {
  ref: "ak-new",
  accessKeyId: "APnew0000000000000000000000000000",
  accessKeySecret: "s3cr3t-value"
};

function setup(items: object[] = []) {
  const apiKeys = {
    listApiKeys: vi.fn().mockResolvedValue({ items }),
    createApiKey: vi.fn().mockResolvedValue(created),
    regenerateApiKey: vi.fn().mockResolvedValue({
      ...created,
      ref: "ak-1",
      accessKeySecret: "regenerated-secret"
    }),
    deleteApiKey: vi.fn().mockResolvedValue({ ref: "ak-1" })
  };
  const auth = fakeAuth({ status: "signedIn", sdk: { apiKeys } as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <ApiKeysScreen />
    </WorkspaceProvider>,
    { auth }
  );
  return { ...view, apiKeys };
}

const key = {
  ref: "ak-1",
  accessKeyId: "APq7d0k2m9x4c8v1b6n3z5l0w2e7r9t4",
  role: "WORKSPACE_ADMIN",
  createdAt: Date.parse("2026-09-03") / 1000,
  updatedAt: Date.parse("2026-09-03") / 1000
};

describe("API keys", () => {
  it("lists keys with role and expiry", async () => {
    setup([key]);
    const table = await screen.findByRole("table", { name: "API keys" });
    expect(await within(table).findByText(key.accessKeyId)).toBeInTheDocument();
    expect(within(table).getByText("Workspace admin")).toBeInTheDocument();
    expect(within(table).getByText("Never")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    setup([]);
    expect(await screen.findByText("No API keys yet")).toBeInTheDocument();
  });

  it("creates a key and shows its secret once, until the user confirms", async () => {
    const { user, apiKeys } = setup([]);
    await user.click(
      await screen.findByRole("button", { name: "Create API key" })
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Create API key" })
    );
    expect(apiKeys.createApiKey).toHaveBeenCalledWith({
      role: "WORKSPACE_ADMIN"
    });

    expect(
      await screen.findByRole("heading", { name: "Save your API key" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("API key")).toHaveTextContent(
      created.accessKeyId
    );
    expect(screen.getByLabelText("API secret")).toHaveTextContent(
      "s3cr3t-value"
    );
    expect(screen.getByLabelText("SDK snippet")).toHaveTextContent(
      `accessKeyId: "${testWorkspace.accessKeyId}"`
    );

    const done = screen.getByRole("button", { name: "Done" });
    expect(done).toBeDisabled();
    await user.click(screen.getByLabelText("I've saved it"));
    expect(done).toBeEnabled();
    await user.click(done);
    expect(screen.queryByText("s3cr3t-value")).not.toBeInTheDocument();
  });

  it("sends an expiry when one is picked", async () => {
    const { user, apiKeys } = setup([]);
    await user.click(
      await screen.findByRole("button", { name: "Create API key" })
    );
    await user.click(screen.getByLabelText("Expires"));
    await user.click(await screen.findByRole("option", { name: "In 30 days" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create API key"
      })
    );
    const request = apiKeys.createApiKey.mock.calls[0][0];
    const days = (request.expiresAt - Date.now() / 1000) / 86400;
    expect(Math.round(days)).toBe(30);
  });

  it("asks before regenerating, then shows the new secret", async () => {
    const { user, apiKeys } = setup([key]);
    await user.click(
      await screen.findByRole("button", {
        name: `Actions for ${key.accessKeyId}`
      })
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Regenerate" })
    );
    expect(apiKeys.regenerateApiKey).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(apiKeys.regenerateApiKey).toHaveBeenCalledWith("ak-1");
    expect(await screen.findByLabelText("API secret")).toHaveTextContent(
      "regenerated-secret"
    );
  });

  it("asks before deleting", async () => {
    const { user, apiKeys } = setup([key]);
    await user.click(
      await screen.findByRole("button", {
        name: `Actions for ${key.accessKeyId}`
      })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    await user.type(screen.getByLabelText(/to confirm/), "DELETE");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(apiKeys.deleteApiKey).toHaveBeenCalledWith("ak-1");
  });
});

describe("formatExpiry", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  it("reads never, future and past expiries", () => {
    expect(formatExpiry(undefined, now)).toBe("Never");
    expect(formatExpiry(0, now)).toBe("Never");
    expect(formatExpiry(Date.parse("2027-01-01T12:00:00Z") / 1000, now)).toBe(
      "Jan 1, 2027"
    );
    expect(formatExpiry(Date.parse("2026-10-01T12:00:00Z") / 1000, now)).toBe(
      "Expired Oct 1"
    );
  });

  it("computes expiry in epoch seconds", () => {
    expect(expiresAtFor("never")).toBeUndefined();
    expect(expiresAtFor("30", 1_000_000)).toBe(1000 + 30 * 86400);
  });
});
