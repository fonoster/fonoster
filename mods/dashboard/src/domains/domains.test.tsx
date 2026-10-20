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
import DomainsScreen from ".";
import { toDomainRow } from "./domains.service";

// jsdom lacks these; Radix Select uses them.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const acmeHq = {
  ref: "dm-1f02aa",
  name: "Acme HQ",
  domainUri: "acme.fonoster.local",
  accessControlList: { ref: "acl-1", name: "Office network" },
  egressPolicies: [{ rule: ".*", numberRef: "nb-1" }]
};

function setup(items: object[] = []) {
  const domains = {
    listDomains: vi.fn().mockResolvedValue({ items }),
    createDomain: vi.fn().mockResolvedValue({ ref: "dm-new" }),
    updateDomain: vi.fn().mockResolvedValue({ ref: "dm-1f02aa" }),
    deleteDomain: vi.fn().mockResolvedValue({ ref: "dm-1f02aa" })
  };
  const acls = {
    listAcls: vi.fn().mockResolvedValue({
      items: [
        { ref: "acl-1", name: "Office network" },
        { ref: "acl-2", name: "Madrid office" }
      ]
    })
  };
  const numbers = {
    listNumbers: vi.fn().mockResolvedValue({
      items: [
        { ref: "nb-1", name: "Main line", telUrl: "tel:+18095550100" },
        { ref: "nb-2", name: "Madrid", telUrl: "tel:+34910555210" }
      ]
    })
  };
  const auth = fakeAuth({
    status: "signedIn",
    sdk: { domains, acls, numbers } as never
  });
  const view = renderScreen(
    <WorkspaceProvider value={testWorkspace}>
      <DomainsScreen />
    </WorkspaceProvider>,
    { auth }
  );
  return { ...view, domains };
}

describe("Domains", () => {
  it("lists domains with their ACL and egress rules", async () => {
    setup([acmeHq]);
    const table = await screen.findByRole("table", { name: "Domains" });
    expect(await within(table).findByText("Acme HQ")).toBeInTheDocument();
    expect(within(table).getByText("acme.fonoster.local")).toBeInTheDocument();
    expect(within(table).getByText("Office network")).toBeInTheDocument();
    expect(await within(table).findByText(/\+18095550100/)).toBeInTheDocument();
    expect(
      screen.getByText(/Egress rules pick the caller ID/)
    ).toBeInTheDocument();
  });

  it("reads nested protobuf messages the SDK hands back", () => {
    const row = toDomainRow({
      ref: "d",
      name: "D",
      domainUri: "d.fonoster.local",
      accessControlList: { toObject: () => ({ ref: "a", name: "ACL" }) },
      egressPoliciesList: [
        { toObject: () => ({ rule: "^\\+1", numberRef: "n" }) }
      ]
    } as never);
    expect(row.accessControlList).toEqual({ ref: "a", name: "ACL" });
    expect(row.egressPolicies).toEqual([{ rule: "^\\+1", numberRef: "n" }]);
  });

  it("shows the empty state with an add action", async () => {
    setup([]);
    expect(await screen.findByText("No domains yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create domain" })
    ).toBeInTheDocument();
  });

  it("validates the URI against the root domain", async () => {
    const { user, domains } = setup([]);
    await user.click(
      await screen.findByRole("button", { name: "Create domain" })
    );
    await user.type(screen.getByLabelText("Name"), "Acme");
    await user.type(screen.getByLabelText("Domain URI"), "acme.example.com");
    await user.click(screen.getByRole("button", { name: "Create domain" }));
    expect(
      await screen.findByText("Must end with fonoster.local")
    ).toBeInTheDocument();
    expect(domains.createDomain).not.toHaveBeenCalled();
  });

  it("creates a domain with an ACL and egress rules", async () => {
    const { user, domains } = setup([]);
    await user.click(
      await screen.findByRole("button", { name: "Create domain" })
    );
    await user.type(screen.getByLabelText("Name"), "Acme HQ");
    await user.type(screen.getByLabelText("Domain URI"), "acme.fonoster.local");
    await user.click(screen.getByLabelText("Access control list"));
    await user.click(
      await screen.findByRole("option", { name: "Office network" })
    );

    await user.click(screen.getByRole("button", { name: /Add rule/ }));
    await user.click(screen.getByRole("button", { name: "Create domain" }));
    expect(await screen.findByText("Enter a pattern")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Rule 1 pattern"), "^[[+]34");
    await user.click(screen.getByLabelText("Rule 1 number"));
    await user.click(
      await screen.findByRole("option", { name: /\+34910555210/ })
    );
    await user.click(screen.getByRole("button", { name: "Create domain" }));

    expect(domains.createDomain).toHaveBeenCalledWith({
      name: "Acme HQ",
      domainUri: "acme.fonoster.local",
      accessControlListRef: "acl-1",
      egressPolicies: [{ rule: "^[+]34", numberRef: "nb-2" }]
    });
  });

  it("edits a domain, removing a rule, without touching the URI", async () => {
    const { user, domains } = setup([acmeHq]);
    await user.click(await screen.findByText("Acme HQ"));
    expect(screen.getByLabelText("Domain URI")).toBeDisabled();
    expect(screen.getByLabelText("Rule 1 pattern")).toHaveValue(".*");
    await user.click(screen.getByRole("button", { name: "Remove rule 1" }));
    await user.click(screen.getByLabelText("Access control list"));
    await user.click(await screen.findByRole("option", { name: "None" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(domains.updateDomain).toHaveBeenCalledWith({
      ref: "dm-1f02aa",
      name: "Acme HQ",
      accessControlListRef: "",
      egressPolicies: []
    });
  });

  it("asks before deleting", async () => {
    const { user, domains } = setup([acmeHq]);
    await user.click(
      await screen.findByRole("button", { name: "Actions for Acme HQ" })
    );
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(
      screen.getByRole("heading", { name: "Delete Acme HQ?" })
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/to confirm/), "DELETE");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(domains.deleteDomain).toHaveBeenCalledWith("dm-1f02aa");
  });
});
