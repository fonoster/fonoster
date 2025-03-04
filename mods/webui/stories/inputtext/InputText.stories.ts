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
import { InputText } from "./InputText";
import { fn } from "@storybook/test";
import React from "react";
import { Icon } from "../icon/Icon";

/**
 * This file is a storybook file for the InputText component.
 */
const meta = {
  title: "Core Components/Inputs and Checkbox/InputText",
  component: InputText,
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
    defaultValue: "Input"
  },
  argTypes: {
    onClick: {
      name: "On Click",
      description: "Function to execute on click"
    },
    disabled: {
      name: "Disabled",
      description: "Disables the input",
      control: "boolean"
    },
    label: {
      name: "Label",
      description: "Label for the input"
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
    defaultValue: {
      name: "Default Value",
      description: "Default value for the input"
    },
    supportingText: {
      name: "Supporting Text",
      description: "Supporting text for the input"
    },
    value: {
      name: "Value",
      description: "Value for the input"
    },
    onChange: {
      name: "On Change",
      description: "Function to execute on change"
    },
    type: {
      name: "Type",
      description: "Type of input",
      control: "select",
      options: ["text", "password", "email", "number"]
    },
    error: {
      name: "Error",
      description: "Error state of the input",
      control: "boolean"
    },
    shrink: {
      name: "Shrink",
      description: "The input label `shrink` state isn't always correct. The input label is supposed to shrink as soon as the input is displaying something. In some circumstances, we can't determine the `shrink` state (number input, datetime input, Stripe input). You might notice an overlap.",
      control: "boolean",
      defaultValue: false
    }
  }
} satisfies Meta<typeof InputText>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default story for the InputText component.
 */
export const Default: Story = {
  args: {
    label: null
  }
};

/**
 * Default story for the InputText component.
 */
export const WithLabel: Story = {};

/**
 * Example of an InputText component with a trailing icon.
 */
export const TrailingIcon: Story = {
  args: {
    trailingIcon: React.createElement(Icon, {
      name: "ArrowDropDown",
      fontSize: "medium"
    })
  }
};

/**
 * Example of an InputText component with a trailing icon and supporting text.
 */
export const TrailingIconAndSupportingText: Story = {
  args: {
    supportingText: "Supporting text",
    trailingIcon: React.createElement(Icon, {
      name: "ArrowDropDown",
      fontSize: "medium"
    })
  }
};

/**
 * Example for an InputText component with a leading icon, trailing icon, and supporting text.
 */
export const LeadingAndTrailingIconAndSupportingText: Story = {
  args: {
    supportingText: "Supporting text",
    leadingIcon: React.createElement(Icon, {
      name: "Search",
      fontSize: "small"
    }),
    trailingIcon: React.createElement(Icon, {
      name: "ArrowDropDown",
      fontSize: "medium"
    })
  }
};

/**
 * Example for an InputText component with a leading icon.
 */
export const LeadingIcon: Story = {
  args: {
    leadingIcon: React.createElement(Icon, {
      name: "Search",
      fontSize: "small"
    })
  }
};

/**
 * Example for an InputText component with an error state.
 */
export const WithError: Story = {
  args: {
    error: true,
    supportingText: "Error message goes here",
    defaultValue: "Invalid input"
  }
};

/**
 * Example for an InputText component with a shrink state.
 */
export const Shrink: Story = {
  args: {
    shrink: true,
  }
};

