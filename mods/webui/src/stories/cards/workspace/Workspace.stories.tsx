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
import { WorkspaceCard } from "./Workspace";
import { fn } from "@storybook/test";

/**
 * This story is for the WorkspaceCard component based on Material UI.
 * It supports both regular and empty variants and can be disabled.
 */
const meta = {
  title: "Shared Components/WorkspaceCard",
  component: WorkspaceCard,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=301-1817&t=eso3h9wj1XxZF3Vy-0"
    }
  },
  tags: ["autodocs"],
  args: { onClick: fn() },
  argTypes: {
    onClick: {
      name: "On Click",
      description: "Function to execute on click"
    },
    onSettingsClick: {
      name: "On Settings Click",
      description: "Function to execute on settings click"
    },
    workspaceRef: {
      name: "Workspace Ref",
      description: "The ref of the workspace card",
      control: "text",
      defaultValue: { summary: "workspaceRef" }
    },
    regularDetails: {
      name: "Regular Workspace Details",
      description: "The regular workspace details",
      control: "object",
      defaultValue: {
        summary: {
          region: "Region",
          description: "Demo Workspace With Wrapping Title.",
          date: new Date("October 13, 2025")
        }
      }
    },
    variant: {
      name: "Variant",
      description: "The variant to use",
      options: ["regular", "empty"],
      control: "radio",
      defaultValue: { summary: "regular" }
    },
    disabled: {
      name: "Disabled",
      description: "If true, the card will be disabled",
      control: "boolean",
      defaultValue: { summary: false }
    }
  }
} satisfies Meta<typeof WorkspaceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of a regular WorkspaceCard with regular details
 */
export const RegularCard: Story = {
  args: {
    regularDetails: {
      region: "Region",
      description: "Demo Workspace With Wrapping Title.",
      date: new Date("October 13, 2025")
    },
    variant: "regular",
    disabled: false,
    onSettingsClick: fn()
  }
};

/**
 * Example of an empty WorkspaceCard
 */
export const EmptyCard: Story = {
  args: {
    variant: "empty",
    disabled: false
  }
};

/**
 * Example of an empty WorkspaceCard that is disabled
 */
export const DisabledEmptyCard: Story = {
  args: {
    variant: "empty",
    disabled: true
  }
};
