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
import { NavButton } from "./NavButton";
import React from "react";

/**
 * This story is for the NavButton component which is used for navigation
 * in the AppBar. It is a button with an icon and a badge.
 */
const meta = {
  title: "Core Components/Icons, Badges, and Labels/NavButton",
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
    isOpen: {
      name: "Is Open",
      description: "Whether the button is open or not"
    },
    label: {
      name: "Label",
      description: "The badge content"
    },
    variant: {
      name: "Variant",
      description: "The type of button to render",
      control: {
        type: "select",
        options: ["notifications", "profile"]
      }
    }
  }
} satisfies Meta<typeof NavButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of a NavButton with a badge and an icon using the notifications variant and closed state.
 */
export const NotSelectedNotification: Story = {
  args: {
    isOpen: false,
    label: 10
  }
};

/**
 * Example of a NavButton using the profile variant and open state.
 */
export const ProfileVariant: Story = {
  args: {
    variant: "profile",
    isOpen: true,
    label: "PS"
  }
};
