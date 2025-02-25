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
import { OverviewCard } from "./OverviewCard";
import { Icon } from "../icon/Icon";
import React from "react";

/**
 * This story is for the OverviewCard component. It takes a label, icon and onClick.
 */
const meta = {
  title: "Core Components/Cards/OverviewCard",
  component: OverviewCard,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=888-20517&m=dev"
    }
  },
  tags: ["autodocs"],
  args: { onClick: fn() },
  argTypes: {
    onClick: {
      name: "On Click",
      description: "Function to execute on click"
    },
    icon: {
      name: "Icon",
      description: "The icon on the card"
    },
    label: {
      name: "Label",
      control: "text",
      description: "The label of the card"
    }
  }
} satisfies Meta<typeof OverviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example to show OverviewCard.
 */
export const Example: Story = {
  args: {
    label: "Workspace setting",
    icon: React.createElement(Icon, {
      name: "Settings",
      fontSize: "small"
    })
  }
};

/**
 * Example to show OverviewCard with new Icon.
 */
export const ChangeIcon: Story = {
  args: {
    label: "Workspace setting",
    icon: React.createElement(Icon, {
      name: "Search",
      fontSize: "small"
    })
  }
};

/**
 * Example to show OverviewCard with new Icon and label.
 */
export const ChangeIconAndLabel: Story = {
  args: {
    label: "Notification setting",
    icon: React.createElement(Icon, {
      name: "NotificationsActive",
      fontSize: "small"
    })
  }
};
