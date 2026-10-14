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
import { action } from "@storybook/addon-actions";
import { Select } from "./select";

const meta = {
  title: "Components/Forms/Select",
  component: Select,
  parameters: {
    layout: "padded"
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      name: "Label",
      description: "The label for the select field",
      control: { type: "text" }
    },
    placeholder: {
      name: "Placeholder",
      description: "The placeholder text",
      control: { type: "text" }
    },
    disabled: {
      name: "Disabled",
      description: "Whether the select is disabled",
      control: { type: "boolean" }
    },
    error: {
      name: "Error",
      description: "Whether the select has an error state",
      control: { type: "boolean" }
    },
    helperText: {
      name: "Helper Text",
      description: "Helper text to display below the select",
      control: { type: "text" }
    },
    required: {
      name: "Required",
      description: "Whether the select is required",
      control: { type: "boolean" }
    }
  }
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleOptions = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
  { value: "option4", label: "Option 4" }
];

/**
 * Default select
 */
export const Default: Story = {
  args: {
    label: "Choose an option",
    placeholder: "Select an option...",
    options: sampleOptions,
    onChange: action("onChange")
  }
};

/**
 * Select with value
 */
export const WithValue: Story = {
  args: {
    label: "Choose an option",
    placeholder: "Select an option...",
    options: sampleOptions,
    value: "option2",
    onChange: action("onChange")
  }
};

/**
 * Required select
 */
export const Required: Story = {
  args: {
    label: "Choose an option",
    placeholder: "Select an option...",
    options: sampleOptions,
    required: true,
    onChange: action("onChange")
  }
};

/**
 * Select with helper text
 */
export const WithHelperText: Story = {
  args: {
    label: "Choose an option",
    placeholder: "Select an option...",
    options: sampleOptions,
    helperText: "This is helper text to guide the user",
    onChange: action("onChange")
  }
};

/**
 * Select with error
 */
export const WithError: Story = {
  args: {
    label: "Choose an option",
    placeholder: "Select an option...",
    options: sampleOptions,
    error: true,
    helperText: "This field is required",
    onChange: action("onChange")
  }
};

/**
 * Disabled select
 */
export const Disabled: Story = {
  args: {
    label: "Choose an option",
    placeholder: "Select an option...",
    options: sampleOptions,
    disabled: true,
    onChange: action("onChange")
  }
};
