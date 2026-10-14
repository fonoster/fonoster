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
import { WorkspaceCard } from "./workspace-card";
import { fn } from "@storybook/test";

/**
 * This story is for the WorkspaceCard component based on Material UI.
 * It supports both regular and empty variants and can be disabled.
 */
const meta = {
  title: "Components/Workspaces/Workspace Card",
  component: WorkspaceCard,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=8-8505&p=f&t=NCJIzjsjMFiDAc1s-0"
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
    region: {
      name: "Region",
      description: "The region label of the card",
      control: "text",
      defaultValue: { summary: "Region" }
    },
    description: {
      name: "Description",
      description: "The description of the workspace",
      control: "text",
      defaultValue: { summary: "Workspace description" }
    },
    date: {
      name: "Date",
      description: "The date associated with the workspace",
      control: "text",
      defaultValue: { summary: "4/14/24" }
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
 * Example of a regular WorkspaceCard with region, description, and date
 */
export const RegularCard: Story = {
  args: {
    region: "Region",
    description: "Demo Workspace With Wrapping Title.",
    date: "4/14/24",
    disabled: false,
    onSettingsClick: fn(),
    onClick: fn()
  },
  render: (args) => (
    <div style={{ maxWidth: "325px", width: "100%", margin: "0 auto" }}>
      <WorkspaceCard {...args} />
    </div>
  )
};

/**
 * Example of a regular WorkspaceCard that is disabled
 */
export const DisabledCard: Story = {
  args: {
    region: "Region",
    description: "Demo Workspace With Wrapping Title.",
    date: "4/14/24",
    disabled: true
  },
  render: (args) => (
    <div style={{ maxWidth: "325px", width: "100%", margin: "0 auto" }}>
      <WorkspaceCard {...args} />
    </div>
  )
};
