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
import type { Capabilities } from "~/lib/client";
import { communityCapabilities, regionsCapabilities } from "~/lib/fixtures";
import { WorkspaceProvider } from "~/lib/workspace";
import { fakeSdk } from "~/numbers/fixtures";
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import { testWorkspace } from "~/test/workspace";
import TrunksScreen from "./index";

beforeAll(() => {
  // Radix Select needs these in jsdom.
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

function setup(
  route = "/w/ws1/trunks",
  data?: Parameters<typeof fakeSdk>[1],
  capabilities: Capabilities = regionsCapabilities
) {
  const sdk = fakeSdk(vi.fn as never, data);
  const auth = fakeAuth({ status: "signedIn", sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <TrunksScreen />
    </WorkspaceProvider>,
    { path: "/w/:workspaceRef/trunks/*", route, auth, capabilities }
  );
  return { ...view, sdk };
}

const row = (text: string) => within(screen.getByText(text).closest("tr")!);

describe("trunks list", () => {
  it("shows inbound, outbound, security and number counts", async () => {
    setup();
    await screen.findByText("tk-31a0c2");
    const claro = row("tk-31a0c2");
    expect(claro.getByText("claro.pstn.fonoster.local")).toBeInTheDocument();
    expect(claro.getByText("sip.claro.com.do · UDP +1")).toBeInTheDocument();
    expect(claro.getByText("ACL")).toBeInTheDocument();
    expect(claro.getByText("Credentials")).toBeInTheDocument();
    expect(claro.queryByText("REGISTER")).not.toBeInTheDocument();
    expect(await claro.findByText("3")).toBeInTheDocument();

    const altice = row("tk-77d9e1");
    expect(
      altice.getByText("pbx.altice.com.do:5061 · TLS")
    ).toBeInTheDocument();
    expect(altice.getByText("REGISTER")).toBeInTheDocument();
    expect(altice.getByText("2")).toBeInTheDocument();

    const telnyx = row("tk-0b5f48");
    expect(telnyx.getByText("ACL")).toBeInTheDocument();
    expect(telnyx.getByText("0")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    setup("/w/ws1/trunks", { trunks: [] });
    expect(await screen.findByText("No trunks yet")).toBeInTheDocument();
  });

  it("opens a trunk's page from its row", async () => {
    const { user, sdk } = setup();
    await user.click(await screen.findByText("Claro"));
    expect(
      await screen.findByRole("heading", { name: "Claro" })
    ).toBeInTheDocument();
    expect(sdk.trunks.getTrunk).toHaveBeenCalledWith("tk-31a0c2");
    expect(
      await screen.findByText("tk-31a0c2 · 3 numbers ride on this trunk")
    ).toBeInTheDocument();
    const numbers = screen.getByRole("region", {
      name: "Numbers on this trunk"
    });
    expect(within(numbers).getByText("+1 829 555 0199")).toBeInTheDocument();
    expect(within(numbers).queryByText("+1 809 555 0177")).toBeNull();
  });
});

describe("trunk page", () => {
  it("tells the user where to point the carrier and what to allowlist", async () => {
    setup("/w/ws1/trunks/new");
    expect(await screen.findByTestId("carrier-hint")).toHaveTextContent(
      "Point your carrier at sip.us-east-1.fonoster.com:5060 (UDP); allowlist 198.51.100.1, 198.51.100.2."
    );
  });

  it("takes the carrier hint from the deployment's capabilities without private regions", async () => {
    const { sdk } = setup(
      "/w/ws1/trunks/new",
      undefined,
      communityCapabilities
    );
    expect(await screen.findByTestId("carrier-hint")).toHaveTextContent(
      "Point your carrier at 192.0.2.10:5060 (UDP); allowlist 192.0.2.10."
    );
    expect(sdk.regions.getRegion).not.toHaveBeenCalled();
  });

  it("shows no carrier hint when the deployment lists no SIP address", async () => {
    setup("/w/ws1/trunks/new", undefined, {
      ...communityCapabilities,
      connection: { sip: [], signalingAddresses: [], mediaAddresses: [] }
    });
    await screen.findByRole("button", { name: /save|create/i });
    expect(screen.queryByTestId("carrier-hint")).toBeNull();
  });

  it("edits outbound URIs and security, then saves", async () => {
    const { user, sdk } = setup("/w/ws1/trunks/tk-31a0c2");
    await screen.findByRole("heading", { name: "Claro" });
    await vi.waitFor(() =>
      expect(screen.getByLabelText("Access control list")).toHaveTextContent(
        "Claro signaling IPs"
      )
    );

    const host2 = screen.getByLabelText("Host, URI 2");
    await user.clear(host2);
    await user.type(host2, "backup.claro.com.do");
    await user.click(screen.getByLabelText("Enabled, URI 1"));
    await user.click(screen.getByRole("button", { name: "Add URI" }));
    await user.type(screen.getByLabelText("Host, URI 3"), "10.0.0.5");
    await user.clear(screen.getByLabelText("Port, URI 3"));
    await user.type(screen.getByLabelText("Port, URI 3"), "5080");
    await user.click(screen.getByLabelText("Transport, URI 3"));
    await user.click(await screen.findByRole("option", { name: "TCP" }));

    await user.click(screen.getByLabelText("Inbound credentials"));
    await user.click(
      await screen.findByRole("option", { name: /altice-acme/ })
    );
    await user.click(screen.getByLabelText("Access control list"));
    await user.click(await screen.findByRole("option", { name: "None" }));
    await user.click(screen.getByRole("switch", { name: "Send REGISTER" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sdk.trunks.updateTrunk).toHaveBeenCalledWith({
      ref: "tk-31a0c2",
      name: "Claro",
      inboundUri: "claro.pstn.fonoster.local",
      sendRegister: true,
      accessControlListRef: undefined,
      inboundCredentialsRef: "cr2",
      outboundCredentialsRef: "cr1",
      uris: [
        {
          host: "sip.claro.com.do",
          port: 5060,
          transport: "UDP",
          user: "acme",
          priority: 1,
          weight: 10,
          enabled: false
        },
        {
          host: "backup.claro.com.do",
          port: 5060,
          transport: "UDP",
          user: "acme",
          priority: 2,
          weight: 10,
          enabled: true
        },
        {
          host: "10.0.0.5",
          port: 5080,
          transport: "TCP",
          priority: 3,
          weight: 10,
          enabled: true
        }
      ]
    });
  });

  it("removes a URI and flags an invalid one", async () => {
    const { user, sdk } = setup("/w/ws1/trunks/tk-31a0c2");
    await screen.findByRole("heading", { name: "Claro" });
    await user.click(screen.getByRole("button", { name: "Remove URI 2" }));
    expect(screen.queryByLabelText("Host, URI 2")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Host, URI 1"));
    await user.type(screen.getByLabelText("Host, URI 1"), "not a host");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(/URI 1: host:/)).toBeInTheDocument();
    expect(sdk.trunks.updateTrunk).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Host, URI 1"));
    await user.type(screen.getByLabelText("Host, URI 1"), "sip.claro.com.do");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(sdk.trunks.updateTrunk).toHaveBeenCalledWith(
      expect.objectContaining({
        uris: [expect.objectContaining({ host: "sip.claro.com.do" })]
      })
    );
  });

  it("says when the inbound URI is taken", async () => {
    const { user, sdk } = setup("/w/ws1/trunks/new");
    (
      sdk.trunks.createTrunk as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(grpcError(6, "exists"));
    await user.type(await screen.findByLabelText("Name"), "Claro");
    await user.clear(screen.getByLabelText("Inbound URI"));
    await user.type(screen.getByLabelText("Inbound URI"), "claro-rd");
    await user.type(screen.getByLabelText("Host, URI 1"), "sip.claro.com.do");
    await user.click(screen.getByRole("button", { name: "Create trunk" }));
    expect(sdk.trunks.createTrunk).toHaveBeenCalledWith(
      expect.objectContaining({ inboundUri: "claro-rd.pstn.fonoster.local" })
    );
    expect(
      await screen.findByText("That inbound URI is taken. Pick another.")
    ).toBeInTheDocument();
  });

  it("moves an older trunk's inbound URI under the install's root", async () => {
    setup("/w/ws1/trunks/tk-old", {
      trunks: [
        {
          ref: "tk-old",
          name: "Old carrier",
          inboundUri: "claro.com",
          sendRegister: false,
          uris: []
        }
      ]
    });
    expect(await screen.findByLabelText("Inbound URI")).toHaveValue("claro");
    expect(
      screen.getByText(
        /Was claro\.com\. Saving moves it under pstn\.fonoster\.local/
      )
    ).toBeInTheDocument();
  });

  it("takes any host when the install allows it", async () => {
    const { user, sdk } = setup("/w/ws1/trunks/new", undefined, {
      ...regionsCapabilities,
      sip: { names: "any" }
    });
    await user.type(await screen.findByLabelText("Name"), "Lab");
    await user.type(screen.getByLabelText("Inbound URI"), "10.0.0.5");
    await user.type(screen.getByLabelText("Host, URI 1"), "10.0.0.9");
    await user.click(screen.getByRole("button", { name: "Create trunk" }));
    expect(sdk.trunks.createTrunk).toHaveBeenCalledWith(
      expect.objectContaining({ inboundUri: "10.0.0.5" })
    );
  });

  it("creates a trunk and opens it", async () => {
    const { user, sdk } = setup("/w/ws1/trunks/new");
    expect(
      await screen.findByRole("heading", { name: "New trunk" })
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Name"), "Twilio");
    // The label follows the name; the install's .sip.<domain> is fixed.
    expect(screen.getByLabelText("Inbound URI")).toHaveValue("twilio");
    expect(screen.getByText(".pstn.fonoster.local")).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Host, URI 1"),
      "acme.pstn.twilio.com"
    );
    await user.click(screen.getByRole("button", { name: "Create trunk" }));

    expect(sdk.trunks.createTrunk).toHaveBeenCalledWith({
      name: "Twilio",
      inboundUri: "twilio.pstn.fonoster.local",
      sendRegister: false,
      accessControlListRef: undefined,
      inboundCredentialsRef: undefined,
      outboundCredentialsRef: undefined,
      uris: [
        {
          host: "acme.pstn.twilio.com",
          port: 5060,
          transport: "UDP",
          priority: 1,
          weight: 10,
          enabled: true
        }
      ]
    });
    await vi.waitFor(() =>
      expect(sdk.trunks.getTrunk).toHaveBeenCalledWith("tk-new")
    );
  });

  it("deletes the trunk and goes back to the list", async () => {
    const { user, sdk } = setup("/w/ws1/trunks/tk-0b5f48");
    await screen.findByRole("heading", { name: "Telnyx EU" });
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/to confirm/), "DELETE");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(sdk.trunks.deleteTrunk).toHaveBeenCalledWith("tk-0b5f48");
    expect(
      await screen.findByRole("heading", { name: "Trunks" })
    ).toBeInTheDocument();
  });

  it("links back to the list from the breadcrumb", async () => {
    const { user } = setup("/w/ws1/trunks/tk-31a0c2");
    await screen.findByRole("heading", { name: "Claro" });
    await user.click(screen.getByRole("link", { name: "Trunks" }));
    expect(
      await screen.findByRole("heading", { name: "Trunks" })
    ).toBeInTheDocument();
  });
});
