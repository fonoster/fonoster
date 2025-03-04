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
import { VersionLabel } from "./VersionLabel";
import React from "react";

/**
 * This story is for the regular Button component based on Material UI.
 * It has a contained variant and full width with optional start and end icons.
 */
const meta = {
  title: "Core Components/Icons, Badges, and Labels/VersionLabel",
  component: VersionLabel,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=607-3145"
    }
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      name: "Text",
      description: "The text to display"
    }
  }
} satisfies Meta<typeof VersionLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Example of a VersionLabel with a body large variant.
 */
export const VersionLabelExample: Story = {
  args: {
    children: "© 2024, Fonoster. v0.9.0"
  }
};
