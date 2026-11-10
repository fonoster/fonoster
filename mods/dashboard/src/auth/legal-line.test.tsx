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
import { LegalLine } from "./legal-line";

const terms = "https://example.com/terms";
const privacy = "https://example.com/privacy";

const renderLine = (load: () => Promise<unknown>) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LegalLine load={load} />
    </QueryClientProvider>
  );

describe("LegalLine", () => {
  it("links the Terms and the Privacy Policy in a new tab", async () => {
    renderLine(async () => ({ legal: { terms, privacy } }));
    expect(
      await screen.findByText(/By continuing, you agree to the/)
    ).toHaveTextContent(
      "By continuing, you agree to the Terms and Privacy Policy."
    );
    for (const [name, href] of [
      ["Terms", terms],
      ["Privacy Policy", privacy]
    ]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
  });

  it("names only the link that is set", async () => {
    renderLine(async () => ({ legal: { privacy } }));
    expect(
      await screen.findByText(/By continuing, you agree to the/)
    ).toHaveTextContent("By continuing, you agree to the Privacy Policy.");
    expect(screen.queryByRole("link", { name: "Terms" })).toBeNull();
  });

  it("renders nothing without links", async () => {
    const { container } = renderLine(async () => null);
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the file fails to load", async () => {
    const { container } = renderLine(() =>
      Promise.reject(new Error("offline"))
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
