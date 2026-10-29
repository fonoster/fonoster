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
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

const classes = (name: string) =>
  screen.getByRole("button", { name }).className.split(" ");

describe("Button", () => {
  it("insets every fill by a 1px transparent border", () => {
    render(
      <>
        <Button>Create</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Delete</Button>
      </>
    );
    for (const name of ["Create", "Secondary", "Delete"]) {
      expect(classes(name)).toEqual(
        expect.arrayContaining([
          "border",
          "border-transparent",
          "bg-clip-padding"
        ])
      );
    }
  });

  it("keeps a visible border on outline buttons", () => {
    render(<Button variant="outline">Link number</Button>);
    expect(classes("Link number")).toEqual(
      expect.arrayContaining(["border", "border-border"])
    );
  });

  it("shows the border on ghost buttons only on hover", () => {
    render(<Button variant="ghost">Cancel</Button>);
    const ghost = classes("Cancel");
    expect(ghost).toContain("hover:border-border");
    expect(ghost).not.toContain("border-border");
  });

  it("draws no border on link buttons", () => {
    render(<Button variant="link">Learn more</Button>);
    expect(classes("Learn more")).toContain("border-0");
  });
});
