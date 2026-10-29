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

const WHATSAPP_ROUTE = {
  path: "/w/:workspaceRef/numbers",
  url: "/w/ws-1/numbers?link=whatsapp"
};

const WHATSAPP_LINKED = {
  ref: "n-linked",
  trunkRef: "tk-whatsapp",
  sipServerHostname:
    "wa-wo7d2kq9x4m1c8b3n6p0r5t2v9y4z7a1e3-525512345678.pstn.fonoster.ai",
  sipServerPort: 5061,
  sipPasswordSet: true,
  phoneNumber: "+525512345678",
  verifiedName: "Acme Dental",
  metaConfigured: true
};

/** The Numbers page with `linkWhatsApp` answered by `linkWhatsApp`. */
const withWhatsAppLink =
  (linkWhatsApp: () => Promise<unknown>) => (auth: AuthContextValue) => {
    const sdk = fakeSdk(fn as never);
    return {
      status: "signedIn" as const,
      sdk: {
        ...auth.sdk,
        ...sdk,
        numbers: { ...sdk.numbers, linkWhatsApp: fn(linkWhatsApp) }
      } as never
    };
  };

/** Fills the Link WhatsApp number drawer's token side: a route, the phone number ID and a token. */
async function fillWhatsAppToken(canvasElement: HTMLElement) {
  const drawer = within(
    await within(canvasElement.ownerDocument.body).findByRole("dialog")
  );
  await userEvent.click(
    await drawer.findByRole("radio", { name: /Billing reminders/ })
  );
  await userEvent.type(
    drawer.getByLabelText("Phone number ID"),
    "106612345678901"
  );
  await userEvent.type(drawer.getByLabelText("Access token"), "EAAGtoken");
  return drawer;
}

/** Fills the SIP password side: the number, a route and the password. */
async function fillWhatsAppPassword(
  canvasElement: HTMLElement,
  password = "meta-issued-password"
) {
  const drawer = within(
    await within(canvasElement.ownerDocument.body).findByRole("dialog")
  );
  await userEvent.click(drawer.getByRole("radio", { name: "SIP password" }));
  await userEvent.type(drawer.getByLabelText("Number"), "+525512345678");
  await userEvent.click(
    await drawer.findByRole("radio", { name: /Billing reminders/ })
  );
  if (password)
    await userEvent.type(drawer.getByLabelText("SIP password"), password);
  return drawer;
}

/** "Link number" → "WhatsApp number": the drawer, on the Meta access token side. */
export const LinkWhatsApp: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Link number" })
    );
    await userEvent.click(
      await body.findByRole("menuitem", { name: "WhatsApp number" })
    );
    await expect(
      await body.findByRole("dialog", { name: "Link WhatsApp number" })
    ).toBeInTheDocument();
  }
};
export const LinkWhatsAppLight: Story = {
  ...LinkWhatsApp,
  globals: { theme: "light" }
};

export const LinkWhatsAppFilled: Story = {
  parameters: { screen: { auth: withNumbers(), route: WHATSAPP_ROUTE } },
  play: async ({ canvasElement }) => {
    await fillWhatsAppToken(canvasElement);
  }
};

export const LinkWhatsAppSipPassword: Story = {
  parameters: { screen: { auth: withNumbers(), route: WHATSAPP_ROUTE } },
  play: async ({ canvasElement }) => {
    await fillWhatsAppPassword(canvasElement);
  }
};

/** Submitted; Meta hasn't answered. */
export const LinkWhatsAppPending: Story = {
  parameters: {
    screen: {
      auth: withWhatsAppLink(() => new Promise(() => {})),
      route: WHATSAPP_ROUTE
    }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillWhatsAppToken(canvasElement);
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(
      await drawer.findByRole("button", { name: "Linking…" })
    ).toBeDisabled();
  }
};

/** Meta refused the token: the error sits on the Access token field. */
export const LinkWhatsAppFieldError: Story = {
  parameters: {
    screen: {
      auth: withWhatsAppLink(() =>
        Promise.reject(
          Object.assign(new Error("Meta didn't accept this access token"), {
            code: 9
          })
        )
      ),
      route: WHATSAPP_ROUTE
    }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillWhatsAppToken(canvasElement);
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(
      await drawer.findByText("Meta didn't accept this access token")
    ).toBeInTheDocument();
  }
};

/** The install can't take WhatsApp calls: a form alert. */
export const LinkWhatsAppFormAlert: Story = {
  parameters: {
    screen: {
      auth: withWhatsAppLink(() =>
        Promise.reject(
          Object.assign(
            new Error(
              "This install has no public SIP over TLS address for WhatsApp to send calls to"
            ),
            { code: 9 }
          )
        )
      ),
      route: WHATSAPP_ROUTE
    }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillWhatsAppToken(canvasElement);
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(await drawer.findByRole("alert")).toBeInTheDocument();
  }
};

/** Linked with a token: Meta is configured, nothing left to do. */
export const LinkWhatsAppDone: Story = {
  parameters: {
    screen: {
      auth: withWhatsAppLink(() => Promise.resolve(WHATSAPP_LINKED)),
      route: WHATSAPP_ROUTE
    }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillWhatsAppToken(canvasElement);
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(
      await drawer.findByText(/is linked to Billing reminders/)
    ).toBeInTheDocument();
  }
};
export const LinkWhatsAppDoneLight: Story = {
  ...LinkWhatsAppDone,
  globals: { theme: "light" }
};

/** Linked with the SIP password: the SIP server to register, the password set. */
export const LinkWhatsAppDoneSipPassword: Story = {
  parameters: {
    screen: {
      auth: withWhatsAppLink(() =>
        Promise.resolve({
          ...WHATSAPP_LINKED,
          verifiedName: "",
          metaConfigured: false
        })
      ),
      route: WHATSAPP_ROUTE
    }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillWhatsAppPassword(canvasElement);
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(
      await drawer.findByText("SIP password: set")
    ).toBeInTheDocument();
  }
};

/** Linked without a password yet: the SIP server to register and what's left. */
export const LinkWhatsAppDoneNoPassword: Story = {
  parameters: {
    screen: {
      auth: withWhatsAppLink(() =>
        Promise.resolve({
          ...WHATSAPP_LINKED,
          sipPasswordSet: false,
          verifiedName: "",
          metaConfigured: false
        })
      ),
      route: WHATSAPP_ROUTE
    }
  },
  play: async ({ canvasElement }) => {
    const drawer = await fillWhatsAppPassword(canvasElement, "");
    await userEvent.click(drawer.getByRole("button", { name: "Link number" }));
    await expect(
      await drawer.findByText(/SIP password: not set yet/)
    ).toBeInTheDocument();
  }
};
