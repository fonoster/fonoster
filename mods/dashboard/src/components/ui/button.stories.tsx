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
import { Plus, X } from "lucide-react";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  parameters: { layout: "padded" }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The two places a filled button sits next to a dark one in the app. */
function Pairings({ primary }: { primary?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <div className="flex gap-2.5">
        <Button variant="ghost">Cancel</Button>
        <Button className={primary}>Create number</Button>
      </div>
      <div className="flex gap-2.5">
        <Button className={primary}>
          <Plus aria-hidden /> Create number
        </Button>
        <Button variant="outline">Link number</Button>
      </div>
    </div>
  );
}

function Row({ label, primary }: { label: string; primary?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <Pairings primary={primary} />
    </section>
  );
}

/**
 * Every button box is 40px high with 16px side padding. The outline variant
 * draws its dark fill inside a 1px border, so the bright green fill without
 * one reads larger. The fix gives every button a 1px transparent border so
 * both fills occupy the same inner box.
 */
export const OpticalSize: Story = {
  name: "Optical size",
  render: () => (
    <div className="flex flex-col gap-10">
      <Row
        label="Before: green fill edge to edge"
        primary="border-0 bg-clip-border"
      />
      <Row label="After: 1px transparent border on filled buttons" />
    </div>
  )
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="ghost" size="icon" aria-label="Remove">
        <X aria-hidden />
      </Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
      <Button loading>Loading</Button>
    </div>
  )
};
