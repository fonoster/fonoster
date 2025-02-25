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
import { fn } from "@storybook/test";
import React from "react";
import { Button } from "./Button";
import { Icon } from "../icon/Icon";

/**
 * This story is for the regular Button component based on Material UI.
 * It has a contained variant and full width with optional start and end icons.
 */
const meta = {
  title: "Core Components/Buttons, Links, and Chips/Button",
  component: Button,
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=9-9052&node-type=frame&m=dev"
    }
  },
  tags: ["autodocs"],
  args: { onClick: fn() },
  argTypes: {
    onClick: {
      name: "On Click",
      description: "Function to execute on click"
    },
    children: {
      name: "Children",
      description: "The content of the button",
      control: "text",
      defaultValue: { summary: "Button" }
    },
    size: {
      name: "Size",
      description: "The size of the button",
      options: ["small", "large"],
      control: "radio",
      defaultValue: { summary: "Large" }
    },
    variant: {
      name: "Variant",
      description: "The variant to use",
      options: ["contained", "outlined"],
      control: "radio",
      defaultValue: { summary: "contained" }
    },
    fullWidth: {
      name: "Full Width",
      description:
        "If true, the button will take up the full width of its container",
      control: "boolean",
      defaultValue: { summary: false }
    },
    disabled: {
      name: "Disabled",
      description: "If true, the button will be disabled",
      control: "boolean",
      defaultValue: { summary: false }
    },
    endIcon: {
      table: {
        disable: true
      }
    },
    startIcon: {
      table: {
        disable: true
      }
    }
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Example of a button with a contained variant and disabled
 */
export const ContainedAndDisabled: Story = {
  args: {
    children: "Button Contained And Disabled",
    variant: "contained",
    fullWidth: false,
    disabled: true
  }
};

/**
 * Example of a button with a contained variant and full width
 */
export const ContainedWithFullWidth: Story = {
  args: {
    children: "Button contained with full width",
    variant: "contained",
    fullWidth: true,
    endIcon: React.createElement(Icon, { name: "Add", fontSize: "small" })
  }
};

/**
 * Example of a button with an outlined variant and full width
 */
export const Outlined: Story = {
  args: {
    children: "Button Outlined",
    variant: "outlined",
    fullWidth: false
  }
};

/**
 * Example of a button with an outlined variant and disabled
 */
export const OutlinedAndDisabled: Story = {
  args: {
    children: "Button Outlined And Disabled",
    variant: "outlined",
    fullWidth: false,
    disabled: true
  }
};
