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
import { AddWorkspaceCard } from "./workspace-card-empty";
import { fn } from "@storybook/test";
import { Box } from "@mui/material";

/**
 * This story is for the WorkspaceCard component based on Material UI.
 * It supports both regular and empty variants and can be disabled.
 */
const meta = {
  title: "Components/Workspaces/Add Workspace Card",
  component: AddWorkspaceCard,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=8-8505&p=f&t=NCJIzjsjMFiDAc1s-0"
    }
  },
  tags: ["autodocs"]
} satisfies Meta<typeof AddWorkspaceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of a regular WorkspaceCard with region, description, and date
 */
export const RegularCard: Story = {
  args: {
    disabled: false,
    onClick: fn()
  },
  render: (args) => (
    <Box sx={{ maxWidth: "325px", width: "100%", margin: "0 auto" }}>
      <AddWorkspaceCard {...args} />
    </Box>
  )
};
