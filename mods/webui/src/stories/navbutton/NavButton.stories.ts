/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { NavButton } from "./NavButton";

/**
 * This story is for the NavButton component which is used for navigation
 * in the AppBar. It is a button with an icon and a badge.
 */
const meta = {
  title: "Shared Components/NavButton",
  component: NavButton,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=276-11172"
    }
  },
  tags: ["autodocs"],
  args: { onClick: fn() },
  argTypes: {
    onClick: {
      name: "On Click",
      description: "Function to execute on click"
    },
    isActive: {
      name: "Is Active",
      description: "Whether the button is active or not"
    },
    label: {
      name: "Label",
      description: "The badge content"
    }
  }
} satisfies Meta<typeof NavButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Example of a NavButton with a badge and an icon.
 */
export const ContainedWithFullWidth: Story = {
  args: {
    isActive: false,
    label: 10
  }
};
