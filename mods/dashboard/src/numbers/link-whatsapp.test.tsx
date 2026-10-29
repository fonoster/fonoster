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
import { screen, waitFor, within } from "@testing-library/react";
import type { Mock } from "vitest";
import { GrpcCode } from "~/lib/errors";
import { WorkspaceProvider } from "~/lib/workspace";
import { useAllTrunks } from "~/trunks/trunks.service";
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import { fakeSdk } from "./fixtures";
import NumbersScreen from "./index";

const HOSTNAME =
  "wa-wo7d2kq9x4m1c8b3n6p0r5t2v9y4z7a1e3-525512345678.pstn.fonoster.ai";
const PHONE_NUMBER_ID = "106612345678901";
const ACCESS_TOKEN = "EAAGm0PX4ZCpsBO7ZCZCTOKENvalue123";
const SIP_PASSWORD = "m3ta-1ssued-s3cret";

/** Keeps the trunks list mounted, so its refetch shows the invalidation. */
function TrunksProbe() {
  useAllTrunks();
  return null;
}

function setup({
  route = "/w/ws-1/numbers",
  data
}: { route?: string; data?: Parameters<typeof fakeSdk>[1] } = {}) {
  const sdk = fakeSdk(vi.fn as never, data);
  const auth = fakeAuth({ status: "signedIn", sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <NumbersScreen />
      <TrunksProbe />
    </WorkspaceProvider>,
    { path: "/w/:workspaceRef/numbers", route, auth }
  );
  return {
    ...view,
    sdk,
    linkWhatsApp: sdk.numbers.linkWhatsApp as unknown as Mock
  };
}

type View = ReturnType<typeof setup>;

async function openFromMenu({ user }: View) {
  const trigger = await screen.findByRole("button", { name: "Link number" });
  await user.click(trigger);
  await user.click(
    await screen.findByRole("menuitem", { name: "WhatsApp number" })
  );
  return {
    trigger,
    drawer: await screen.findByRole("dialog", { name: "Link WhatsApp number" })
  };
}

const pickRoute = async ({ user }: View, drawer: HTMLElement) =>
  user.click(
    await within(drawer).findByRole("radio", { name: /Billing reminders/ })
  );

/** The token side: a route, the phone number ID and the token. */
async function fillToken(view: View, drawer: HTMLElement) {
  const form = within(drawer);
  await pickRoute(view, drawer);
  await view.user.type(form.getByLabelText("Phone number ID"), PHONE_NUMBER_ID);
  await view.user.type(form.getByLabelText("Access token"), ACCESS_TOKEN);
}

/** The SIP password side: the number, a route and (optionally) the password. */
async function fillPassword(
  view: View,
  drawer: HTMLElement,
  { password = SIP_PASSWORD, number = "+525512345678" } = {}
) {
  const form = within(drawer);
  await view.user.click(form.getByRole("radio", { name: "SIP password" }));
  await view.user.type(form.getByLabelText("Number"), number);
  await pickRoute(view, drawer);
  if (password)
    await view.user.type(form.getByLabelText("SIP password"), password);
}

const submit = ({ user }: View, drawer: HTMLElement) =>
  user.click(within(drawer).getByRole("button", { name: "Link number" }));

describe("link a WhatsApp number", () => {
  it("offers WhatsApp number after Twilio number in the Link number menu", async () => {
    const view = setup();
    await screen.findByText("+1 829 555 0199");
    await view.user.click(screen.getByRole("button", { name: "Link number" }));
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual([
      "Twilio number",
      "WhatsApp number"
    ]);
    await view.user.click(items[1]);
    expect(
      await screen.findByRole("dialog", { name: "Link WhatsApp number" })
    ).toBeInTheDocument();
  });

  it("opens the drawer from ?link=whatsapp, and nothing from ?link=other", async () => {
    setup({ route: "/w/ws-1/numbers?link=whatsapp" });
    expect(
      await screen.findByRole("dialog", { name: "Link WhatsApp number" })
    ).toBeInTheDocument();
  });

  it("opens nothing from ?link=other", async () => {
    setup({ route: "/w/ws-1/numbers?link=other" });
    await screen.findByText("+1 829 555 0199");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks for a Meta access token by default, with its notes, and no Number field", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    expect(
      form.getByRole("radio", { name: "Meta access token" })
    ).toHaveAttribute("aria-checked", "true");
    expect(form.getByLabelText("Phone number ID")).toBeInTheDocument();
    expect(form.getByLabelText("Access token")).toBeInTheDocument();
    expect(form.queryByLabelText("Number")).not.toBeInTheDocument();
    expect(
      form.getByText(
        "Fonoster uses the token once to turn on SIP calling for this number, point it at Fonoster and read the SIP password, then discards it."
      )
    ).toBeInTheDocument();
    expect(
      form.getByText(
        "A number already in your workspace moves to its WhatsApp trunk and the route you choose."
      )
    ).toBeInTheDocument();

    await view.user.click(form.getByRole("radio", { name: "SIP password" }));
    expect(form.getByLabelText("Number")).toBeInTheDocument();
    expect(form.getByLabelText("SIP password")).toBeInTheDocument();
    expect(form.queryByLabelText("Access token")).not.toBeInTheDocument();
    expect(
      form.getByText(
        "Fonoster calls no Meta API on this side. Register the SIP server it gives you and set SRTP to SDES in Meta's call settings; the guide shows how."
      )
    ).toBeInTheDocument();
  });

  it("links with a token: sends the Meta fields, the app route and no number, then shows the Done state", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    await fillToken(view, drawer);
    await view.user.type(within(drawer).getByLabelText("Name"), "Front desk");
    await submit(view, drawer);

    await waitFor(() => expect(view.linkWhatsApp).toHaveBeenCalledTimes(1));
    expect(view.linkWhatsApp).toHaveBeenCalledWith({
      phoneNumberId: PHONE_NUMBER_ID,
      accessToken: ACCESS_TOKEN,
      name: "Front desk",
      appRef: "ap-7f3c91"
    });
    const done = await screen.findByTestId("link-whatsapp-done");
    expect(done).toHaveTextContent(
      "+52 551 234 5678 (Acme Dental) is linked to Billing reminders."
    );
    expect(done).toHaveTextContent(
      `SIP calling is on for this number in WhatsApp, pointed at ${HOSTNAME}:5061 with SDES. Calls to it ring in Fonoster now.`
    );
    expect(
      within(drawer).queryByLabelText("Access token")
    ).not.toBeInTheDocument();
    await view.user.click(within(drawer).getByRole("button", { name: "Done" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("links with the SIP password: sends the number and the password, with a SIP agent route", async () => {
    const view = setup();
    view.linkWhatsApp.mockResolvedValue({
      ref: "n-linked",
      trunkRef: "tk-whatsapp",
      sipServerHostname: HOSTNAME,
      sipServerPort: 5061,
      sipPasswordSet: true,
      phoneNumber: "+525512345678",
      verifiedName: "",
      metaConfigured: false
    });
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    await view.user.click(form.getByRole("radio", { name: "SIP password" }));
    await view.user.type(form.getByLabelText("Number"), " +52 55 1234 5678\n");
    await view.user.click(form.getByRole("radio", { name: "SIP agent" }));
    await view.user.click(
      await form.findByRole("radio", { name: /Maria Lopez/ })
    );
    await view.user.type(
      form.getByLabelText("SIP password"),
      ` ${SIP_PASSWORD} `
    );
    await submit(view, drawer);

    await waitFor(() => expect(view.linkWhatsApp).toHaveBeenCalledTimes(1));
    expect(view.linkWhatsApp).toHaveBeenCalledWith({
      phoneNumber: "+525512345678",
      sipPassword: SIP_PASSWORD,
      agentAor: "sip:maria@acme.sip.fonoster.local"
    });
    const done = await screen.findByTestId("link-whatsapp-done");
    expect(done).toHaveTextContent(
      "+52 551 234 5678 is linked to maria · SIP agent."
    );
    expect(
      within(done).getByLabelText("SIP server to register in WhatsApp Manager")
    ).toHaveTextContent(HOSTNAME);
    expect(done).toHaveTextContent("Port 5061 · SRTP: SDES");
    expect(done).toHaveTextContent("SIP password: set");
    expect(
      within(done).getByRole("link", {
        name: "How to register it in WhatsApp Manager"
      })
    ).toHaveAttribute(
      "href",
      "https://docs.fonoster.com/telephony/link-whatsapp#point-meta-at-fonoster"
    );
  });

  it("sends no sipPassword key when the field is empty, and says the password is not set yet", async () => {
    const view = setup();
    view.linkWhatsApp.mockResolvedValue({
      ref: "n-linked",
      trunkRef: "tk-whatsapp",
      sipServerHostname: HOSTNAME,
      sipServerPort: 5061,
      sipPasswordSet: false,
      phoneNumber: "+525512345678",
      verifiedName: "",
      metaConfigured: false
    });
    const { drawer } = await openFromMenu(view);
    await fillPassword(view, drawer, { password: "" });
    await submit(view, drawer);

    await waitFor(() => expect(view.linkWhatsApp).toHaveBeenCalledTimes(1));
    expect(view.linkWhatsApp).toHaveBeenCalledWith({
      phoneNumber: "+525512345678",
      appRef: "ap-7f3c91"
    });
    expect(await screen.findByTestId("link-whatsapp-done")).toHaveTextContent(
      "SIP password: not set yet. Open Link number again with the password once you have it from Meta."
    );
  });

  it("checks the route, the phone number ID and the token before calling", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    await view.user.type(form.getByLabelText("Phone number ID"), "abc");
    await submit(view, drawer);

    expect(await form.findByText("Choose where calls go.")).toBeInTheDocument();
    expect(
      form.getByText("Enter the phone number ID from WhatsApp Manager.")
    ).toBeInTheDocument();
    expect(form.getByText("Enter the access token.")).toBeInTheDocument();
    expect(view.linkWhatsApp).not.toHaveBeenCalled();
  });

  it("checks the number on the SIP password side before calling", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    await fillPassword(view, drawer, { number: "12345" });
    await submit(view, drawer);

    expect(
      await within(drawer).findByText(
        "Enter the number in E.164 format, e.g. +525512345678"
      )
    ).toBeInTheDocument();
    expect(within(drawer).getByLabelText("Number")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(view.linkWhatsApp).not.toHaveBeenCalled();
  });

  it("holds the drawer while linking", async () => {
    const view = setup();
    view.linkWhatsApp.mockImplementation(() => new Promise(() => {}));
    const { drawer } = await openFromMenu(view);
    await fillToken(view, drawer);
    await submit(view, drawer);

    const form = within(drawer);
    const button = await form.findByRole("button", { name: "Linking…" });
    expect(form.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await view.user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await view.user.click(button);
    expect(view.linkWhatsApp).toHaveBeenCalledTimes(1);
  });

  it("shows a refused token on the Access token field and keeps every value", async () => {
    const view = setup();
    view.linkWhatsApp.mockRejectedValue(
      grpcError(
        GrpcCode.FAILED_PRECONDITION,
        "Meta didn't accept this access token"
      )
    );
    const { drawer } = await openFromMenu(view);
    await fillToken(view, drawer);
    await submit(view, drawer);

    const form = within(drawer);
    expect(
      await form.findByText("Meta didn't accept this access token")
    ).toBeInTheDocument();
    expect(form.getByLabelText("Access token")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await waitFor(() =>
      expect(form.getByLabelText("Access token")).toHaveFocus()
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(form.getByLabelText("Phone number ID")).toHaveValue(PHONE_NUMBER_ID);
    expect(form.getByLabelText("Access token")).toHaveValue(ACCESS_TOKEN);
  });

  it("shows an unreachable phone number ID on its field", async () => {
    const view = setup();
    const text = `No WhatsApp number with id ${PHONE_NUMBER_ID} is reachable with this access token`;
    view.linkWhatsApp.mockRejectedValue(
      grpcError(GrpcCode.FAILED_PRECONDITION, text)
    );
    const { drawer } = await openFromMenu(view);
    await fillToken(view, drawer);
    await submit(view, drawer);

    const form = within(drawer);
    expect(await form.findByText(text)).toBeInTheDocument();
    expect(form.getByLabelText("Phone number ID")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await waitFor(() =>
      expect(form.getByLabelText("Phone number ID")).toHaveFocus()
    );
  });

  it("shows a number linked elsewhere on Number (SIP password side) and as an alert (token side)", async () => {
    const text = "+525512345678 is already linked in another workspace";
    const view = setup();
    view.linkWhatsApp.mockRejectedValue(
      grpcError(GrpcCode.FAILED_PRECONDITION, text)
    );
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    await fillPassword(view, drawer);
    await submit(view, drawer);
    expect(await form.findByText(text)).toBeInTheDocument();
    expect(form.getByLabelText("Number")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    await waitFor(() => expect(form.getByLabelText("Number")).toHaveFocus());

    await view.user.click(
      form.getByRole("radio", { name: "Meta access token" })
    );
    await view.user.type(
      form.getByLabelText("Phone number ID"),
      PHONE_NUMBER_ID
    );
    await view.user.type(form.getByLabelText("Access token"), ACCESS_TOKEN);
    await submit(view, drawer);
    const alert = await form.findByRole("alert");
    expect(alert).toHaveTextContent(text);
    await waitFor(() => expect(alert).toHaveFocus());
  });

  it.each([
    [
      "the install has no TLS address",
      grpcError(
        GrpcCode.FAILED_PRECONDITION,
        "This install has no public SIP over TLS address for WhatsApp to send calls to"
      ),
      "This install has no public SIP over TLS address for WhatsApp to send calls to"
    ],
    [
      "the host is in use",
      grpcError(GrpcCode.FAILED_PRECONDITION, `${HOSTNAME} is already in use`),
      `${HOSTNAME} is already in use`
    ],
    [
      "the token lacks the permission",
      grpcError(
        GrpcCode.FAILED_PRECONDITION,
        "This access token can't manage WhatsApp calling settings; use a System User token with whatsapp_business_management"
      ),
      "This access token can't manage WhatsApp calling settings; use a System User token with whatsapp_business_management"
    ],
    [
      "Meta is unavailable",
      grpcError(GrpcCode.UNAVAILABLE, "Meta is unavailable; try again"),
      "Meta is unavailable; try again"
    ],
    [
      "the API is unreachable",
      grpcError(GrpcCode.UNAVAILABLE, "upstream connect error"),
      "Can't reach the Fonoster API. Check your connection and try again."
    ]
  ])(
    "shows a form alert when %s, and refreshes the lists",
    async (_, error, text) => {
      const view = setup();
      view.linkWhatsApp.mockRejectedValue(error);
      const { drawer } = await openFromMenu(view);
      await waitFor(() =>
        expect(view.sdk.trunks.listTrunks).toHaveBeenCalledTimes(1)
      );
      await fillToken(view, drawer);
      await submit(view, drawer);

      const alert = await within(drawer).findByRole("alert");
      expect(alert).toHaveTextContent(text);
      await waitFor(() => expect(alert).toHaveFocus());
      expect(within(drawer).getByLabelText("Access token")).toHaveValue(
        ACCESS_TOKEN
      );
      await waitFor(() =>
        expect(view.sdk.trunks.listTrunks).toHaveBeenCalledTimes(2)
      );
    }
  );

  it("refreshes the numbers and trunks after a link, and lists the number on its WhatsApp trunk", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    await waitFor(() =>
      expect(view.sdk.trunks.listTrunks).toHaveBeenCalledTimes(1)
    );
    const listNumbers = view.sdk.numbers.listNumbers as unknown as Mock;
    const before = listNumbers.mock.calls.length;
    view.sdk.numbers.listNumbers.mockResolvedValue({
      items: [
        {
          ref: "n-linked",
          name: "Acme Dental",
          telUrl: "tel:+525512345678",
          appRef: "ap-7f3c91",
          trunk: { ref: "tk-whatsapp", name: "WhatsApp Trunk +525512345678" }
        }
      ]
    });
    await fillToken(view, drawer);
    await submit(view, drawer);

    await screen.findByTestId("link-whatsapp-done");
    await view.user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(view.sdk.trunks.listTrunks).toHaveBeenCalledTimes(2)
    );
    await waitFor(() =>
      expect(listNumbers.mock.calls.length).toBeGreaterThan(before)
    );
    const table = screen.getByRole("table", { name: "Numbers" });
    const row = within(
      (await within(table).findByText("+52 551 234 5678")).closest("tr")!
    );
    expect(row.getByText("WhatsApp Trunk +525512345678")).toBeInTheDocument();
  });

  it("forgets the token and the password when the drawer closes", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    await view.user.type(form.getByLabelText("Access token"), ACCESS_TOKEN);
    await view.user.click(form.getByRole("radio", { name: "SIP password" }));
    await view.user.type(form.getByLabelText("SIP password"), SIP_PASSWORD);
    await view.user.click(form.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );

    const { drawer: again } = await openFromMenu(view);
    const reopened = within(again);
    expect(reopened.getByLabelText("Access token")).toHaveValue("");
    await view.user.click(
      reopened.getByRole("radio", { name: "SIP password" })
    );
    expect(reopened.getByLabelText("SIP password")).toHaveValue("");
    const stored = JSON.stringify({ ...localStorage, ...sessionStorage });
    expect(stored).not.toContain(ACCESS_TOKEN);
    expect(stored).not.toContain(SIP_PASSWORD);
    expect(window.location.href).not.toContain(ACCESS_TOKEN);
    expect(window.location.href).not.toContain(SIP_PASSWORD);
  });

  it("keeps password managers away from the secrets and labels their toggles", async () => {
    const view = setup();
    const { drawer } = await openFromMenu(view);
    const form = within(drawer);
    expect(form.getByLabelText("Access token")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(
      form.getByRole("button", { name: "Show access token" })
    ).toBeInTheDocument();
    await view.user.click(form.getByRole("radio", { name: "SIP password" }));
    expect(form.getByLabelText("SIP password")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(
      form.getByRole("button", { name: "Show SIP password" })
    ).toBeInTheDocument();
  });

  it("keeps the Twilio drawer as it was", async () => {
    const view = setup();
    await screen.findByText("+1 829 555 0199");
    await view.user.click(screen.getByRole("button", { name: "Link number" }));
    await view.user.click(
      await screen.findByRole("menuitem", { name: "Twilio number" })
    );
    expect(
      await screen.findByRole("dialog", { name: "Link Twilio number" })
    ).toBeInTheDocument();
  });
});
