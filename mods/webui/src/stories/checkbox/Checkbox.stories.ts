/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 */
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Checkbox } from "./Checkbox";

/**
 * This story is for the Checkbox component based on Material UI.
 * It has a checkbox with optional label and can be in a checked or disabled state.
 */
const meta = {
  title: "Shared Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=276-26951&m=dev"
    }
  },
  tags: ["autodocs"],
  args: { onChange: fn() },
  argTypes: {
    onChange: {
      name: "On Change",
      description: "Function to execute on change"
    },
    checked: {
      name: "Checked",
      description: "Whether the checkbox is checked",
      control: "boolean",
      defaultValue: { summary: false }
    },
    disabled: {
      name: "Disabled",
      description: "Whether the checkbox is disabled",
      control: "boolean",
      defaultValue: { summary: false }
    },
    children: {
      name: "Children",
      description: "The label of the checkbox",
      control: "text",
      defaultValue: { summary: "Checkbox Label" }
    }
  }
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Example of a checked checkbox
 */
export const Checked: Story = {
  args: {
    checked: true,
    children: "Agree to the terms and conditions"
  }
};

/**
 * Example of a disabled checkbox
 */
export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    children: "Agree to the terms and conditions"
  }
};

export const NoLabel: Story = {
  args: {
    checked: true
  }
};
