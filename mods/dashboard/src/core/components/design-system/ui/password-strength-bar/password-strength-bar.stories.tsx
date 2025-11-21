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
import { PasswordStrengthBar } from "./password-strength-bar";

const meta = {
  title: "Components/Forms/Password Strength Bar",
  component: PasswordStrengthBar,
  parameters: {
    layout: "padded"
  },
  tags: ["autodocs"],
  argTypes: {
    password: {
      name: "Password",
      description: "The password to check strength for",
      control: { type: "text" },
      table: {
        defaultValue: {
          summary: ""
        }
      }
    }
  }
} satisfies Meta<typeof PasswordStrengthBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Empty password - no strength
 */
export const Empty: Story = {
  args: {
    password: ""
  }
};

/**
 * Weak password
 */
export const Weak: Story = {
  args: {
    password: "123"
  }
};

/**
 * Fair password
 */
export const Fair: Story = {
  args: {
    password: "password"
  }
};

/**
 * Good password
 */
export const Good: Story = {
  args: {
    password: "Password123"
  }
};

/**
 * Strong password
 */
export const Strong: Story = {
  args: {
    password: "MyStr0ng!P@ssw0rd"
  }
};
