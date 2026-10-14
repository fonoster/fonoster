/*
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
import { Divider } from "./divider";

const meta = {
  title: "Components/Layout/Divider",
  component: Divider,
  parameters: {
    layout: "padded"
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      name: "Orientation",
      description: "The orientation of the divider",
      control: { type: "select" },
      options: ["horizontal", "vertical"],
      table: {
        defaultValue: {
          summary: "horizontal"
        }
      }
    },
    variant: {
      name: "Variant",
      description: "The variant of the divider",
      control: { type: "select" },
      options: ["fullWidth", "inset", "middle"],
      table: {
        defaultValue: {
          summary: "fullWidth"
        }
      }
    }
  }
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default horizontal divider
 */
export const Default: Story = {
  render: () => (
    <div style={{ width: "300px" }}>
      <div>Content above</div>
      <Divider />
      <div>Content below</div>
    </div>
  )
};

/**
 * Vertical divider
 */
export const Vertical: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", height: "50px" }}>
      <span>Left content</span>
      <Divider orientation="vertical" />
      <span>Right content</span>
    </div>
  )
};

/**
 * Inset divider
 */
export const Inset: Story = {
  render: () => (
    <div style={{ width: "300px" }}>
      <div>Content above</div>
      <Divider variant="inset" />
      <div>Content below</div>
    </div>
  )
};

/**
 * Middle divider
 */
export const Middle: Story = {
  render: () => (
    <div style={{ width: "300px" }}>
      <div>Content above</div>
      <Divider variant="middle" />
      <div>Content below</div>
    </div>
  )
};
