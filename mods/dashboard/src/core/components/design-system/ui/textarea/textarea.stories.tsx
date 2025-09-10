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
import { Textarea } from "./textarea";

const meta = {
  title: "Components/Forms/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded"
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      name: "Label",
      description: "The label for the textarea",
      control: { type: "text" }
    },
    placeholder: {
      name: "Placeholder",
      description: "The placeholder text",
      control: { type: "text" }
    },
    disabled: {
      name: "Disabled",
      description: "Whether the textarea is disabled",
      control: { type: "boolean" }
    },
    error: {
      name: "Error",
      description: "Whether the textarea has an error state",
      control: { type: "boolean" }
    },
    helperText: {
      name: "Helper Text",
      description: "Helper text to display below the textarea",
      control: { type: "text" }
    },
    required: {
      name: "Required",
      description: "Whether the textarea is required",
      control: { type: "boolean" }
    },
    rows: {
      name: "Rows",
      description: "Number of rows to display",
      control: { type: "number" }
    },
    maxLength: {
      name: "Max Length",
      description: "Maximum number of characters allowed",
      control: { type: "number" }
    }
  }
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default textarea
 */
export const Default: Story = {
  args: {
    label: "Description",
    placeholder: "Enter your description here...",
    onChange: action("onChange")
  }
};

/**
 * Textarea with value
 */
export const WithValue: Story = {
  args: {
    label: "Description",
    placeholder: "Enter your description here...",
    value: "This is some sample text in the textarea",
    onChange: action("onChange")
  }
};

/**
 * Required textarea
 */
export const Required: Story = {
  args: {
    label: "Description",
    placeholder: "Enter your description here...",
    required: true,
    onChange: action("onChange")
  }
};

/**
 * Textarea with helper text
 */
export const WithHelperText: Story = {
  args: {
    label: "Description",
    placeholder: "Enter your description here...",
    helperText: "Provide a detailed description (max 500 characters)",
    onChange: action("onChange")
  }
};

/**
 * Textarea with error
 */
export const WithError: Story = {
  args: {
    label: "Description",
    placeholder: "Enter your description here...",
    error: true,
    helperText: "This field is required",
    onChange: action("onChange")
  }
};

/**
 * Disabled textarea
 */
export const Disabled: Story = {
  args: {
    label: "Description",
    placeholder: "Enter your description here...",
    disabled: true,
    value: "This textarea is disabled",
    onChange: action("onChange")
  }
};

/**
 * Large textarea
 */
export const Large: Story = {
  args: {
    label: "Long Description",
    placeholder: "Enter a long description here...",
    rows: 8,
    onChange: action("onChange")
  }
};

/**
 * Textarea with character limit
 */
export const WithCharacterLimit: Story = {
  args: {
    label: "Short Description",
    placeholder: "Enter a short description...",
    maxLength: 100,
    helperText: "Maximum 100 characters",
    onChange: action("onChange")
  }
};
