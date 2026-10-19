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
import { isAllowedEntry, isIPv4OrCidr, isIPv6OrCidr } from "./cidr";
import AclsScreen from "./index";

const acls = [
  {
    ref: "acl-1",
    name: "Claro signaling IPs",
    allow: ["190.80.12.0/24", "190.80.13.4/32"]
  },
  {
    ref: "acl-2",
    name: "Twilio",
    allow: ["54.172.60.0/30", "54.244.51.0/30", "1.1.1.1", "2.2.2.2"]
  },
  { ref: "acl-3", name: "Office network", allow: ["10.0.0.0/16"] }
];

function setup({
  items = acls,
  trunks = [
    { ref: "t1", name: "Claro", accessControlList: { ref: "acl-1" } },
    { ref: "t2", name: "Twilio", accessControlListRef: "acl-2" }
  ] as object[],
  trunksFail = false
} = {}) {
  const sdk = {
    acls: {
      listAcls: vi.fn().mockResolvedValue({ items }),
      createAcl: vi.fn().mockResolvedValue({ ref: "acl-new" }),
      updateAcl: vi.fn().mockResolvedValue({ ref: "acl-1" }),
      deleteAcl: vi.fn().mockResolvedValue(undefined)
    },
    trunks: {
      listTrunks: trunksFail
        ? vi.fn().mockRejectedValue(new Error("nope"))
        : vi.fn().mockResolvedValue({ items: trunks })
    },
    domains: {
      listDomains: vi.fn().mockResolvedValue({
        items: [
          { ref: "d1", name: "Acme HQ", accessControlList: { ref: "acl-3" } }
        ]
      })
    }
  };
  const auth = fakeAuth({ sdk: sdk as never });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <AclsScreen />
    </WorkspaceProvider>,
    { auth }
  );
  return { ...view, sdk };
}

describe("cidr", () => {
  it.each([
    ["10.0.0.0/16", true],
    ["190.80.13.4/32", true],
    ["8.8.8.8", true],
    ["0.0.0.0/0", true],
    ["256.1.1.1", false],
    ["10.0.0.0/33", false],
    ["10.0.0/8", false],
    ["10.0.0.0/", false],
    ["hello", false]
  ])("IPv4 %s → %s", (value, ok) => {
    expect(isIPv4OrCidr(value)).toBe(ok);
  });

  it.each([
    ["2001:db8::/32", true],
    ["::1", true],
    ["::ffff:10.0.0.1", true],
    ["fe80::1:2:3:4/64", true],
    ["2001:db8::1::2", false],
    ["2001:db8::/129", false],
    ["12345::", false]
  ])("IPv6 %s → %s", (value, ok) => {
    expect(isIPv6OrCidr(value)).toBe(ok);
  });

  it("only allows what the API accepts (IPv4)", () => {
    expect(isAllowedEntry("10.0.0.0/8")).toBe(true);
    expect(isAllowedEntry("2001:db8::/32")).toBe(false);
  });
});

describe("ACLs screen", () => {
  it("lists ACLs with their ranges and what uses them", async () => {
    setup();
    await screen.findByText("Claro signaling IPs");
    const table = screen.getByRole("table", { name: "Access control lists" });
    const claro = within(table).getByText("Claro signaling IPs").closest("tr")!;
    expect(within(claro).getByText("190.80.12.0/24")).toBeInTheDocument();
    expect(await within(claro).findByText("Trunk · Claro")).toBeInTheDocument();

    const twilio = within(table)
      .getByText("Twilio", { selector: "span.font-medium" })
      .closest("tr")!;
    expect(within(twilio).getByText("+2")).toBeInTheDocument();
    expect(within(twilio).queryByText("1.1.1.1")).not.toBeInTheDocument();
    expect(within(twilio).getByText("Trunk · Twilio")).toBeInTheDocument();

    const office = within(table).getByText("Office network").closest("tr")!;
    expect(
      await within(office).findByText("Domain · Acme HQ")
    ).toBeInTheDocument();
  });

  it("shows — for Used by when trunks can't be listed", async () => {
    setup({ trunksFail: true });
    const row = (await screen.findByText("Claro signaling IPs")).closest("tr")!;
    expect(within(row).getByText("—")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    setup({ items: [] });
    expect(await screen.findByText("No ACLs yet")).toBeInTheDocument();
  });

  it("creates an ACL with its allow list", async () => {
    const { user, sdk } = setup({ items: [] });
    await user.click(await screen.findByRole("button", { name: /Create ACL/ }));
    await user.type(screen.getByLabelText("Name"), "Carrier");
    await user.type(
      screen.getByLabelText("Allowed address 1"),
      "190.80.12.0/24"
    );
    await user.click(screen.getByRole("button", { name: /Add address/ }));
    await user.type(screen.getByLabelText("Allowed address 2"), "8.8.8.8");
    await user.click(screen.getByRole("button", { name: "Create ACL" }));

    expect(sdk.acls.createAcl).toHaveBeenCalledWith({
      name: "Carrier",
      allow: ["190.80.12.0/24", "8.8.8.8"]
    });
  });

  it("rejects entries that aren't IPv4 addresses or ranges", async () => {
    const { user, sdk } = setup({ items: [] });
    await user.click(await screen.findByRole("button", { name: /Create ACL/ }));
    await user.type(screen.getByLabelText("Name"), "Carrier");
    await user.type(screen.getByLabelText("Allowed address 1"), "10.0.0.0/40");
    await user.click(screen.getByRole("button", { name: "Create ACL" }));

    expect(
      await screen.findByText(/Use an IPv4 address or range/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Allowed address 1")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(sdk.acls.createAcl).not.toHaveBeenCalled();
  });

  it("updates an ACL, removing an entry", async () => {
    const { user, sdk } = setup();
    await user.click(await screen.findByText("Claro signaling IPs"));
    expect(await screen.findByLabelText("Allowed address 2")).toHaveValue(
      "190.80.13.4/32"
    );
    await user.click(
      screen.getByRole("button", { name: "Remove allowed address 1" })
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sdk.acls.updateAcl).toHaveBeenCalledWith({
      ref: "acl-1",
      name: "Claro signaling IPs",
      allow: ["190.80.13.4/32"],
      deny: ["0.0.0.0/0"]
    });
  });

  it("warns before deleting an ACL that's in use", async () => {
    const { user, sdk } = setup();
    await user.click(await screen.findByText("Claro signaling IPs"));
    await screen.findByText("Trunk · Claro", { selector: "p" });
    await user.click(screen.getByRole("button", { name: "Delete ACL" }));

    const dialog = await screen.findByRole("dialog", {
      name: "Delete Claro signaling IPs?"
    });
    expect(
      within(dialog).getByText(/It's attached to Trunk · Claro/)
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(sdk.acls.deleteAcl).toHaveBeenCalledWith("acl-1");
  });
});
