import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";
import { fn } from "@storybook/test";
import React from "react";
import { Icon } from "../icon/Icon";

const meta = {
  title: "Core Components/Inputs and Checkbox/Select",
  component: Select,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=276-26263&t=VChSQK38URs4Ob0O-0"
    }
  },
  tags: ["autodocs"],
  args: {
    onClick: fn(),
    label: "Label",
    options: [
      { value: "1", label: "Option 1" },
      { value: "2", label: "Option 2" },
      { value: "3", label: "Option 3" }
    ]
  },
  argTypes: {
    onClick: {
      name: "On Click",
      description: "Function to execute on click"
    },
    disabled: {
      name: "Disabled",
      description: "Disables the select",
      control: "boolean"
    },
    label: {
      name: "Label",
      description: "Label for the select"
    },
    leadingIcon: {
      table: {
        disable: true
      }
    },
    trailingIcon: {
      table: {
        disable: true
      }
    },
    supportingText: {
      name: "Supporting Text",
      description: "Supporting text for the select"
    },
    error: {
      name: "Error",
      description: "Error state of the select",
      control: "boolean"
    }
  }
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: "Select Option"
  }
};

export const WithLeadingIcon: Story = {
  args: {
    leadingIcon: React.createElement(Icon, {
      name: "Search",
      fontSize: "small"
    })
  }
};

export const WithError: Story = {
  args: {
    error: true,
    supportingText: "Error message goes here"
  }
};

export const WithSupportingText: Story = {
  args: {
    supportingText: "Supporting text goes here"
  }
};

export const Disabled: Story = {
  args: {
    disabled: true
  }
}; 