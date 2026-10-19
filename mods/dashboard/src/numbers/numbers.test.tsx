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
import { fakeSdk } from "./fixtures";
import NumbersScreen from "./index";
import { formatNumber, toTelUrl } from "./routing";

beforeAll(() => {
  // Radix Select needs these in jsdom.
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

function setup(data?: Parameters<typeof fakeSdk>[1]) {
  const sdk = fakeSdk(vi.fn as never, data);
  const auth = fakeAuth({ status: "signedIn", sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <NumbersScreen />
    </WorkspaceProvider>,
    { path: "/w/:workspaceRef/numbers", route: "/w/ws1/numbers", auth }
  );
  return { ...view, sdk };
}

describe("numbers", () => {
  it("lists numbers with where they route, trunk and location", async () => {
    setup();
    await screen.findByText("+1 829 555 0199");
    const table = screen.getByRole("table", { name: "Numbers" });
    const row = (text: string) =>
      within(within(table).getByText(text).closest("tr")!);
    expect(
      await row("+1 829 555 0199").findByText("Billing reminders")
    ).toBeInTheDocument();
    expect(row("+1 829 555 0199").getByText("Claro")).toBeInTheDocument();
    expect(
      row("+1 829 555 0199").getByText("Santo Domingo, DO")
    ).toBeInTheDocument();
    expect(
      row("+1 415 555 0175").getByText("Order status")
    ).toBeInTheDocument();
    expect(
      row("+1 809 555 0100").getByText("maria · SIP agent")
    ).toBeInTheDocument();
    expect(row("+1 809 555 0188").getByText("Not routed")).toBeInTheDocument();
  });

  it("shows the empty state when there are no numbers", async () => {
    setup({ numbers: [] });
    expect(await screen.findByText("No numbers yet")).toBeInTheDocument();
  });

  it("reroutes a number to a SIP agent", async () => {
    const { user, sdk } = setup();
    await user.click(await screen.findByText("Billing inbound"));
    const drawer = await screen.findByRole("dialog");
    expect(
      within(drawer).getByText("Altice trunk · Santo Domingo, DO")
    ).toBeInTheDocument();
    // Opens on the current route.
    expect(
      within(drawer).getByRole("radio", { name: /Billing reminders/ })
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(drawer).getByText("ap-7f3c91 · 1 other number")
    ).toBeInTheDocument();

    await user.click(within(drawer).getByRole("radio", { name: "SIP agent" }));
    await user.type(within(drawer).getByLabelText("Search SIP agents"), "ju");
    expect(within(drawer).queryByText("Maria Lopez")).not.toBeInTheDocument();
    await user.click(within(drawer).getByRole("radio", { name: /Juan Perez/ }));
    await user.click(within(drawer).getByRole("button", { name: "Save" }));

    expect(sdk.numbers.updateNumber).toHaveBeenCalledWith({
      ref: "n2",
      name: "Billing inbound",
      trunkRef: "tk-77d9e1",
      agentAor: "sip:juan@acme.sip.fonoster.io"
    });
  });

  it("sends a number to an app", async () => {
    const { user, sdk } = setup();
    await user.click(await screen.findByText("Spare"));
    const drawer = await screen.findByRole("dialog");
    await user.click(within(drawer).getByRole("radio", { name: "App" }));
    expect(
      within(drawer).getByPlaceholderText("Search apps")
    ).toBeInTheDocument();
    expect(
      within(drawer).queryByText("Billing reminders")
    ).not.toBeInTheDocument();
    await user.click(
      within(drawer).getByRole("radio", { name: /Main menu IVR/ })
    );
    await user.clear(within(drawer).getByLabelText("Name"));
    await user.type(within(drawer).getByLabelText("Name"), "Main line");
    await user.click(within(drawer).getByRole("button", { name: "Save" }));
    expect(sdk.numbers.updateNumber).toHaveBeenCalledWith({
      ref: "n5",
      name: "Main line",
      trunkRef: "tk-77d9e1",
      appRef: "ap-55e2f0"
    });
  });

  it("adds a number routed to an agent", async () => {
    const { user, sdk } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Create number" })
    );
    const drawer = await screen.findByRole("dialog");
    await user.click(
      within(drawer).getByRole("button", { name: "Create number" })
    );
    expect(
      await within(drawer).findByText(/Enter the number in E.164 format/)
    ).toBeInTheDocument();
    expect(sdk.numbers.createNumber).not.toHaveBeenCalled();

    await user.type(within(drawer).getByLabelText("Number"), "+1 809 555 0111");
    await user.type(within(drawer).getByLabelText("Name"), "Sales");
    await user.type(within(drawer).getByLabelText("City"), "Santiago");
    await user.click(within(drawer).getByLabelText("Country"));
    await user.click(
      await screen.findByRole("option", { name: "Dominican Republic" })
    );
    await user.click(within(drawer).getByLabelText("Trunk"));
    await user.click(await screen.findByRole("option", { name: "Claro" }));
    await user.click(
      within(drawer).getByRole("radio", { name: /Appointment booking/ })
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Create number" })
    );

    expect(sdk.numbers.createNumber).toHaveBeenCalledWith({
      name: "Sales",
      telUrl: "tel:+18095550111",
      city: "Santiago",
      country: "Dominican Republic",
      countryIsoCode: "DO",
      trunkRef: "tk-31a0c2",
      appRef: "ap-c4410e"
    });
  });

  it("removes a number after confirming", async () => {
    const { user, sdk } = setup();
    await user.click(
      await screen.findByRole("button", { name: "Actions for +1 809 555 0188" })
    );
    await user.click(await screen.findByRole("menuitem", { name: /Delete/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(sdk.numbers.deleteNumber).toHaveBeenCalledWith("n5");
  });
});

describe("number formatting", () => {
  it("formats NANP numbers and normalizes input", () => {
    expect(formatNumber("tel:+18095550177")).toBe("+1 809 555 0177");
    expect(formatNumber("tel:+34910555210")).toBe("+34910555210");
    expect(toTelUrl("+1 (809) 555-0177")).toBe("tel:+18095550177");
  });
});
