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
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import type { AuthContextValue } from "~/lib/auth";
import { WorkspaceProvider } from "~/lib/workspace";
import { testWorkspace } from "~/test/workspace";
import NumbersScreen from ".";
import { fakeSdk } from "./fixtures";

const withNumbers =
  (data?: Parameters<typeof fakeSdk>[1]) => (auth: AuthContextValue) => ({
    status: "signedIn" as const,
    sdk: { ...auth.sdk, ...fakeSdk(fn as never, data) } as never
  });

/** The Numbers page with `linkTwilio` answered by `linkTwilio`. */
const withLink =
  (linkTwilio: () => Promise<unknown>, data?: Parameters<typeof fakeSdk>[1]) =>
  (auth: AuthContextValue) => {
    const sdk = fakeSdk(fn as never, data);
    return {
      status: "signedIn" as const,
      sdk: {
        ...auth.sdk,
        ...sdk,
        numbers: { ...sdk.numbers, linkTwilio: fn(linkTwilio) }
      } as never
    };
  };

const LINK_ROUTE = {
  path: "/w/:workspaceRef/numbers",
  url: "/w/ws-1/numbers?link=twilio"
};

/** Fills the Link Twilio number drawer with a number, a route and an API key. */
async function fillLink(canvasElement: HTMLElement, number = "+18095550123") {
  const drawer = within(
    await within(canvasElement.ownerDocument.body).findByRole("dialog")
  );
  await userEvent.type(drawer.getByLabelText("Number"), number);
  await userEvent.click(
    await drawer.findByRole("radio", { name: /Billing reminders/ })
  );
  await userEvent.type(
    drawer.getByLabelText("Twilio Account SID"),
    "AC0123456789abcdef0123456789abcdef"
  );
  await userEvent.type(
    drawer.getByLabelText("API key SID"),
    "SK0123456789abcdef0123456789abcdef"
  );
  await userEvent.type(drawer.getByLabelText("API key secret"), "secret");
  return drawer;
}

const meta = {
  title: "Workspace/Numbers",
  render: () => (
    <WorkspaceProvider value={testWorkspace}>
      <NumbersScreen />
    </WorkspaceProvider>
  ),
  parameters: { screen: { auth: withNumbers() } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const ListLight: Story = { globals: { theme: "light" } };
export const Empty: Story = {
  parameters: { screen: { auth: withNumbers({ numbers: [] }) } }
};

/** The edit drawer, opened on a number routed to an agent. */
export const Edit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText("Billing inbound"));
    const drawer = within(canvasElement.ownerDocument.body);
    await expect(
      await drawer.findByRole("radio", { name: /Billing reminders/ })
    ).toBeInTheDocument();
  }
};
export const EditLight: Story = { ...Edit, globals: { theme: "light" } };

export const Add: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Create number" })
    );
  }
};

/** Fills and submits the create drawer: the success toast shows. */
export const Created: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Create number" })
    );
    const drawer = within(await body.findByRole("dialog"));
    await userEvent.type(drawer.getByLabelText("Number"), "+1 809 555 0111");
    await userEvent.type(drawer.getByLabelText("Name"), "Sales");
    await userEvent.type(drawer.getByLabelText("City"), "Santiago");
    await userEvent.click(drawer.getByLabelText("Country"));
    await userEvent.click(
      await body.findByRole("option", { name: "Dominican Republic" })
    );
    await userEvent.click(drawer.getByLabelText("Trunk"));
    await userEvent.click(await body.findByRole("option", { name: "Claro" }));
    await userEvent.click(
      drawer.getByRole("radio", { name: /Appointment booking/ })
    );
    await userEvent.click(
      drawer.getByRole("button", { name: "Create number" })
    );
    await expect(await body.findByText("Number created")).toBeInTheDocument();
  }
};

/** "Link number" → "Twilio number": the drawer, on an API key. */
export const LinkTwilio: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Link number" })
    );
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Twilio number" })
    );
    await expect(
      await body.findByRole("dialog", { name: "Link Twilio number" })
    ).toBeInTheDocument();
  }
};
export const LinkTwilioLight: Story = {
  ...LinkTwilio,
  globals: { theme: "light" }
};

export const LinkTwilioAuthToken: Story = {
  parameters: { screen: { auth: withNumbers(), route: LINK_ROUTE } },
  play: async ({ canvasElement }) => {
    const drawer = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog")
    );
    await userEvent.click(drawer.getByRole("radio", { name: "Auth Token" }));
  }
};

/** Submitted on a number already in the workspace; Twilio hasn't answered. */
export const LinkTwilioPending: Story = {
  parameters: {
    screen: { auth: withLink(() => new Promise(() => {})), route: LINK_ROUTE }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillLink(canvasElement, "+18095550177");
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(
      await drawer.findByRole("button", { name: "Linking…" })
    ).toBeDisabled();
  }
};

export const LinkTwilioErrors: Story = {
  parameters: {
    screen: {
      auth: withLink(() =>
        Promise.reject(
          Object.assign(new Error("Twilio didn't accept these credentials"), {
            code: 9
          })
        )
      ),
      route: LINK_ROUTE
    }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillLink(canvasElement);
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(
      await drawer.findByText("Twilio didn't accept these credentials")
    ).toBeInTheDocument();
  }
};

export const LinkTwilioInWorkspace: Story = {
  parameters: { screen: { auth: withNumbers(), route: LINK_ROUTE } },
  play: async ({ canvasElement }) => {
    const drawer = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog")
    );
    await userEvent.type(drawer.getByLabelText("Number"), "+18095550177");
    await expect(
      await drawer.findByText(/This number is in your workspace/)
    ).toBeInTheDocument();
  }
};

/** Linked: the toast shows and the number lists on Twilio Trunk. */
export const Linked: Story = {
  parameters: {
    screen: {
      auth: withLink(() =>
        Promise.resolve({ ref: "n-linked", trunkRef: "tk-twilio" })
      ),
      route: LINK_ROUTE
    }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillLink(canvasElement);
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(
      await within(canvasElement.ownerDocument.body).findByText(
        "+1 809 555 0123 linked. Calls now go to Billing reminders."
      )
    ).toBeInTheDocument();
  }
};
