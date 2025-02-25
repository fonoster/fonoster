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
import { Tooltip } from "./Tooltip";
import React from "react";
import { Button } from "../button/Button";

/**
 * This story is for the Tooltip Component. It takes content, placement and children.
 */
const meta = {
  title: "Core Components/Modals and Popups/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=947-2396&t=FZpgQQ5oJZ2p3FGb-4"
    },
    tags: ["autodocs"],
    argTypes: {
      content: {
        name: "Content",
        description: "This is the content"
      },
      placement: {
        name: "Placement",
        description: "This is placement of the tooltip relative to the children"
      },
      children: {
        name: "Children",
        description: "This the component that requries the tooltip"
      }
    }
  }
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example to show Tooltip usage.
 */
export const Example: Story = {
  args: {
    content: "Request Video Call",
    placement: "top",
    children: React.createElement(Button, null, "Video call")
  }
};

/**
 * Example to show Tooltip top placement.
 */
export const Top: Story = {
  args: {
    content: "Request Video Call",
    placement: "top",
    children: React.createElement(Button, null, "Video call")
  }
};

/**
 * Example to show Tooltip right placement.
 */
export const Right: Story = {
  args: {
    content: "Request Video Call",
    placement: "right",
    children: React.createElement(Button, null, "Video call")
  }
};

/**
 * Example to show Tooltip left placement.
 */
export const Left: Story = {
  args: {
    content: "Request Video Call",
    placement: "left",
    children: React.createElement(Button, null, "Video call")
  }
};

/**
 * Example to show Tooltip bottom placement.
 */
export const Bottom: Story = {
  args: {
    content: "Request Video Call",
    placement: "bottom",
    children: React.createElement(Button, null, "Video call")
  }
};

/**
 * Example to show Multiline Tooltip top placement.
 */
export const MultilineTop: Story = {
  args: {
    content: [
      "Enable AI Assistance",
      "Request Video Call",
      "Request Audio Call"
    ],
    placement: "top",
    children: React.createElement(Button, null, "Enable AI,Video,Audio")
  }
};

/**
 * Example to show Multiline Tooltip right placement.
 */
export const MultilineRight: Story = {
  args: {
    content: [
      "Enable AI Assistance",
      "Request Video Call",
      "Request Audio Call"
    ],
    placement: "right",
    children: React.createElement(Button, null, "Enable AI,Video,Audio")
  }
};

/**
 * Example to show Multiline Tooltip left placement.
 */
export const MultilineLeft: Story = {
  args: {
    content: [
      "Enable AI Assistance",
      "Request Video Call",
      "Request Audio Call"
    ],
    placement: "left",
    children: React.createElement(Button, null, "Enable AI,Video,Audio")
  }
};

/**
 * Example to show Multiline Tooltip bottom placement.
 */
export const MultilineBottom: Story = {
  args: {
    content: [
      "Enable AI Assistance",
      "Request Video Call",
      "Request Audio Call"
    ],
    placement: "bottom",
    children: React.createElement(Button, null, "Enable AI,Video,Audio")
  }
};
