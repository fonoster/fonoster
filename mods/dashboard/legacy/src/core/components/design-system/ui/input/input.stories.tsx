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
import { Input } from "./input";
import { fn } from "@storybook/test";
import { useState } from "react";
import { Icon } from "../../icons/icons";

const meta = {
  title: "Components/Forms/Input",
  component: Input,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=276-26263&t=VChSQK38URs4Ob0O-0"
    },
    docs: {
      description: {
        component:
          "Input component supporting icons, errors, supporting text, different types and sizes."
      }
    }
  },
  tags: ["autodocs"],
  args: {
    onClick: fn(),
    label: "Label",
    defaultValue: "Input text",
    disabled: false,
    error: false,
    type: "text",
    supportingText: "",
    size: "small"
  },
  argTypes: {
    onClick: {
      name: "onClick",
      description: "Function triggered on click",
      action: "clicked"
    },
    disabled: {
      name: "Disabled",
      description: "Whether the input is disabled",
      control: "boolean"
    },
    label: {
      name: "Label",
      description: "Label for the input field"
    },
    leadingIcon: {
      name: "Leading Icon",
      description: "Icon displayed at the start of the input",
      control: { disable: true }
    },
    trailingIcon: {
      name: "Trailing Icon",
      description: "Icon displayed at the end of the input",
      control: { disable: true }
    },
    defaultValue: {
      name: "Default Value",
      description: "Initial value of the input"
    },
    supportingText: {
      name: "Supporting Text",
      description: "Helper or error message shown below the input"
    },
    value: {
      name: "Value",
      description: "Controlled value for the input"
    },
    onChange: {
      name: "onChange",
      description: "Function triggered on value change"
    },
    type: {
      name: "Type",
      description: "Input type",
      control: { type: "select" },
      options: ["text", "password", "email", "number"]
    },
    error: {
      name: "Error",
      description: "If true, shows error styling",
      control: "boolean"
    },
    size: {
      name: "Size",
      description: "Input size",
      control: { type: "radio" },
      options: ["small", "medium"]
    }
  }
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ---

export const Default: Story = {
  args: {}
};

export const WithLabel: Story = {
  args: {
    label: "Username"
  }
};

export const WithLeadingIcon: Story = {
  args: {
    leadingIcon: <Icon name="Search" fontSize="small" />
  }
};

export const WithTrailingIcon: Story = {
  args: {
    trailingIcon: <Icon name="ArrowDropDown" fontSize="medium" />
  }
};

export const WithBothIcons: Story = {
  args: {
    leadingIcon: <Icon name="Search" fontSize="small" />,
    trailingIcon: <Icon name="ArrowDropDown" fontSize="medium" />
  }
};

export const WithSupportingText: Story = {
  args: {
    supportingText: "This is a hint for the input"
  }
};

export const WithErrorState: Story = {
  args: {
    error: true,
    supportingText: "Something went wrong!",
    defaultValue: "Invalid value"
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Cannot edit"
  }
};

export const PasswordType: Story = {
  args: {
    type: "password",
    label: "Password"
  }
};

export const NumberType: Story = {
  args: {
    type: "number",
    label: "Amount"
  }
};

export const ControlledInput: Story = {
  render: (args) => {
    const [value, setValue] = useState("Controlled");

    return (
      <Input
        {...args}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
  args: {
    label: "Controlled Input"
  }
};
