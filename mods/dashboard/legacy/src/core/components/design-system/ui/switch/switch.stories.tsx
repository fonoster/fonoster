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
import { fn } from "@storybook/test";
import { Switch } from "./switch";

/**
 * This story is for the Generic Toggle component based on MUI switch component
 * It takes a defaultValue, value, disabled and onChange.
 */
const meta = {
  title: "Components/Forms/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=922-10844&m=dev"
    }
  },
  tags: ["autodocs"],
  args: { onChange: fn() },
  argTypes: {
    defaultValue: {
      name: "Default Value",
      control: "boolean",
      description: "The default value to use"
    },
    value: {
      name: "Value",
      control: "boolean",
      description: "The current value"
    },
    disabled: {
      name: "Disabled",
      description: "If true, the toggle will be disabled",
      control: "boolean"
    }
  }
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of a GenericToggle with defaultValue false.
 */
export const DefaultValueFalse: Story = {
  args: {
    defaultValue: false
  }
};

/**
 * Example of a GenericToggle with defaultValue true.
 */
export const DefaultValueTrue: Story = {
  args: {
    defaultValue: true
  }
};

/**
 * Example of a checked GenericToggle.
 */
export const Checked: Story = {
  args: {
    value: true
  }
};

/**
 * Example of a unchecked GenericToggle.
 */
export const Unchecked: Story = {
  args: {
    value: false
  }
};

/**
 * Example of a unchecked and disabled GenericToggle.
 */
export const UncheckedAndDisabled: Story = {
  args: {
    disabled: true,
    value: false
  }
};

/**
 * Example of a checked and disabled GenericToggle.
 */
export const CheckedAndDisabled: Story = {
  args: {
    disabled: true,
    value: true
  }
};
