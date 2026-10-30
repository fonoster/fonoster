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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Announcement } from "~/lib/announcement";
import { AnnouncementBar } from "./announcement-bar";

const upgrade: Announcement = {
  show: true,
  tone: "critical",
  lead: "The biggest update in Fonoster history.",
  text: "Move your apps to the new version.",
  cta: "Read the upgrade plan",
  link: "https://fonoster.com/upgrade"
};

const renderBar = (announcement: Announcement | null) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AnnouncementBar load={async () => announcement} />
    </QueryClientProvider>
  );

describe("AnnouncementBar", () => {
  beforeEach(() => localStorage.clear());

  it("shows the message and its link", async () => {
    renderBar(upgrade);
    const bar = await screen.findByRole("alert");
    expect(bar).toHaveTextContent(
      "The biggest update in Fonoster history. Move your apps to the new version. Read the upgrade plan"
    );
    expect(
      screen.getByRole("link", { name: "Read the upgrade plan" })
    ).toHaveAttribute("href", "https://fonoster.com/upgrade");
  });

  it("shows nothing without an announcement", async () => {
    const { container } = renderBar(null);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it("stays closed for the same message and shows a new one", async () => {
    const first = renderBar(upgrade);
    await userEvent.click(
      await screen.findByRole("button", { name: "Close the announcement" })
    );
    expect(screen.queryByRole("alert")).toBeNull();
    first.unmount();

    const again = renderBar(upgrade);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("alert")).toBeNull();
    again.unmount();

    renderBar({ ...upgrade, text: "The old version shuts down soon." });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
