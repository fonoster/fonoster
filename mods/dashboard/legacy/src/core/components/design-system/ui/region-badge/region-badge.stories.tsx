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
import { RegionBadge } from "./region-badge";

/**
 * This story is for the regular Button component based on Material UI.
 * It has a contained variant and full width with optional start and end icons.
 */
const meta = {
  title: "Components/Icons, Badges, & Labels/Region Badge",
  component: RegionBadge,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=301-13513"
    }
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      name: "Text",
      description: "The text to display"
    },
    type: {
      name: "Type",
      description: "The type of region label based on usage",
      control: {
        type: "select",
        options: ["landing-page", "drawer"]
      }
    }
  }
} satisfies Meta<typeof RegionBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of a RegionBadge for a drawer.
 */
export const DrawerExample: Story = {
  args: {
    children: "REGION",
    type: "drawer"
  }
};

/**
 * Example of a RegionBadge for a landing page.
 */
export const LandingPageExample: Story = {
  args: {
    children: "REGION",
    type: "landing-page"
  }
};
