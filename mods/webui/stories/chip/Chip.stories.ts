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
import { Chip } from "./Chip";
import { fn } from "@storybook/test";
import React from "react";

/**
 * This story is for the Chip component based on MUI chip component
 * It takes a label, onRemove and enabled.
 */
const meta = {
  title: "Core Components/Buttons, Links, and Chips/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=888-3695&t=k7cH6w6QU34fWv5z-4"
    }
  },
  tags: ["autodocs"],
  args: { onRemove: fn() },
  argTypes: {
    onRemove: {
      name: "On Remove",
      description: "Function to execute on remove"
    },
    enabled: {
      name: "Enabled",
      description: "If true, the chip will be enabled",
      control: "boolean"
    },
    label: {
      name: "Label",
      description: "The label to display",
      control: "text"
    }
  }
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of a Chip with label "Chip" and enabled true.
 */
export const Enabled: Story = {
  args: {
    label: "material-chip-example",
    enabled: true
  }
};

/**
 * Example of a Chip with label "Chip" and enabled false.
 */
export const Disabled: Story = {
  args: {
    label: "material-chip-example",
    enabled: false
  }
};

/**
 * Example of a Chip with label "Chip" and onRemove function.
 */
export const WithOnRemove: Story = {
  args: {
    label: "material-chip-example",
    enabled: true,
    onRemove: fn()
  }
};
