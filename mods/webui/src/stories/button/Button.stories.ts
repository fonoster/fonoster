import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "./Button";
import React from "react";
import { Icon } from "../icon/Icon";

/**
 * This story is for the regular Button component based on Material UI.
 * It has a contained variant and full width with optional start and end icons.
 */
const meta = {
  title: "Shared Components/Button",
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
    },
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Example of a button with a contained variant and full width
 */
export const ContainedWithFullWidth: Story = {
  args: {
    children: "Button contained with full width",
    variant: "contained",
    fullWidth: true,
    endIcon: React.createElement(Icon, { name: "AddIcon", fontSize: "small" })
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
