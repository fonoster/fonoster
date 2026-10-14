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
import { FormSubmitButton } from "./form-submit-button";

const meta = {
  title: "Components/Forms/Form Submit Button",
  component: FormSubmitButton,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"],
  argTypes: {
    isLoading: {
      name: "Is Loading",
      description: "Whether the button is in a loading state",
      control: { type: "boolean" },
      table: {
        defaultValue: {
          summary: "false"
        }
      }
    },
    disabled: {
      name: "Disabled",
      description: "Whether the button is disabled",
      control: { type: "boolean" },
      table: {
        defaultValue: {
          summary: "false"
        }
      }
    },
    children: {
      name: "Content",
      description: "The content of the button",
      control: { type: "text" },
      table: {
        defaultValue: {
          summary: "Submit"
        }
      }
    }
  }
} satisfies Meta<typeof FormSubmitButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default form submit button
 */
export const Default: Story = {
  args: {
    children: "Submit",
    onClick: action("onClick")
  }
};

/**
 * Loading form submit button
 */
export const Loading: Story = {
  args: {
    children: "Submitting...",
    isLoading: true,
    onClick: action("onClick")
  }
};

/**
 * Disabled form submit button
 */
export const Disabled: Story = {
  args: {
    children: "Submit",
    disabled: true,
    onClick: action("onClick")
  }
};
