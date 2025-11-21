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
import { GoBackButton } from "./go-back";

const meta = {
  title: "Components/Navigation/Go Back",
  component: GoBackButton,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      name: "Label",
      description: "The text label for the go back button",
      control: { type: "text" },
      table: {
        defaultValue: {
          summary: "Go back"
        }
      }
    }
  }
} satisfies Meta<typeof GoBack>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default go back button
 */
export const Default: Story = {
  args: {
    label: "Go back",
    onClick: action("onClick")
  }
};

/**
 * Go back with custom label
 */
export const CustomLabel: Story = {
  args: {
    label: "Back to dashboard",
    onClick: action("onClick")
  }
};

/**
 * Go back to specific page
 */
export const BackToList: Story = {
  args: {
    label: "Back to list",
    onClick: action("onClick")
  }
};
