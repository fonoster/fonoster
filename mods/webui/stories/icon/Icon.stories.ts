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
import { Icon } from "./Icon";
import React from "react";

/**
 * This story is for the Icon component based on Material UI.
 * It can be used to display icons in the application with different sizes.
 */
const meta = {
  title: "Core Components/Icons, Badges, and Labels/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=284-10528"
    }
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      name: "Icon Name",
      description: "The icon to display",
      control: {
        type: "select"
      },
      defaultValue: "Add"
    },
    fontSize: {
      name: "Font Size",
      description: "The size of the icon",
      control: {
        type: "select",
        options: ["small", "medium", "large"]
      },
      defaultValue: "medium"
    }
  }
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of an icon with the name "Add" and a medium font size.
 */
export const PlusIcon: Story = {
  args: {
    name: "Add",
    fontSize: "medium"
  }
};
