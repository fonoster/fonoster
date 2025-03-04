import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { LinkBackTo } from "./LinkBackTo";
import React from "react";

const meta = {
  title: "Core Components/Buttons, Links, and Chips/LinkBackTo",
  component: LinkBackTo,
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=888-19698&m=dev"
    }
  },
  tags: ["autodocs"],
  args: { onClick: fn() },
  argTypes: {
    onClick: {
      name: "On Click",
      description: "Function to execute when clicking the link"
    },
    disabled: {
      name: "Disabled",
      description: "If true, the link will be disabled",
      control: "boolean",
      defaultValue: { summary: false }
    }
  }
} satisfies Meta<typeof LinkBackTo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state of the LinkBackTo component
 */
export const Default: Story = {
  args: {
    label: "Back to overview",
    disabled: false
  }
};

/**
 * Disabled state of the LinkBackTo component
 */
export const Disabled: Story = {
  args: {
    label: "Back to overview",
    disabled: true
  }
};
